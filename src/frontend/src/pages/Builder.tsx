import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  useGenerateApp,
  useGeneration,
  useSaveGeneration,
} from "@/hooks/useBackend";
import type { GenerationResult, TabId } from "@/types/index";
import { useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  Copy,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ── Deployment steps ──────────────────────────────────────────────────────────
const DEPLOY_STEPS = [
  {
    step: 1,
    title: "Install dfx CLI",
    cmd: 'sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"',
  },
  {
    step: 2,
    title: "Clone & install dependencies",
    cmd: "git clone <your-repo> && cd <your-repo> && pnpm install",
  },
  {
    step: 3,
    title: "Start local replica",
    cmd: "dfx start --background",
  },
  {
    step: 4,
    title: "Deploy backend canister",
    cmd: "dfx deploy backend",
  },
  {
    step: 5,
    title: "Build & deploy frontend",
    cmd: "pnpm build && dfx deploy frontend",
  },
];

// ── Tab config ─────────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <Sparkles className="w-3.5 h-3.5" />,
  },
  {
    id: "architecture",
    label: "Architecture",
    icon: <Layers className="w-3.5 h-3.5" />,
  },
  {
    id: "code",
    label: "Code Preview",
    icon: <Code2 className="w-3.5 h-3.5" />,
  },
];

