import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CodeSnippet {
    code: string;
    filename: string;
}
export interface UserProfile {
    name: string;
}
export type Timestamp = bigint;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface GenerationSummary {
    id: GenerationId;
    createdAt: Timestamp;
    promptPreview: string;
}
export interface Generation {
    id: GenerationId;
    userId: UserId;
    createdAt: Timestamp;
    overview: Overview;
    architecture: Architecture;
    prompt: string;
    codeSnippets: Array<CodeSnippet>;
}
export interface Architecture {
    systemDesign: string;
    dataFlow: string;
    techStack: Array<string>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type GenerationId = bigint;
export type UserId = Principal;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface GenerationResult {
    overview: Overview;
    architecture: Architecture;
    codeSnippets: Array<CodeSnippet>;
}
export interface Overview {
    concept: string;
    targetUsers: string;
    keyFeatures: Array<string>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteGeneration(id: GenerationId): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    generateApp(prompt: string): Promise<GenerationResult>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGeneration(id: GenerationId): Promise<Generation | null>;
    getMyGenerations(): Promise<Array<GenerationSummary>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveGeneration(prompt: string, overview: Overview, architecture: Architecture, codeSnippets: Array<CodeSnippet>): Promise<{
        __kind__: "ok";
        ok: GenerationId;
    } | {
        __kind__: "err";
        err: string;
    }>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
