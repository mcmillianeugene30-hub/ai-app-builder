import type { backendInterface, GenerationResult, GenerationSummary, Generation } from "../backend";
import { UserRole } from "../backend";
import { Principal } from "@icp-sdk/core/principal";

const sampleGenerationResult: GenerationResult = {
  overview: {
    concept: "An AI-powered task management app with smart prioritization and deadline tracking.",
    targetUsers: "Developers and teams who want to automate workflow organization",
    keyFeatures: ["AI task prioritization", "Deadline detection", "Team collaboration", "Kanban board"],
  },
  architecture: {
    systemDesign: "Single-canister architecture with stable memory for persistence. Frontend communicates via Candid interface.",
    dataFlow: "User prompt → LLM API (HTTP outcall) → parsed response → stored in canister state → returned to frontend",
    techStack: ["Motoko", "React", "TypeScript", "Tailwind CSS", "Internet Computer"],
  },
  codeSnippets: [
    {
      filename: "main.mo",
      code: `import Map "mo:core/Map";\n\nactor {\n  let tasks = Map.empty<Nat, Text>();\n  \n  public func addTask(task: Text) : async Nat {\n    let id = Map.size(tasks);\n    Map.put(tasks, Map.nhash, id, task);\n    id\n  };\n}`,
    },
    {
      filename: "App.tsx",
      code: `import { useState } from "react";\nimport { backend } from "./backend";\n\nexport default function App() {\n  const [tasks, setTasks] = useState<string[]>([]);\n  \n  return (\n    <div className="p-4">\n      <h1 className="text-2xl font-bold">Task Manager</h1>\n    </div>\n  );\n}`,
    },
  ],
};

const sampleSummaries: GenerationSummary[] = [
  {
    id: BigInt(1),
    createdAt: BigInt(Date.now() * 1_000_000 - 86400000000000),
    promptPreview: "Build a task management app with AI prioritization",
  },
  {
    id: BigInt(2),
    createdAt: BigInt(Date.now() * 1_000_000 - 172800000000000),
    promptPreview: "Create a real-time chat application with message history",
  },
  {
    id: BigInt(3),
    createdAt: BigInt(Date.now() * 1_000_000 - 259200000000000),
    promptPreview: "Build an e-commerce store with product catalog and cart",
  },
];

const sampleGeneration: Generation = {
  id: BigInt(1),
  userId: Principal.anonymous(),
  createdAt: BigInt(Date.now() * 1_000_000 - 86400000000000),
  prompt: "Build a task management app with AI prioritization",
  overview: sampleGenerationResult.overview,
  architecture: sampleGenerationResult.architecture,
  codeSnippets: sampleGenerationResult.codeSnippets,
};

export const mockBackend: backendInterface = {
  _initializeAccessControl: async () => undefined,
  assignCallerUserRole: async (_user, _role) => undefined,
  deleteGeneration: async (_id) => ({ __kind__: "ok", ok: null }),
  generateApp: async (_prompt) => sampleGenerationResult,
  getCallerUserProfile: async () => ({ name: "Dev User" }),
  getCallerUserRole: async () => UserRole.user,
  getGeneration: async (_id) => sampleGeneration,
  getMyGenerations: async () => sampleSummaries,
  getUserProfile: async (_user) => ({ name: "Dev User" }),
  isCallerAdmin: async () => false,
  saveCallerUserProfile: async (_profile) => undefined,
  saveGeneration: async (_prompt, _overview, _architecture, _codeSnippets) => ({
    __kind__: "ok",
    ok: BigInt(4),
  }),
  transform: async (input) => ({
    status: input.response.status,
    body: input.response.body,
    headers: input.response.headers,
  }),
};
