/**
 * Shapes returned by the planned `getAnalyticsSummary` Cloud Function.
 * Mirrors the schema we'll put on the function so the UI layer doesn't
 * change shape when wiring swaps from mock to live.
 */

export type AnalyticsRangeKey = "7d" | "30d" | "90d";

export interface AnalyticsRange {
  /** Human label, e.g. "May 1 – 8". */
  label: string;
  /** Inclusive start of the active window. */
  start: Date;
  /** Inclusive end of the active window. */
  end: Date;
  /** Bucket size for the time-series, in days. */
  bucketDays: number;
}

export interface AnalyticsMetric {
  /** Total for the active window. */
  value: number;
  /** Total for the immediately-prior window of equal length. */
  previousValue: number;
  /** Signed change as a fraction (e.g. -0.071 for -7.1%). null when previousValue == 0. */
  delta: number | null;
}

export interface AnalyticsTimeseriesPoint {
  /** Bucket start (date-only granularity). */
  date: Date;
  /** Visitors counted in this bucket. */
  visitors: number;
  /**
   * True when the bucket overlaps "now" — rendered with a hatch pattern
   * so the user can tell partial-day data from finalized buckets.
   */
  partial?: boolean;
}

export interface AnalyticsTopPage {
  path: string;
  views: number;
}

export interface AnalyticsTopUser {
  /** Display name; falls back to email/uid in the writer. */
  name: string;
  /** Avatar URL when available. */
  avatarUrl?: string;
  /** Sessions or events attributed to this user in the window. */
  events: number;
}

export interface AnalyticsSummary {
  range: AnalyticsRange;
  visitors: AnalyticsMetric;
  views: AnalyticsMetric;
  searches: AnalyticsMetric;
  visitorsOverTime: AnalyticsTimeseriesPoint[];
  topPages: AnalyticsTopPage[];
  topUsers: AnalyticsTopUser[];
}

export type AnalyticsSummaryState =
  | { status: "loading" }
  | { status: "ready"; data: AnalyticsSummary }
  | { status: "error"; error: string };