// ── Loading skeletons ──────────────────────────────────────────────────────────
function ResultSkeleton() {
  return (
    <div className="space-y-4 p-6" data-ocid="result-skeleton">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
      <div className="pt-4 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/5" />
      </div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ overview }: { overview: GenerationResult["overview"] }) {
  return (
    <div className="p-6 space-y-6" data-ocid="tab-overview">
      <section>
        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Concept
        </p>
        <p className="text-foreground leading-relaxed font-body">
          {overview.concept}
        </p>
      </section>
      <section>
        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Target Users
        </p>
        <p className="text-foreground font-body">{overview.targetUsers}</p>
      </section>
      <section>
        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Key Features
        </p>
        <ul className="space-y-2">
          {overview.keyFeatures.map((feat) => (
            <li key={feat} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span className="text-foreground font-body text-sm">{feat}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ── Architecture tab ──────────────────────────────────────────────────────────
function ArchitectureTab({ arch }: { arch: GenerationResult["architecture"] }) {
  return (
    <div className="p-6 space-y-6" data-ocid="tab-architecture">
      <section>
        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-2">
          System Design
        </p>
        <p className="text-foreground leading-relaxed font-body">
          {arch.systemDesign}
        </p>
      </section>
      <section>
        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Tech Stack
        </p>
        <div className="flex flex-wrap gap-2">
          {arch.techStack.map((tech) => (
            <Badge
              key={tech}
              variant="secondary"
              className="font-mono text-xs border border-border px-2.5 py-1"
            >
              {tech}
            </Badge>
          ))}
        </div>
      </section>
      <section>
        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Data Flow
        </p>
        <p className="text-foreground leading-relaxed font-body">
          {arch.dataFlow}
        </p>
      </section>
    </div>
  );
}

// ── Code Preview tab ──────────────────────────────────────────────────────────
function CodePreviewTab({
  snippets,
}: { snippets: GenerationResult["codeSnippets"] }) {
  const [copied, setCopied] = useState<string | null>(null);

  function copyCode(filename: string, code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(filename);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="divide-y divide-border" data-ocid="tab-code">
      {snippets.map((snippet) => (
        <div key={snippet.filename} className="group">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border">
            <span className="font-mono text-xs text-foreground tracking-tight">
              {snippet.filename}
            </span>
            <button
              type="button"
              onClick={() => copyCode(snippet.filename, snippet.code)}
              aria-label={`Copy ${snippet.filename}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded px-1"
              data-ocid="copy-code-btn"
            >
              {copied === snippet.filename ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                  <span className="font-mono">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="font-mono">Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 text-xs font-mono leading-relaxed bg-foreground/[0.06] text-foreground dark:bg-muted dark:text-accent">
            <code>{snippet.code}</code>
          </pre>
        </div>
      ))}
    </div>
  );
}

// ── Deployment instructions ───────────────────────────────────────────────────
function DeploymentInstructions() {
  return (
    <div
      className="mt-8 border border-border rounded-lg overflow-hidden"
      data-ocid="deploy-instructions"
    >
      <div className="px-5 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Deployment Instructions
        </span>
      </div>
      <ol className="divide-y divide-border">
        {DEPLOY_STEPS.map(({ step, title, cmd }) => (
          <li key={step} className="flex items-start gap-4 px-5 py-4">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-mono text-xs font-bold">
              {step}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-body font-medium text-sm text-foreground mb-1">
                {title}
              </p>
              <code className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-1 rounded break-all block">
                {cmd}
              </code>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Main Builder page ─────────────────────────────────────────────────────────
export default function Builder() {
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [saved, setSaved] = useState(false);

  const { isAuthenticated, login } = useAuth();
  const generateApp = useGenerateApp();
  const saveGeneration = useSaveGeneration();

  // Read optional ?generationId= search param from URL (e.g. navigate from My Apps)
  const search = useSearch({ strict: false }) as { generationId?: string };
  const viewId = search.generationId ? BigInt(search.generationId) : null;
  const { data: savedGeneration, isLoading: isLoadingSaved } =
    useGeneration(viewId);

  // When a saved generation loads, hydrate the results panel
  useEffect(() => {
    if (!savedGeneration) return;
    setPrompt(savedGeneration.prompt);
    setResult({
      overview: savedGeneration.overview,
      architecture: savedGeneration.architecture,
      codeSnippets: savedGeneration.codeSnippets,
    });
    setSaved(true);
    setActiveTab("overview");
  }, [savedGeneration]);

  const charCount = prompt.length;
  const canGenerate = charCount >= 10 && !generateApp.isPending;
  const isLoading = generateApp.isPending || isLoadingSaved;
  const hasError = generateApp.isError;

  async function handleGenerate() {
    if (!canGenerate) return;
    setSaved(false);
    setResult(null);
    try {
      const data = await generateApp.mutateAsync(prompt);
      setResult(data);
      setActiveTab("overview");
    } catch {
      // error state handled via generateApp.isError
    }
  }

  async function handleSave() {
    if (!result) return;
    if (!isAuthenticated) {
      login();
      return;
    }
    const res = await saveGeneration.mutateAsync({
      prompt,
      overview: result.overview,
      architecture: result.architecture,
      codeSnippets: result.codeSnippets,
    });
    if (res.__kind__ === "ok") {
      setSaved(true);
      toast.success("Generation saved to My Apps!");
    } else {
      toast.error(`Save failed: ${res.err}`);
    }
  }

  function handleNewGeneration() {
    setPrompt("");
    setResult(null);
    setSaved(false);
    generateApp.reset();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl tracking-tight text-foreground mb-1">
          AI App Builder
        </h1>
        <p className="text-muted-foreground font-body text-sm">
          Describe your app and let AI generate the full-stack architecture,
          code, and deployment plan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
        {/* LEFT — Prompt input */}
        <div className="space-y-5">
          <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                App Description
              </span>
            </div>
            <div className="p-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your AI app here…&#10;&#10;e.g. A task management app with AI-powered priority scoring, real-time collaboration, and smart deadline suggestions."
                className="min-h-[200px] resize-none font-body text-sm bg-background border-input focus-visible:ring-accent placeholder:text-muted-foreground/60"
                maxLength={1000}
                data-ocid="prompt-input"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {charCount < 10
                    ? `${10 - charCount} more chars needed`
                    : `${charCount} / 1000`}
                </span>
                <span
                  className={`text-xs font-mono ${
                    charCount > 900
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {charCount > 0 && `${1000 - charCount} left`}
                </span>
              </div>
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full h-12 font-display font-bold text-base tracking-tight bg-accent text-accent-foreground hover:bg-accent/90 transition-smooth disabled:opacity-40"
            data-ocid="generate-btn"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate App
              </>
            )}
          </Button>

          {/* Error state */}
          {hasError && !isLoading && (
            <div
              className="flex items-start gap-3 p-4 rounded-lg border border-destructive/40 bg-destructive/5"
              data-ocid="error-banner"
            >
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-medium text-foreground mb-1">
                  Generation failed
                </p>
                <p className="font-body text-xs text-muted-foreground line-clamp-2">
                  {generateApp.error?.message ??
                    "An unexpected error occurred. Please try again."}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerate}
                className="shrink-0 font-mono text-xs"
                data-ocid="retry-btn"
              >
                <RefreshCw className="w-3 h-3 mr-1.5" />
                Retry
              </Button>
            </div>
          )}

          {/* Post-result actions */}
          {result && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleNewGeneration}
                className="flex-1 font-mono text-sm"
                data-ocid="new-generation-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Generation
              </Button>
              <Button
                onClick={handleSave}
                disabled={saved || saveGeneration.isPending}
                className="flex-1 font-mono text-sm bg-foreground text-background hover:bg-foreground/90 transition-smooth"
                data-ocid="save-btn"
              >
                {saveGeneration.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : saved ? (
                  <CheckCircle2 className="w-4 h-4 mr-2 text-accent" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saved
                  ? "Saved!"
                  : isAuthenticated
                    ? "Save to My Apps"
                    : "Login to Save"}
              </Button>
            </div>
          )}
        </div>

        {/* RIGHT — Results panel */}
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          {/* Tab bar */}
          <div
            className="flex border-b border-border bg-muted/20"
            role="tablist"
            aria-label="Result tabs"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  data-ocid={`tab-${tab.id}`}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 font-mono text-xs font-semibold uppercase tracking-widest transition-colors duration-200 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-1 focus-visible:ring-ring ${
                    isActive
                      ? "bg-accent text-accent-foreground border-b-2 border-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div
            role="tabpanel"
            className="min-h-[340px]"
            aria-label={`${activeTab} tab content`}
          >
            {isLoading ? (
              <ResultSkeleton />
            ) : result ? (
              <>
                {activeTab === "overview" && (
                  <OverviewTab overview={result.overview} />
                )}
                {activeTab === "architecture" && (
                  <ArchitectureTab arch={result.architecture} />
                )}
                {activeTab === "code" && (
                  <CodePreviewTab snippets={result.codeSnippets} />
                )}
              </>
            ) : (
              <div
                className="flex flex-col items-center justify-center min-h-[340px] text-center px-8 py-12"
                data-ocid="empty-results"
              >
                <div className="w-14 h-14 rounded-full bg-muted/60 border border-border flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-display font-bold text-lg text-foreground mb-2">
                  Your results will appear here
                </p>
                <p className="font-body text-sm text-muted-foreground max-w-xs">
                  Describe your app and click{" "}
                  <span className="font-semibold">Generate App</span> to get the
                  AI-powered overview, architecture, and code.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deployment instructions — only after generation */}
      {result && <DeploymentInstructions />}
    </div>
  );
}
