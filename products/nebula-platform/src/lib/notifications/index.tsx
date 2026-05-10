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

export type Notification = PublishNotification;

interface NotificationsContextValue {
  notifications: Notification[];
  /** Add a new notification. Returns its generated id. */
  addNotification: (
    n: Omit<Notification, "id" | "createdAt">,
  ) => string;
  /** Patch an existing notification. No-op if the id isn't found. */
  updateNotification: (id: string, patch: Partial<Notification>) => void;
  /** Remove a notification from the queue. */
  dismissNotification: (id: string) => void;
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

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      addNotification,
      updateNotification,
      dismissNotification,
    }),
    [notifications, addNotification, updateNotification, dismissNotification],
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
