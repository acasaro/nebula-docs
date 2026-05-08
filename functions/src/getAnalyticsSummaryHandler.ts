import { BetaAnalyticsDataClient } from '@google-analytics/data';

/**
 * Shapes returned to the SPA. Mirrors `products/nebula-platform/src/lib/analytics/types.ts`
 * — the SPA hook decodes ISO date strings back to `Date` instances on receipt.
 *
 * Cloud Functions return strings over the wire (Firebase callable serializes
 * via JSON), so dates round-trip as ISO strings here. Keep the field names
 * identical to the SPA-side `AnalyticsSummary` so the swap is mechanical.
 */
export interface AnalyticsMetricWire {
  value: number;
  previousValue: number;
  /** Signed change as a fraction. `null` when previousValue === 0. */
  delta: number | null;
}

export interface AnalyticsTimeseriesPointWire {
  /** YYYY-MM-DD. */
  date: string;
  visitors: number;
  partial?: boolean;
}

export interface AnalyticsTopPageWire {
  path: string;
  views: number;
}

export interface AnalyticsTopUserWire {
  name: string;
  events: number;
}

export interface AnalyticsRangeWire {
  label: string;
  /** Inclusive start, YYYY-MM-DD. */
  start: string;
  /** Inclusive end, YYYY-MM-DD. */
  end: string;
  bucketDays: number;
}

export interface AnalyticsSummaryWire {
  range: AnalyticsRangeWire;
  visitors: AnalyticsMetricWire;
  views: AnalyticsMetricWire;
  searches: AnalyticsMetricWire;
  visitorsOverTime: AnalyticsTimeseriesPointWire[];
  topPages: AnalyticsTopPageWire[];
  topUsers: AnalyticsTopUserWire[];
}

export type RangeKey = '7d' | '30d' | '90d';

interface HandlerOptions {
  rangeKey: RangeKey;
  propertyId: string;
  /**
   * Parsed service-account JSON. We accept the parsed object (not the raw
   * string) so the caller controls how the secret is loaded — both
   * variants pull from `GA4_SERVICE_ACCOUNT_JSON` but the value parsing
   * lives in the wrapper, so handler tests can pass a mock object.
   */
  credentials: {
    client_email: string;
    private_key: string;
  };
  /** Override `now` for deterministic tests. Defaults to `new Date()`. */
  now?: Date;
}

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** GA4's date dimension comes back as `YYYYMMDD` strings. */
function parseGa4Date(yyyymmdd: string): string {
  const y = yyyymmdd.slice(0, 4);
  const m = yyyymmdd.slice(4, 6);
  const d = yyyymmdd.slice(6, 8);
  return `${y}-${m}-${d}`;
}

function formatRangeLabel(start: Date, end: Date): string {
  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() &&
    start.getUTCMonth() === end.getUTCMonth();
  const sm = MONTH_SHORT[start.getUTCMonth()];
  const em = MONTH_SHORT[end.getUTCMonth()];
  if (sameMonth) return `${sm} ${start.getUTCDate()} – ${end.getUTCDate()}`;
  return `${sm} ${start.getUTCDate()} – ${em} ${end.getUTCDate()}`;
}

function rangeDays(rangeKey: RangeKey): number {
  if (rangeKey === '7d') return 8;
  if (rangeKey === '30d') return 30;
  return 90;
}

/**
 * Resolve current + previous date windows. The previous window is the same
 * length immediately before the current one so deltas describe "change vs
 * the prior comparable period".
 */
function resolveWindows(rangeKey: RangeKey, now: Date) {
  const today = startOfDay(now);
  const days = rangeDays(rangeKey);
  const start = addDays(today, -(days - 1));
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(days - 1));
  return {
    current: { start, end: today, days },
    previous: { start: previousStart, end: previousEnd, days },
  };
}

function computeDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

function readSingleMetric(
  rows: Array<{ metricValues?: Array<{ value?: string | null } | null> | null }> | null | undefined,
): number {
  const first = rows?.[0]?.metricValues?.[0]?.value;
  return first ? Number(first) : 0;
}

function readEventCount(
  rows:
    | Array<{
        dimensionValues?: Array<{ value?: string | null } | null> | null;
        metricValues?: Array<{ value?: string | null } | null> | null;
      }>
    | null
    | undefined,
  eventName: string,
): number {
  if (!rows) return 0;
  for (const r of rows) {
    if (r?.dimensionValues?.[0]?.value === eventName) {
      const v = r?.metricValues?.[0]?.value;
      return v ? Number(v) : 0;
    }
  }
  return 0;
}

