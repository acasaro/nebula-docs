/**
 * In-app notification center. Single in-memory queue of work-in-flight
 * messages the editor surfaces via the bell-icon dropdown in the toolbar.
 *
 * Today the only notification kind is `publish` — produced when a user
 * clicks Publish on a non-default branch. The provider's polling loop
 * watches for the corresponding PR to close, transitions the notification
 * to `success` or `failure`, and lets the user dismiss when they're done.
 *
 * Adding new notification kinds: extend the `Notification` discriminated
 * union, handle the new kind inside the polling effect (or skip if it
 * doesn't need polling), and render its row in NotificationCenter.
 *
 * Persistence is intentionally NOT included — refresh wipes the queue.
 * The PR keeps merging on GitHub regardless; the dashboard's Activity
 * feed is the durable record. Add localStorage if/when persistence
 * becomes a real ask.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchPullRequest } from "@/lib/content";
import { subscribeBuilds, type BuildDoc } from "@/lib/dashboard";

export type NotificationPhase = "in-progress" | "success" | "failure";

interface PublishNotification {
  id: string;
  kind: "publish";
  phase: NotificationPhase;
  /** Headline shown in the dropdown row, e.g. "Publishing PR #4". */
  title: string;
  /** Secondary line shown under the title, e.g. "Merged to main". */
  description?: string;
  /** External link the row's title resolves to (the PR URL on GitHub). */
  href: string;
  /** Created-at; rows are sorted newest-first. */
  createdAt: number;
  // ── Publish-specific fields the polling watcher needs ──
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  /** Source branch the PR was opened from. Informational; auto-deleted by
   *  GitHub once the merge completes. */
  branch: string;
}

interface BuildNotification {
  id: string;
  kind: "build";
  phase: NotificationPhase;
  title: string;
  description?: string;
  /** Workflow run URL while in-progress, channel URL on success. */
  href: string;
  createdAt: number;
  // ── Build-specific fields the Firestore watcher needs ──
  /** `<owner>/<repo>` — used to scope the builds subscription. */
  repoFullName: string;
  /** Branch the build is for. Used as the dedup key. */
  branch: string;
}

export type Notification = PublishNotification | BuildNotification;

/**
 * Distributive Omit. The built-in Omit collapses a discriminated union to
 * its common keys (because `keyof (A | B)` is the *intersection* of keys),
 * so `Omit<Notification, ...>` would drop kind-specific fields like
 * `prNumber` or `branch`. Distributing over each variant first preserves
 * them, and TS still narrows by the `kind` literal at call sites.
 */
type DistributiveOmit<T, K extends keyof T> = T extends unknown
  ? Omit<T, K>
  : never;

interface NotificationsContextValue {
  notifications: Notification[];
  /** Add a new notification. Returns its generated id. */
  addNotification: (
    n: DistributiveOmit<Notification, "id" | "createdAt">,
  ) => string;
  /** Patch an existing notification. No-op if the id isn't found. */
  updateNotification: (id: string, patch: Partial<Notification>) => void;
  /** Remove a notification from the queue. */
  dismissNotification: (id: string) => void;
  /**
   * Idempotent helper for the build path. Adds a new in-progress build
   * notification for the branch IF none currently exists; otherwise
   * resets the existing one back to in-progress (so a save-after-success
   * shows the next build instead of leaving the old success row stale).
   */
  ensureBuildNotification: (args: {
    repoFullName: string;
    branch: string;
    href?: string;
  }) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

const POLL_INTERVAL_MS = 10_000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Stable ref so the polling interval reads latest state without re-binding.
  // Re-binding on every notification change would cancel + recreate the
  // interval, racing with in-flight polls.
  const notificationsRef = useRef<Notification[]>(notifications);
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const addNotification = useCallback<
    NotificationsContextValue["addNotification"]
  >((n) => {
    const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setNotifications((prev) => [
      { ...n, id, createdAt: Date.now() } as Notification,
      ...prev,
    ]);
    return id;
  }, []);

