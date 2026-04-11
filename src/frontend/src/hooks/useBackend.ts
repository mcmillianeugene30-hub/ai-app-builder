import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  Architecture,
  CodeSnippet,
  Generation,
  GenerationId,
  GenerationResult,
  GenerationSummary,
  Overview,
  UserProfile,
} from "../backend";

export function useMyGenerations() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<GenerationSummary[]>({
    queryKey: ["myGenerations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyGenerations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGeneration(id: GenerationId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Generation | null>({
    queryKey: ["generation", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getGeneration(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCallerUserProfile() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<UserProfile | null>({
    queryKey: ["callerUserProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGenerateApp() {
  const { actor } = useActor(createActor);
  return useMutation<GenerationResult, Error, string>({
    mutationFn: async (prompt: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.generateApp(prompt);
    },
  });
}

export function useSaveGeneration() {
  const queryClient = useQueryClient();
  const { actor } = useActor(createActor);
  return useMutation<
    { __kind__: "ok"; ok: GenerationId } | { __kind__: "err"; err: string },
    Error,
    {
      prompt: string;
      overview: Overview;
      architecture: Architecture;
      codeSnippets: CodeSnippet[];
    }
  >({
    mutationFn: async ({ prompt, overview, architecture, codeSnippets }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveGeneration(prompt, overview, architecture, codeSnippets);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGenerations"] });
    },
  });
}

export function useDeleteGeneration() {
  const queryClient = useQueryClient();
  const { actor } = useActor(createActor);
  return useMutation<
    { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string },
    Error,
    GenerationId
  >({
    mutationFn: async (id: GenerationId) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteGeneration(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myGenerations"] });
    },
  });
}

export function useSaveCallerUserProfile() {
  const queryClient = useQueryClient();
  const { actor } = useActor(createActor);
  return useMutation<void, Error, UserProfile>({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerUserProfile"] });
    },
  });
}
