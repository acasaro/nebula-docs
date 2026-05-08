import { useEffect, useState } from "react";
import { getApp } from "@nebula-docs/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { env } from "@/lib/env";
import type {
  AnalyticsRangeKey,
  AnalyticsSummary,
  AnalyticsSummaryState,
  AnalyticsTimeseriesPoint,
} from "./types";

interface AnalyticsSummaryRequest {
  rangeKey: AnalyticsRangeKey;
}

/**
 * Wire shape returned by `functions/src/getAnalyticsSummary*.ts`. Dates
 * round-trip as ISO strings (callable response is JSON), so we decode
 * back to `Date` instances before handing the result to the UI.
 */
interface AnalyticsSummaryWire {
  range: { label: string; start: string; end: string; bucketDays: number };
  visitors: { value: number; previousValue: number; delta: number | null };
  views: { value: number; previousValue: number; delta: number | null };
  searches: { value: number; previousValue: number; delta: number | null };
  visitorsOverTime: Array<{ date: string; visitors: number; partial?: boolean }>;
  topPages: Array<{ path: string; views: number }>;
  topUsers: Array<{ name: string; avatarUrl?: string; events: number }>;
}

function decode(wire: AnalyticsSummaryWire): AnalyticsSummary {
  const decodePoint = (p: AnalyticsSummaryWire["visitorsOverTime"][number]): AnalyticsTimeseriesPoint => ({
    date: new Date(p.date),
    visitors: p.visitors,
    ...(p.partial ? { partial: true } : {}),
  });
  return {
    range: {
      label: wire.range.label,
      start: new Date(wire.range.start),
      end: new Date(wire.range.end),
      bucketDays: wire.range.bucketDays,
    },
    visitors: wire.visitors,
    views: wire.views,
    searches: wire.searches,
    visitorsOverTime: wire.visitorsOverTime.map(decodePoint),
    topPages: wire.topPages,
    topUsers: wire.topUsers,
  };
}

/**
 * Returns an `AnalyticsSummary` for the active range by invoking the
 * `getAnalyticsSummary{,Dev}` callable. Auth-gated on the function side —
 * the caller must already be a signed-in Firebase user, which the editor
 * shell guarantees via `ProtectedRoute`.
 */
export function useAnalyticsSummary(rangeKey: AnalyticsRangeKey): AnalyticsSummaryState {
  const [state, setState] = useState<AnalyticsSummaryState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    const fn = httpsCallable<AnalyticsSummaryRequest, AnalyticsSummaryWire>(
      getFunctions(getApp()),
      env.fn.getAnalyticsSummary,
    );

    fn({ rangeKey })
      .then((result) => {
        if (cancelled) return;
        setState({ status: "ready", data: decode(result.data) });
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Could not load analytics.";
        setState({ status: "error", error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [rangeKey]);

  return state;
}
