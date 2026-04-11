export type {
  GenerationResult,
  Generation,
  GenerationSummary,
  CodeSnippet,
  Overview,
  Architecture,
  UserProfile,
  GenerationId,
  UserId,
} from "../backend";

export { UserRole } from "../backend";

export type TabId = "overview" | "architecture" | "code";

export interface NavItem {
  label: string;
  path: string;
}
