import { useCallback, useSyncExternalStore } from 'react';

// Cross-component UI prefs that persist across reloads. Each pref is a
// singleton store with its own getSnapshot/subscribe so any component can
// read or write it without a parent provider, and every subscriber re-renders
// in lockstep when the value changes.

type Listener = () => void;

interface Store<T> {
  read: () => T;
  set: (next: T) => void;
  subscribe: (l: Listener) => () => void;
}

function makeStore<T>(
  key: string,
  defaultValue: T,
  parse: (raw: string) => T | undefined,
  serialize: (value: T) => string,
): Store<T> {
  const listeners = new Set<Listener>();
  let cached: { value: T } | null = null;

  function read(): T {
    if (cached) return cached.value;
    if (typeof window === 'undefined') {
      cached = { value: defaultValue };
      return defaultValue;
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        const parsed = parse(raw);
        if (parsed !== undefined) {
          cached = { value: parsed };
          return parsed;
        }
      }
    } catch {
      // localStorage unavailable (private mode, embedded iframe) — fall
      // through to the default; reads still work, just without persistence.
    }
    cached = { value: defaultValue };
    return defaultValue;
  }

  function set(next: T) {
    cached = { value: next };
    try {
      window.localStorage.setItem(key, serialize(next));
    } catch {
      // ignore quota / disabled storage; in-memory cache still propagates
    }
    for (const l of listeners) l();
  }

  function subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }

  return { read, set, subscribe };
}

const EDITOR_NAV_DEFAULT = 288;
// Min equals default — the handle only widens the sidebar, never narrows it
// below the original column width.
export const EDITOR_NAV_MIN = 288;
export const EDITOR_NAV_MAX = 560;

const editorNavWidthStore = makeStore<number>(
  'nebula:ui:editorNavWidth',
  EDITOR_NAV_DEFAULT,
  (raw) => {
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) return undefined;
    if (n < EDITOR_NAV_MIN || n > EDITOR_NAV_MAX) return undefined;
    return n;
  },
  (n) => String(n),
);

const mainNavCollapsedStore = makeStore<boolean>(
  'nebula:ui:mainNavCollapsed',
  false,
  (raw) => (raw === '1' ? true : raw === '0' ? false : undefined),
  (v) => (v ? '1' : '0'),
);

export function useEditorNavWidth(): [number, (next: number) => void] {
  const value = useSyncExternalStore(
    editorNavWidthStore.subscribe,
    editorNavWidthStore.read,
    () => EDITOR_NAV_DEFAULT,
  );
  const set = useCallback((next: number) => {
    const clamped = Math.max(EDITOR_NAV_MIN, Math.min(EDITOR_NAV_MAX, Math.round(next)));
    editorNavWidthStore.set(clamped);
  }, []);
  return [value, set];
}

export function useMainNavCollapsed(): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore(
    mainNavCollapsedStore.subscribe,
    mainNavCollapsedStore.read,
    () => false,
  );
  const set = useCallback((next: boolean) => {
    mainNavCollapsedStore.set(next);
  }, []);
  return [value, set];
}
