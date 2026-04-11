import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  Code2,
  ExternalLink,
  FolderOpen,
  Loader2,
  LogIn,
  Plus,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useDeleteGeneration, useMyGenerations } from "../hooks/useBackend";
import type { GenerationId, GenerationSummary } from "../types";

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp / BigInt(1_000_000));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ms));
}

function AppCardSkeleton() {
  return (
    <div className="border border-border bg-card rounded-none p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-none" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

interface AppCardProps {
  generation: GenerationSummary;
  onView: (id: GenerationId) => void;
  onDelete: (id: GenerationId) => void;
  isDeleting: boolean;
}

function AppCard({ generation, onView, onDelete, isDeleting }: AppCardProps) {
  const preview =
    generation.promptPreview.length > 80
      ? `${generation.promptPreview.slice(0, 80)}…`
      : generation.promptPreview;

  const appName = generation.promptPreview.split(" ").slice(0, 3).join(" ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="border border-border bg-card hover:border-accent/60 transition-smooth group"
      data-ocid="app-card"
    >
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 border border-border bg-muted flex items-center justify-center shrink-0">
            <Code2 className="h-4 w-4 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-sm text-foreground truncate leading-tight">
              {appName}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {formatDate(generation.createdAt)}
            </p>
          </div>
        </div>

        {/* Prompt preview */}
        <p className="text-sm text-muted-foreground font-body leading-relaxed break-words line-clamp-3 border-l-2 border-accent/40 pl-3">
          {preview}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 font-mono text-xs rounded-none border-border hover:border-accent hover:text-accent transition-smooth"
            onClick={() => onView(generation.id)}
            data-ocid="view-app-btn"
          >
            <ExternalLink className="h-3 w-3 mr-1.5" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-none border-border hover:border-destructive hover:text-destructive transition-smooth"
            onClick={() => onDelete(generation.id)}
            disabled={isDeleting}
            data-ocid="delete-app-btn"
          >
            {isDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function LoginPrompt() {
  const { login, isLoggingIn } = useAuth();
  return (
    <div
      className="flex flex-col items-center justify-center py-24 space-y-6 border border-dashed border-border bg-card/50"
      data-ocid="login-prompt"
    >
      <div className="h-16 w-16 border-2 border-border bg-muted flex items-center justify-center">
        <LogIn className="h-7 w-7 text-accent" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="font-display font-bold text-xl text-foreground">
          Sign in to view your apps
        </h2>
        <p className="text-muted-foreground font-body text-sm max-w-xs">
          Your saved generations are tied to your identity. Log in to access
          them.
        </p>
      </div>
      <Button
        onClick={() => login()}
        disabled={isLoggingIn}
        className="rounded-none font-mono font-bold tracking-wide"
        data-ocid="login-btn"
      >
        {isLoggingIn ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <LogIn className="h-4 w-4 mr-2" />
        )}
        Connect with Internet Identity
      </Button>
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div
      className="flex flex-col items-center justify-center py-24 space-y-6 border border-dashed border-border bg-card/50"
      data-ocid="empty-state"
    >
      <div className="h-16 w-16 border-2 border-border bg-muted flex items-center justify-center">
        <FolderOpen className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="font-display font-bold text-xl text-foreground">
          No apps yet
        </h2>
        <p className="text-muted-foreground font-body text-sm max-w-xs">
          Build your first AI app and save it here. Start by describing what you
          want to create.
        </p>
      </div>
      <Button
        onClick={() => navigate({ to: "/builder" })}
        className="rounded-none font-mono font-bold tracking-wide"
        data-ocid="go-to-builder-btn"
      >
        <Plus className="h-4 w-4 mr-2" />
        Build your first app
      </Button>
    </div>
  );
}

export default function MyApps() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { data: generations, isLoading } = useMyGenerations();
  const {
    mutate: deleteGeneration,
    isPending: isDeleting,
    variables: deletingId,
  } = useDeleteGeneration();
  const navigate = useNavigate();

  const [confirmDeleteId, setConfirmDeleteId] = useState<GenerationId | null>(
    null,
  );

  function handleView(id: GenerationId) {
    navigate({ to: "/builder", search: { generationId: id.toString() } });
  }

  function handleDeleteConfirm() {
    if (confirmDeleteId === null) return;
    deleteGeneration(confirmDeleteId);
    setConfirmDeleteId(null);
  }

  const count = generations?.length ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Page heading */}
      <div className="flex items-center gap-3 mb-8" data-ocid="page-header">
        <h1 className="font-display font-black text-3xl tracking-tight text-foreground">
          My Apps
        </h1>
        {isAuthenticated && !isLoading && (
          <Badge
            variant="outline"
            className="font-mono text-xs rounded-none border-accent text-accent"
            data-ocid="generation-count-badge"
          >
            {count} {count === 1 ? "app" : "apps"}
          </Badge>
        )}
      </div>

      {/* Content area */}
      {isInitializing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(["s1", "s2", "s3"] as const).map((k) => (
            <AppCardSkeleton key={k} />
          ))}
        </div>
      ) : !isAuthenticated ? (
        <LoginPrompt />
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(["s1", "s2", "s3", "s4", "s5", "s6"] as const).map((k) => (
            <AppCardSkeleton key={k} />
          ))}
        </div>
      ) : count === 0 ? (
        <EmptyState />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generations!.map((gen, i) => (
              <motion.div
                key={gen.id.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <AppCard
                  generation={gen}
                  onView={handleView}
                  onDelete={(id) => setConfirmDeleteId(id)}
                  isDeleting={isDeleting && deletingId === gen.id}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Delete confirmation modal */}
      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <AlertDialogContent
          className="rounded-none border-border font-body"
          data-ocid="delete-modal"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display font-bold">
              Delete this app?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the generation and all its data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-none font-mono"
              data-ocid="delete-cancel-btn"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-none font-mono bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              data-ocid="delete-confirm-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
