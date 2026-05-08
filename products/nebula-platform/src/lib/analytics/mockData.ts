import type {
  AnalyticsRange,
  AnalyticsRangeKey,
  AnalyticsSummary,
  AnalyticsTimeseriesPoint,
} from "./types";

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatRangeLabel(start: Date, end: Date): string {
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  const sm = MONTH_SHORT[start.getMonth()];
  const em = MONTH_SHORT[end.getMonth()];
  if (sameMonth) return `${sm} ${start.getDate()} – ${end.getDate()}`;
  return `${sm} ${start.getDate()} – ${em} ${end.getDate()}`;
}

export function buildRange(rangeKey: AnalyticsRangeKey, now: Date = new Date()): AnalyticsRange {
  const today = startOfDay(now);
  const days = rangeKey === "7d" ? 8 : rangeKey === "30d" ? 30 : 90;
  const start = addDays(today, -(days - 1));
  return {
    label: formatRangeLabel(start, today),
    start,
    end: today,
    bucketDays: 1,
  };
}

const RANGE_LABELS: Record<AnalyticsRangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

export function rangeOptionLabel(rangeKey: AnalyticsRangeKey): string {
  return RANGE_LABELS[rangeKey];
}

/**
 * Lightweight deterministic generator so the mock looks plausible across the
 * three preset ranges without committing thousands of lines of fixtures.
 */
function pseudoRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function buildTimeseries(range: AnalyticsRange): AnalyticsTimeseriesPoint[] {
  const points: AnalyticsTimeseriesPoint[] = [];
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.round((range.end.getTime() - range.start.getTime()) / dayMs) + 1;
  const rand = pseudoRandom(days * 9973);
  for (let i = 0; i < days; i += 1) {
    const date = addDays(range.start, i);
    const isLast = i === days - 1;
    const base = Math.floor(rand() * 18) + 4;
    points.push({
      date,
      visitors: isLast ? Math.floor(base / 4) : base,
      partial: isLast,
    });
  }
  return points;
}

export function buildAnalyticsMock(rangeKey: AnalyticsRangeKey, now: Date = new Date()): AnalyticsSummary {
  const range = buildRange(rangeKey, now);
  const series = buildTimeseries(range);
  const visitorsTotal = series.reduce((sum, p) => sum + p.visitors, 0);
  const viewsTotal = visitorsTotal * 19; // ~19 views per visitor in the mock
  const searchesTotal = Math.max(0, Math.floor(visitorsTotal / 12));

  return {
    range,
    visitors: {
      value: visitorsTotal,
      previousValue: Math.round(visitorsTotal * 1.077),
      delta: -0.071,
    },
    views: {
      value: viewsTotal,
      previousValue: Math.round(viewsTotal / 1.475),
      delta: 0.475,
    },
    searches: {
      value: searchesTotal,
      previousValue: 0,
      delta: searchesTotal === 0 ? null : 1,
    },
    visitorsOverTime: series,
    topPages: [
      { path: "/", views: 78 },
      { path: "/page-only", views: 74 },
      { path: "/accordian", views: 61 },
      { path: "/components/mermaid-diagrams", views: 27 },
      { path: "/index", views: 24 },
      { path: "/dropdown-item-1", views: 19 },
    ],
    topUsers: [
      {
        name: "Anthony Asaro",
        avatarUrl: "https://avatars.githubusercontent.com/u/12345678?v=4",
        events: 142,
      },
      { name: "Jordan Reyes", events: 86 },
      { name: "Priya Natarajan", events: 54 },
      { name: "Sam Chen", events: 31 },
      { name: "Alex Kim", events: 22 },
      { name: "Riley Morgan", events: 11 },
    ],
  };
}
