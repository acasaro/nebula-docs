import type {
  Actor,
  ActivityEntry,
  DashboardData,
  Deployment,
  DeploymentLogStep,
  PreviewEntry,
} from "./types";

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

function commit(branch: string, shortSha: string) {
  return {
    source: `refs/heads/${branch}`,
    shortSha,
    fullSha: shortSha.padEnd(40, "0"),
    htmlUrl: `https://github.com/uhg-internal/mcoe-docs/commit/${shortSha}`,
  };
}

const anthony: Actor = {
  kind: "human",
  name: "Anthony Asaro",
  shortName: "Anthony Asaro",
  avatarUrl:
    "https://avatars.githubusercontent.com/u/12345678?v=4",
};

const nebulaBot: Actor = {
  kind: "bot",
  name: "nebula-docs[bot]",
  shortName: "nebula-docs",
};

const deployment: Deployment = {
  siteName: "MCoE Documentation",
  status: "live",
  domain: "mcoe-docs.nebula.app",
  customDomain: null,
  owner: "uhg-internal",
  repo: "mcoe-docs",
  branch: "main",
  lastUpdatedAt: hoursAgo(8),
  lastUpdatedBy: nebulaBot,
};

const expandedLog: DeploymentLogStep[] = [
  { label: "Verified update permissions", status: "ok" },
  { label: "Fetching and validating config file...", status: "ok" },
  { label: "Fetching .nebulaignore file...", status: "ok" },
  { label: "Fetching ASSISTANT.md file...", status: "ok" },
  { label: "Successfully validated docs.json", status: "ok" },
  { label: "Successfully fetched .nebulaignore", status: "ok" },
  { label: "No Assistant.md file found", status: "ok" },
  {
    label:
      "Compile or auth-affecting docsConfig fields changed, keeping full update",
    status: "ok",
  },
  { label: "DocsConfig evaluation complete", status: "ok" },
  { label: "Fetched all file paths", status: "ok" },
  { label: "Fetched 0 OpenApi file(s)", status: "ok" },
  { label: "Fetched 0 AsyncApi file(s)", status: "ok" },
  { label: "Skipped OpenAPI navigation generation", status: "ok" },
  { label: "Skipped AsyncAPI navigation generation", status: "ok" },
  { label: "Successfully updated API reference", status: "ok" },
];

const activity: ActivityEntry[] = [
  {
    kind: "activity",
    id: "activity-1",
    actor: nebulaBot,
    occurredAt: hoursAgo(8),
    title: "Update 3 files",
    status: "successful",
    fileCounts: [{ kind: "edited", count: 3 }],
    commit: commit("main", "8a2f1d4"),
  },
  {
    kind: "activity",
    id: "activity-2",
    actor: anthony,
    occurredAt: hoursAgo(15),
    title: "Add new component docs and update navigation",
    subtitle: "Nebula-Source: dashboard-editor",
    status: "successful",
    fileCounts: [
      { kind: "added", count: 18 },
      { kind: "edited", count: 8 },
    ],
    commit: commit("main", "b71c0e9"),
  },
  {
    kind: "activity",
    id: "activity-3",
    actor: anthony,
    occurredAt: hoursAgo(15),
    title: "Remove unused snippets and update index page",
    subtitle: "Nebula-Source: dashboard-editor",
    status: "successful",
    fileCounts: [
      { kind: "edited", count: 1 },
      { kind: "removed", count: 23 },
    ],
    commit: commit("main", "44e2a18"),
  },
  {
    kind: "activity",
    id: "activity-4",
    actor: anthony,
    occurredAt: hoursAgo(15),
    title: "Refactor documentation structure and content",
    subtitle: "Nebula-Source: dashboard-editor",
    status: "successful",
    fileCounts: [
      { kind: "added", count: 2 },
      { kind: "edited", count: 1 },
      { kind: "removed", count: 3 },
    ],
    commit: commit("main", "3114a45"),
  },
  {
    kind: "activity",
    id: "activity-5",
    actor: anthony,
    occurredAt: hoursAgo(16),
    title: "Move documentation content to new structure",
    subtitle: "Nebula-Source: dashboard-editor",
    status: "successful",
    fileCounts: [
      { kind: "added", count: 3 },
      { kind: "removed", count: 3 },
    ],
    commit: commit("main", "d9012b6"),
  },
  {
    kind: "activity",
    id: "activity-6",
    actor: anthony,
    occurredAt: hoursAgo(16),
    title: "Refactor and simplify documentation structure",
    subtitle: "Nebula-Source: dashboard-editor",
    status: "successful",
    fileCounts: [
      { kind: "added", count: 6 },
      { kind: "edited", count: 4 },
      { kind: "removed", count: 49 },
    ],
    commit: commit("main", "7c3e5f1"),
  },
  {
    kind: "activity",
    id: "activity-7",
    actor: anthony,
    occurredAt: hoursAgo(17),
    title: "Update index.mdx with new image URL and update tags",
    subtitle: "Nebula-Source: dashboard-editor",
    status: "successful",
    fileCounts: [{ kind: "edited", count: 1 }],
    commit: commit("main", "61b8d7a"),
  },
];

