import { useEffect, useState } from "react";
import { buildAnalyticsMock } from "./mockData";
import type { AnalyticsRangeKey, AnalyticsSummaryState } from "./types";

/**
 * Returns an `AnalyticsSummary` for the active range.
 *
 * Today this resolves a deterministic mock; the call signature mirrors the
 * planned `getAnalyticsSummary` Cloud Function so swapping in the live source
 * is a single-file change in this hook.
 */
export function useAnalyticsSummary(rangeKey: AnalyticsRangeKey): AnalyticsSummaryState {
  const [state, setState] = useState<AnalyticsSummaryState>({ status: "loading" });

  useEffect(() => {
    setState({ status: "loading" });
    const handle = window.setTimeout(() => {
      setState({ status: "ready", data: buildAnalyticsMock(rangeKey) });
    }, 120);
    return () => window.clearTimeout(handle);
  }, [rangeKey]);

  return state;
}
