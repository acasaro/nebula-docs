/**
 * Static analytics configuration.
 *
 * Values here control behavior of the core analytics module — they are safe
 * to tweak without touching call sites.
 */

/** Scroll-depth milestones to report. Lower values increase event volume. */
export const SCROLL_DEPTH_MILESTONES = [25, 50, 75, 100] as const;

/** Time-on-page milestones (seconds). */
export const ENGAGED_TIME_MILESTONES = [15, 30, 60, 120, 300] as const;

/**
 * Hosts considered internal. Links to these are NOT counted as outbound,
 * even if they happen to be absolute URLs.
 */
export const INTERNAL_HOSTS: readonly string[] = ["mcoe.example.com"];

/**
 * Link protocols that should emit `protocol_click` instead of `nav_click` /
 * `outbound_click`. Add new entries here as the site links to new schemes.
 */
export const TRACKED_PROTOCOLS: readonly string[] = [
  "mailto:",
  "tel:",
  "msteams:",
  "sms:",
];

/**
 * Data attribute namespace. Elements with `data-analytics-surface` opt into
 * auto-tracking; optional siblings (`data-analytics-label`,
 * `data-analytics-position`) carry metadata.
 */
export const DATA_ATTR = {
  surface: "data-analytics-surface",
  label: "data-analytics-label",
  position: "data-analytics-position",
  elementType: "data-analytics-type",
  /** Additional context dimension (e.g. "category", "section"). */
  category: "data-analytics-category",
  /** Block auto-tracking for this subtree. */
  ignore: "data-analytics-ignore",
} as const;

/**
 * Debounce window (ms) for duplicate events on the same surface. Guards
 * against double-clicks + React StrictMode double-invocation in dev.
 */
export const DEDUPE_WINDOW_MS = 250;

/**
 * When true, the analytics module logs every event to the console instead of
 * (or in addition to) dispatching to the provider. Automatically true when
 * `environment === "development"`.
 */
export function isDebugMode(environment: string | undefined): boolean {
  if (typeof window === "undefined") return false;
  if (environment === "development") return true;
  try {
    return window.localStorage.getItem("nebula-analytics-debug") === "1";
  } catch {
    return false;
  }
}