/**
 * Run the GA4 Data API queries and shape the response. Issues all queries
 * in parallel — total wall time is bound by the slowest single query
 * (typically ~300–700ms against the property in steady state).
 *
 * Note on **top users**: GA4 doesn't expose user-level breakdowns through
 * the Data API by default — `userId` requires the SDK's `setUserId()` to
 * have been called, which the public docs site never does (it's
 * unauthenticated traffic). Returning an empty array here is the honest
 * answer until either (a) we adopt BigQuery export for raw event-level
 * access, or (b) the docs site gains a sign-in flow that lets us tag
 * sessions.
 */
export async function getAnalyticsSummary({
  rangeKey,
  propertyId,
  credentials,
  now = new Date(),
}: HandlerOptions): Promise<AnalyticsSummaryWire> {
  const client = new BetaAnalyticsDataClient({ credentials });
  const property = `properties/${propertyId}`;
  const { current, previous } = resolveWindows(rangeKey, now);

  const currentRange = { startDate: toIsoDate(current.start), endDate: toIsoDate(current.end) };
  const previousRange = { startDate: toIsoDate(previous.start), endDate: toIsoDate(previous.end) };

  const [
    [visitorsCurrent],
    [visitorsPrevious],
    [viewsCurrent],
    [viewsPrevious],
    [searchesCurrent],
    [searchesPrevious],
    [timeseries],
    [topPages],
  ] = await Promise.all([
    client.runReport({
      property,
      dateRanges: [currentRange],
      metrics: [{ name: 'totalUsers' }],
    }),
    client.runReport({
      property,
      dateRanges: [previousRange],
      metrics: [{ name: 'totalUsers' }],
    }),
    client.runReport({
      property,
      dateRanges: [currentRange],
      metrics: [{ name: 'screenPageViews' }],
    }),
    client.runReport({
      property,
      dateRanges: [previousRange],
      metrics: [{ name: 'screenPageViews' }],
    }),
    client.runReport({
      property,
      dateRanges: [currentRange],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { value: 'search', matchType: 'EXACT' },
        },
      },
      limit: 1,
    }),
    client.runReport({
      property,
      dateRanges: [previousRange],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { value: 'search', matchType: 'EXACT' },
        },
      },
      limit: 1,
    }),
    client.runReport({
      property,
      dateRanges: [currentRange],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'totalUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
    client.runReport({
      property,
      dateRanges: [currentRange],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 6,
    }),
  ]);

  const visitorsValue = readSingleMetric(visitorsCurrent.rows);
  const visitorsPrev = readSingleMetric(visitorsPrevious.rows);
  const viewsValue = readSingleMetric(viewsCurrent.rows);
  const viewsPrev = readSingleMetric(viewsPrevious.rows);
  const searchesValue = readEventCount(searchesCurrent.rows, 'search');
  const searchesPrev = readEventCount(searchesPrevious.rows, 'search');

  // Build the per-bucket timeseries, marking today's bucket as `partial`
  // so the SPA renders it with a hatch fill. GA4 may omit dates with zero
  // visitors — fill the gap with zero rows so the bar chart layout stays
  // even.
  const todayIso = toIsoDate(current.end);
  const seenDates = new Map<string, number>();
  for (const row of timeseries.rows ?? []) {
    const ga4Date = row?.dimensionValues?.[0]?.value;
    if (!ga4Date) continue;
    seenDates.set(parseGa4Date(ga4Date), Number(row?.metricValues?.[0]?.value ?? 0));
  }
  const visitorsOverTime: AnalyticsTimeseriesPointWire[] = [];
  for (let i = 0; i < current.days; i += 1) {
    const day = addDays(current.start, i);
    const iso = toIsoDate(day);
    const point: AnalyticsTimeseriesPointWire = {
      date: iso,
      visitors: seenDates.get(iso) ?? 0,
    };
    if (iso === todayIso) point.partial = true;
    visitorsOverTime.push(point);
  }

  const topPageRows: AnalyticsTopPageWire[] = (topPages.rows ?? [])
    .map((row) => ({
      path: row?.dimensionValues?.[0]?.value ?? '',
      views: Number(row?.metricValues?.[0]?.value ?? 0),
    }))
    .filter((p) => p.path);

  return {
    range: {
      label: formatRangeLabel(current.start, current.end),
      start: toIsoDate(current.start),
      end: toIsoDate(current.end),
      bucketDays: 1,
    },
    visitors: {
      value: visitorsValue,
      previousValue: visitorsPrev,
      delta: computeDelta(visitorsValue, visitorsPrev),
    },
    views: {
      value: viewsValue,
      previousValue: viewsPrev,
      delta: computeDelta(viewsValue, viewsPrev),
    },
    searches: {
      value: searchesValue,
      previousValue: searchesPrev,
      delta: computeDelta(searchesValue, searchesPrev),
    },
    visitorsOverTime,
    topPages: topPageRows,
    topUsers: [],
  };
}
