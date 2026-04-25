import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from '@docusaurus/router';
import { track, trackDeduped } from './analytics';
import { deriveSiteContext } from './context';
import type { AnalyticsEventMap, AnalyticsEventName } from './events';

/**
 * Hook entry point. Returns a `track` fn that automatically enriches every
 * event with the current site context (instance, section, pathname).
 */
export function useAnalytics() {
  const { pathname } = useLocation();
  const ctxRef = useRef(deriveSiteContext(pathname));

  // Keep ctxRef fresh without forcing consumers to re-render.
  useEffect(() => {
    ctxRef.current = deriveSiteContext(pathname);
  }, [pathname]);

  const trackEvent = useCallback(
    <K extends AnalyticsEventName>(
      name: K,
      params: AnalyticsEventMap[K] = {} as AnalyticsEventMap[K],
    ) => {
      track(name, { ...ctxRef.current, ...params } as AnalyticsEventMap[K]);
    },
    [],
  );

  const trackEventDeduped = useCallback(
    <K extends AnalyticsEventName>(
      name: K,
      params: AnalyticsEventMap[K],
      key: string,
    ) => {
      trackDeduped(name, { ...ctxRef.current, ...params } as AnalyticsEventMap[K], key);
    },
    [],
  );

  return useMemo(() => ({ track: trackEvent, trackDeduped: trackEventDeduped }), [trackEvent, trackEventDeduped]);
}

/**
 * Fire a `surface_impression` once when the surface mounts. Optional — use for
 * "hero shown", "feature cards shown" analytics. Intersection-observer-based
 * variants live on the auto-tracker.
 */
export function useImpression(
  surface: string,
  extras: { label?: string; position?: number } = {},
) {
  const { track: trackEvent } = useAnalytics();
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackEvent('surface_impression', { surface, ...extras });
  }, [surface, extras.label, extras.position, trackEvent]);
}