  const updateNotification = useCallback<
    NotificationsContextValue["updateNotification"]
  >((id, patch) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? ({ ...n, ...patch } as Notification) : n)),
    );
  }, []);

  const dismissNotification = useCallback<
    NotificationsContextValue["dismissNotification"]
  >((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const ensureBuildNotification = useCallback<
    NotificationsContextValue["ensureBuildNotification"]
  >(({ repoFullName, branch, href }) => {
    setNotifications((prev) => {
      const existing = prev.find(
        (n) => n.kind === "build" && n.branch === branch,
      ) as BuildNotification | undefined;
      if (existing) {
        // Reset the existing row back to in-progress so a follow-up save
        // after a previous success / failure doesn't leave a stale state
        // on screen. Keep the row's id so React's reconciliation doesn't
        // animate it out + back in.
        return prev.map((n) =>
          n.id === existing.id
            ? ({
                ...n,
                phase: "in-progress",
                title: `Building preview for ${branch}`,
                description: "Updating the preview channel…",
                href: href ?? n.href,
              } as Notification)
            : n,
        );
      }
      const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const next: BuildNotification = {
        id,
        kind: "build",
        phase: "in-progress",
        title: `Building preview for ${branch}`,
        description: "Updating the preview channel…",
        href: href ?? "#",
        createdAt: Date.now(),
        repoFullName,
        branch,
      };
      return [next, ...prev];
    });
  }, []);

  // Single polling loop — iterates `in-progress` publish notifications and
  // checks the PR's state. Set up once at mount; reads latest queue via
  // ref so the loop doesn't tear down on each notification change.
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const current = notificationsRef.current.filter(
        (n) => n.kind === "publish" && n.phase === "in-progress",
      );
      if (current.length === 0) return;
      await Promise.all(
        current.map(async (n) => {
          if (n.kind !== "publish") return;
          try {
            const pr = await fetchPullRequest(
              n.installationId,
              n.owner,
              n.repo,
              n.prNumber,
            );
            if (cancelled) return;
            if (pr.state !== "closed") return;
            updateNotification(n.id, {
              phase: pr.merged ? "success" : "failure",
              description: pr.merged
                ? `Merged into the default branch.`
                : "PR closed without merging.",
            });
          } catch (err) {
            // Transient — keep polling. Don't update phase; let the next
            // poll retry. Surfacing every poll error in the UI would be
            // noisy and confusing on flaky networks.
            // eslint-disable-next-line no-console
            console.warn("[notifications] poll error:", err);
          }
        }),
      );
    }
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    // Kick off an immediate poll so a freshly-added in-progress
    // notification gets checked without waiting a full interval.
    tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [updateNotification]);

  // Firestore-backed watcher for build notifications. We subscribe lazily
  // (only when there's at least one in-progress build notification) and
  // keep one subscription per unique repoFullName referenced in the queue.
  // On each snapshot, match builds to in-progress notifications by branch
  // and flip phase / href / description on terminal status.
  //
  // Tracked outside React state because the unsubscribe handles aren't
  // serializable and we don't want them to drive re-renders.
  const buildSubsRef = useRef<Map<string, () => void>>(new Map());
  useEffect(() => {
    const inProgressBuildRepos = new Set<string>();
    for (const n of notifications) {
      if (n.kind === "build" && n.phase === "in-progress") {
        inProgressBuildRepos.add(n.repoFullName);
      }
    }
    // Tear down subs no longer needed.
    for (const [repoFullName, unsub] of buildSubsRef.current) {
      if (!inProgressBuildRepos.has(repoFullName)) {
        unsub();
        buildSubsRef.current.delete(repoFullName);
      }
    }
    // Spin up subs for any new repo we now care about.
    for (const repoFullName of inProgressBuildRepos) {
      if (buildSubsRef.current.has(repoFullName)) continue;
      const unsub = subscribeBuilds(
        { repoFullName },
        (builds) => onBuildsSnapshot(builds, repoFullName),
        (err) => {
          // eslint-disable-next-line no-console
          console.warn("[notifications] builds subscription error:", err);
        },
      );
      buildSubsRef.current.set(repoFullName, unsub);
    }
    function onBuildsSnapshot(builds: BuildDoc[], repoFullName: string) {
      const current = notificationsRef.current;
      const buildsForRepo = builds.filter((b) => b.repoFullName === repoFullName);
      // Latest build per branch — same dedup the dashboard does.
      const latestByBranch = new Map<string, BuildDoc>();
      for (const b of buildsForRepo) {
        if (!b.branch) continue;
        const existing = latestByBranch.get(b.branch);
        const score = (x: BuildDoc) => x.receivedAt?.toMillis() ?? x.runId;
        if (!existing || score(b) > score(existing)) {
          latestByBranch.set(b.branch, b);
        }
      }
      // For each in-progress build notification on this repo, find the
      // matching latest build and project its state into the notification.
      for (const n of current) {
        if (n.kind !== "build") continue;
        if (n.repoFullName !== repoFullName) continue;
        if (n.phase !== "in-progress") continue;
        const build = latestByBranch.get(n.branch);
        if (!build) continue;
        if (build.status !== "completed") continue;
        if (build.conclusion === "success") {
          updateNotification(n.id, {
            phase: "success",
            title: `Preview ready for ${n.branch}`,
            description: build.previewUrl
              ? "Preview channel updated."
              : "Build completed.",
            href: build.previewUrl ?? n.href,
          });
        } else if (build.conclusion !== null) {
          updateNotification(n.id, {
            phase: "failure",
            title: `Build failed for ${n.branch}`,
            description: `Conclusion: ${build.conclusion}.`,
            href: build.htmlUrl || n.href,
          });
        }
      }
    }
  }, [notifications, updateNotification]);

  // Cleanup all subscriptions on unmount.
  useEffect(() => {
    return () => {
      for (const unsub of buildSubsRef.current.values()) unsub();
      buildSubsRef.current.clear();
    };
  }, []);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      addNotification,
      updateNotification,
      dismissNotification,
      ensureBuildNotification,
    }),
    [
      notifications,
      addNotification,
      updateNotification,
      dismissNotification,
      ensureBuildNotification,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used inside <NotificationProvider>");
  }
  return ctx;
}

/**
 * Set of branch names currently being published (have an in-progress
 * 'publish' notification). Consumers like BranchPicker disable rows that
 * appear in this set — switching to a branch that's about to be deleted
 * by auto-merge would just produce a fetch error a moment later.
 */
export function usePublishingBranches(): Set<string> {
  const { notifications } = useNotifications();
  return useMemo(() => {
    const s = new Set<string>();
    for (const n of notifications) {
      if (n.kind === "publish" && n.phase === "in-progress") s.add(n.branch);
    }
    return s;
  }, [notifications]);
}
