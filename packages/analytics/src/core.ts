import { DEDUPE_WINDOW_MS, isDebugMode } from "./config";
import { clipParam, safeValue } from "./context";
import type { AnalyticsEventMap, AnalyticsEventName } from "./events";
import type { AnalyticsProvider } from "./provider";

type Listener = <K extends AnalyticsEventName>(name: K, params: AnalyticsEventMap[K]) => void;

let provider: AnalyticsProvider | null = null;
let ready = false;
let pendingQueue: Array<() => void> = [];
let debug = false;
const listeners = new Set<Listener>();
const dedupeCache = new Map<string, number>();

/**
 * Register a provider as the dispatch target. Flushes any events captured
 * before the provider was ready. Safe to call multiple times — replacing
 * the provider mid-session is supported but rare.
 */
export function setProvider(p: AnalyticsProvider, opts: { environment?: string } = {}): void {
  provider = p;
  debug = isDebugMode(opts.environment);
  ready = true;
  const flushed = pendingQueue;
  pendingQueue = [];
  flushed.forEach((fn) => fn());
}

/** Returns true once a provider is registered and ready to dispatch. */
export function isAnalyticsReady(): boolean {
  return ready && provider !== null;
}

/** Returns the active provider (for tests / instrumentation). */
export function getProvider(): AnalyticsProvider | null {
  return provider;
}

/**
 * Log a typed event. When no provider is registered yet, events are queued
 * and flushed on the next `setProvider` call. In debug mode, events are
 * mirrored to the console.
 */
export function track<K extends AnalyticsEventName>(
  name: K,
  params: AnalyticsEventMap[K] = {} as AnalyticsEventMap[K],
): void {
  const sanitized = sanitizeParams(params as Record<string, unknown>);

  if (debug) {
    console.debug("[analytics]", name, sanitized);
  }

  listeners.forEach((l) => {
    try {
      l(name, params);
    } catch {
      // Listeners must not break the pipeline.
    }
  });

  const send = () => {
    if (!provider) return;
    provider.send(name as string, sanitized);
  };

  if (!ready) {
    pendingQueue.push(send);
    return;
  }
  send();
}

/**
 * Like `track`, but drops duplicate calls within `DEDUPE_WINDOW_MS` that share
 * the same dedupe key. Useful for defending against double-clicks, rapid
 * re-renders, and StrictMode double-invocation.
 */
export function trackDeduped<K extends AnalyticsEventName>(
  name: K,
  params: AnalyticsEventMap[K],
  key: string,
): void {
  const now = Date.now();
  const last = dedupeCache.get(key);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return;
  dedupeCache.set(key, now);
  // Opportunistic GC so the map doesn't grow forever.
  if (dedupeCache.size > 256) {
    for (const [k, t] of dedupeCache) {
      if (now - t > DEDUPE_WINDOW_MS * 4) dedupeCache.delete(k);
    }
  }
  track(name, params);
}

/** GA4 user identifier. Pass `null` to clear. */
export function setUserId(id: string | null): void {
  const apply = () => {
    if (!provider) return;
    provider.setUserId(id);
  };
  if (ready) apply();
  else pendingQueue.push(apply);
}

/** Merge additional user properties onto the current session. */
export function setUserProperties(props: Record<string, string | number | boolean | null>): void {
  const apply = () => {
    if (!provider) return;
    provider.setUserProperties(props);
  };
  if (ready) apply();
  else pendingQueue.push(apply);
}

/**
 * Register a side-channel listener. Useful for tests, debugging overlays, or
 * secondary sinks. Returns an unsubscribe fn.
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* ── internals ──────────────────────────────────────────────────────── */

function sanitizeParams(raw: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = clipParam(k, 40);
    if (!key) continue;
    const safe = safeValue(v);
    if (safe === undefined) continue;
    out[key] = safe;
  }
  return out;
}