const previews: PreviewEntry[] = [
  {
    kind: "preview",
    id: "preview-1",
    actor: nebulaBot,
    occurredAt: hoursAgo(9),
    title: "Update documentation/overview.mdx",
    branch: "test-new-branch",
    status: "successful",
    fileCounts: [{ kind: "edited", count: 1 }],
    commit: commit("test-new-branch", "a17e228"),
    previewUrl: "https://mcoe-docs-test-new-branch.nebula.app",
    successMessage:
      "Your changes are now live at https://mcoe-docs-test-new-branch.nebula.app!",
    filesChanged: [
      {
        path: "documentation/overview.mdx",
        url: "https://github.com/uhg-internal/mcoe-docs/blob/test-new-branch/documentation/overview.mdx",
      },
    ],
    log: expandedLog,
  },
  {
    kind: "preview",
    id: "preview-2",
    actor: nebulaBot,
    occurredAt: hoursAgo(10),
    title: "Update documentation/overview.mdx",
    branch: "test-new-branch",
    status: "successful",
    fileCounts: [{ kind: "edited", count: 1 }],
    commit: commit("test-new-branch", "ce9f4ab"),
    previewUrl: "https://mcoe-docs-test-new-branch.nebula.app",
    successMessage:
      "Your changes are now live at https://mcoe-docs-test-new-branch.nebula.app!",
    filesChanged: [
      {
        path: "documentation/overview.mdx",
        url: "https://github.com/uhg-internal/mcoe-docs/blob/test-new-branch/documentation/overview.mdx",
      },
    ],
    log: expandedLog,
  },
  {
    kind: "preview",
    id: "preview-3",
    actor: anthony,
    occurredAt: hoursAgo(10),
    title: "Refactor documentation structure and content",
    subtitle: "Nebula-Source: dashboard-editor",
    branch: "test-new-branch",
    status: "successful",
    fileCounts: [{ kind: "edited", count: 3 }],
    commit: commit("test-new-branch", "3114a45"),
    previewUrl: "https://mcoe-docs-test-new-branch.nebula.app",
    successMessage:
      "Your changes are now live at https://mcoe-docs-test-new-branch.nebula.app!",
    filesChanged: [
      {
        path: "docs.json",
        url: "https://github.com/uhg-internal/mcoe-docs/blob/test-new-branch/docs.json",
      },
      {
        path: "documentation/format-text.mdx",
        url: "https://github.com/uhg-internal/mcoe-docs/blob/test-new-branch/documentation/format-text.mdx",
      },
      {
        path: "documentation/overview.mdx",
        url: "https://github.com/uhg-internal/mcoe-docs/blob/test-new-branch/documentation/overview.mdx",
      },
    ],
    log: expandedLog,
  },
];

export const dashboardMockData: DashboardData = {
  deployment,
  activity,
  previews,
};
