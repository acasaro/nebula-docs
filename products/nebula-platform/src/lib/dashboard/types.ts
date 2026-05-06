export type ActorKind = "human" | "bot";

export interface Actor {
  kind: ActorKind;
  /** Full display name, e.g. "Anthony Asaro" or "nebula-docs[bot]". */
  name: string;
  /** Compact label for table rows, e.g. "Anthony Asaro" or "nebula-docs". */
  shortName: string;
  /** Optional photo URL for human actors. */
  avatarUrl?: string;
}

export type DeploymentStatus = "live" | "building" | "failed";

export interface Deployment {
  siteName: string;
  status: DeploymentStatus;
  domain: string;
  customDomain: string | null;
  owner: string;
  repo: string;
  branch: string;
  lastUpdatedAt: Date;
  lastUpdatedBy: Actor;
}

export type EntryStatus = "successful" | "building" | "failed";

export interface FileChange {
  path: string;
  url: string;
}

export type FileChangeKind = "added" | "edited" | "removed";

export interface FileChangeCount {
  kind: FileChangeKind;
  count: number;
}

export interface CommitDetails {
  /** Long-form refs/heads/<branch> string. */
  source: string;
  shortSha: string;
  /** Full SHA, used for stable links and lookups. */
  fullSha: string;
  /** GitHub commit URL, when available. */
  htmlUrl: string;
}

export type DeploymentLogStatus = "ok" | "pending" | "fail";

export interface DeploymentLogStep {
  label: string;
  status: DeploymentLogStatus;
}

interface BaseEntry {
  id: string;
  actor: Actor;
  occurredAt: Date;
  /** Single-line summary, e.g. "Update 3 files" or a commit subject. */
  title: string;
  /** Optional secondary line, e.g. "Nebula-Source: dashboard-editor". */
  subtitle?: string;
  status: EntryStatus;
  fileCounts: FileChangeCount[];
  commit: CommitDetails;
}

export interface ActivityEntry extends BaseEntry {
  kind: "activity";
}

export interface PreviewEntry extends BaseEntry {
  kind: "preview";
  branch: string;
  previewUrl: string;
  successMessage: string;
  filesChanged: FileChange[];
  log: DeploymentLogStep[];
}

export type DashboardEntry = ActivityEntry | PreviewEntry;

export interface DashboardData {
  deployment: Deployment;
  activity: ActivityEntry[];
  previews: PreviewEntry[];
}
