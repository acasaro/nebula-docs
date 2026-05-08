import {
  DATA_ATTR,
  ENGAGED_TIME_MILESTONES,
  INTERNAL_HOSTS,
  SCROLL_DEPTH_MILESTONES,
  TRACKED_PROTOCOLS,
} from "./config";
import { deriveSiteContext } from "./context";
import { track, trackDeduped } from "./core";
import type { AnalyticsEventMap } from "./events";

/**
 * Global click delegation + lifecycle signals.
 *
 * Attach once near the page root. Listens for:
 *  - clicks on `<a>` / `<button>` / `[data-analytics-surface]` elements
 *  - page visibility changes (flushes engagement before tab close)
 *  - scroll depth milestones per route
 *  - engagement time milestones per route
 *  - color-mode toggles via the `data-theme` attribute on `<html>`
 *
 * Returns a cleanup fn.
 */
export function installAutoTracker(): () => void {
  if (typeof window === "undefined") return () => {};

  const onClick = (e: MouseEvent) => handleClick(e);
  document.addEventListener("click", onClick, { capture: true });

  const scrollCleanup = installScrollDepth();
  const engagementCleanup = installEngagementTimer();
  const visibilityCleanup = installVisibilityHook();
  const colorModeCleanup = installColorModeWatcher();

  return () => {
    document.removeEventListener("click", onClick, { capture: true } as AddEventListenerOptions);
    scrollCleanup();
    engagementCleanup();
    visibilityCleanup();
    colorModeCleanup();
  };
}

/* ── click delegation ───────────────────────────────────────────────── */

function handleClick(e: MouseEvent) {
  if (e.defaultPrevented) return;

  const target = e.target;
  if (!(target instanceof Element)) return;

  if (target.closest(`[${DATA_ATTR.ignore}]`)) return;

  // Nebula CodeBlock copy button — appended by the inline script in
  // DocsLayout. Class `nebula-code-copy` on a button inside `pre.astro-code`.
  const copyBtn = target.closest("button.nebula-code-copy") as HTMLButtonElement | null;
  if (copyBtn) {
    handleCodeCopy(copyBtn);
    return;
  }

  const surfaceEl = target.closest(`[${DATA_ATTR.surface}]`) as HTMLElement | null;
  const anchor = target.closest("a") as HTMLAnchorElement | null;

  if (!surfaceEl && !anchor) return;

  const ctx = deriveSiteContext(window.location.pathname);
  const surface = surfaceEl?.getAttribute(DATA_ATTR.surface) ?? undefined;
  // Label / position / category / type can sit on nearer ancestors than the
  // surface root (e.g. surface on a grid, label on a card child). Walk up
  // from the click target independently.
  const labelEl = target.closest(`[${DATA_ATTR.label}]`) as HTMLElement | null;
  const positionEl = target.closest(`[${DATA_ATTR.position}]`) as HTMLElement | null;
  const categoryEl = target.closest(`[${DATA_ATTR.category}]`) as HTMLElement | null;
  const typeEl = target.closest(`[${DATA_ATTR.elementType}]`) as HTMLElement | null;

  const label =
    labelEl?.getAttribute(DATA_ATTR.label)?.trim().slice(0, 100) ||
    resolveLabel(surfaceEl, anchor);
  const position = parsePosition(positionEl ?? surfaceEl);
  const category = categoryEl?.getAttribute(DATA_ATTR.category)?.slice(0, 100) || undefined;
  const elementType =
    typeEl?.getAttribute(DATA_ATTR.elementType) ?? inferElementType(anchor, surfaceEl);

  if (anchor) {
    const href = anchor.getAttribute("href") || "";
    if (!href) return;

    const proto = TRACKED_PROTOCOLS.find((p) => href.startsWith(p));
    if (proto) {
      track("protocol_click", {
        ...ctx,
        surface: surface ?? "link",
        label,
        position,
        category,
        destination: href,
        protocol: proto,
      });
      return;
    }

    const url = resolveUrl(href);
    const external =
      url && url.origin !== window.location.origin && !INTERNAL_HOSTS.includes(url.host);

    if (external && url) {
      track("outbound_click", {
        ...ctx,
        surface: surface ?? "link",
        label,
        position,
        category,
        destination: url.href,
        destination_host: url.host,
      });
      return;
    }

    track("nav_click", {
      ...ctx,
      surface: surface ?? "link",
      label,
      position,
      category,
      destination: url?.pathname ?? href,
      element_type: elementType,
    });
    return;
  }

  if (surfaceEl && surface) {
    const payload: AnalyticsEventMap["custom_interaction"] = {
      ...ctx,
      surface,
      label,
      position,
      category,
      action: "click",
    };
    track("custom_interaction", payload);
  }
}

function resolveLabel(
  surfaceEl: HTMLElement | null,
  anchor: HTMLAnchorElement | null,
): string | undefined {
  const fromAttr =
    surfaceEl?.getAttribute(DATA_ATTR.label) ?? anchor?.getAttribute(DATA_ATTR.label);
  if (fromAttr) return fromAttr.trim().slice(0, 100);
  const text = (surfaceEl?.textContent || anchor?.textContent || "").trim().replace(/\s+/g, " ");
  if (!text) {
    const aria = surfaceEl?.getAttribute("aria-label") || anchor?.getAttribute("aria-label");
    return aria?.slice(0, 100) || undefined;
  }
  return text.slice(0, 100);
}

function parsePosition(surfaceEl: HTMLElement | null): number | undefined {
  const raw = surfaceEl?.getAttribute(DATA_ATTR.position);
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function inferElementType(
  anchor: HTMLAnchorElement | null,
  surface: HTMLElement | null,
): string | undefined {
  if (surface?.tagName === "BUTTON") return "button";
  if (anchor) return "link";
  return undefined;
}

function handleCodeCopy(button: HTMLButtonElement) {
  // Astro Shiki renders `pre.astro-code > code`; the copy button is appended
  // to the pre. Walk up to the pre, then read its <code> child for content
  // and language.
  const pre = button.closest("pre.astro-code") as HTMLElement | null;
  const codeEl = pre?.querySelector("code") ?? null;
  const text = codeEl?.textContent ?? "";
  const language = detectLanguage(pre, codeEl);
  const ctx = deriveSiteContext(window.location.pathname);
  trackDeduped(
    "code_copy",
    { ...ctx, language, length: text.length },
    `copy:${window.location.pathname}:${text.slice(0, 40)}`,
  );
}

function detectLanguage(container: Element | null, codeEl: Element | null): string | undefined {
  for (const source of [container, codeEl]) {
    if (!source) continue;
    for (const cls of Array.from(source.classList)) {
      const m = cls.match(/^(?:language-|prism-code-|language_)([\w+-]+)$/);
      if (m && m[1]) return m[1];
    }
  }
  // Astro's transformer stamps the language onto a data attribute too in
  // some configurations; fall back to it if class-based detection failed.
  const dataLang = container?.getAttribute("data-language") ?? codeEl?.getAttribute("data-language");
  return dataLang ?? undefined;
}

function resolveUrl(href: string): URL | null {
  try {
    return new URL(href, window.location.origin);
  } catch {
    return null;
  }
}

/* ── scroll depth ───────────────────────────────────────────────────── */

function installScrollDepth(): () => void {
  let firedForPath = new Set<number>();
  let lastPath = window.location.pathname;

  const resetIfPathChanged = () => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      firedForPath = new Set();
    }
  };

  const handler = () => {
    resetIfPathChanged();
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100));

    for (const milestone of SCROLL_DEPTH_MILESTONES) {
      if (percent >= milestone && !firedForPath.has(milestone)) {
        firedForPath.add(milestone);
        const ctx = deriveSiteContext(window.location.pathname);
        track("scroll_depth", { ...ctx, percent: milestone });
      }
    }
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      handler();
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

/* ── engagement timer ───────────────────────────────────────────────── */

function installEngagementTimer(): () => void {
  let start = Date.now();
  let fired = new Set<number>();
  let lastPath = window.location.pathname;
  let active = !document.hidden;

  const reset = () => {
    start = Date.now();
    fired = new Set();
    lastPath = window.location.pathname;
  };

  const tick = () => {
    if (!active) return;
    if (window.location.pathname !== lastPath) {
      reset();
      return;
    }
    const seconds = Math.floor((Date.now() - start) / 1000);
    for (const milestone of ENGAGED_TIME_MILESTONES) {
      if (seconds >= milestone && !fired.has(milestone)) {
        fired.add(milestone);
        const ctx = deriveSiteContext(window.location.pathname);
        track("engaged_time", { ...ctx, seconds: milestone });
      }
    }
  };

  const onVisibility = () => {
    active = !document.hidden;
    if (active) start = Date.now() - Math.min(Date.now() - start, 5_000);
  };

  const interval = window.setInterval(tick, 5_000);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    window.clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

/* ── color mode (light/dark) ────────────────────────────────────────── */

function installColorModeWatcher(): () => void {
  // Nebula CLI sets `data-theme="dark"` on `<html>` (see DocsLayout's
  // pre-paint theme bootstrap) so we observe attribute mutations on it.
  const root = document.documentElement;
  let lastMode = (root.getAttribute("data-theme") as "light" | "dark" | null) ?? "light";
  const observer = new MutationObserver(() => {
    const next = (root.getAttribute("data-theme") as "light" | "dark" | null) ?? "light";
    if (next !== lastMode) {
      lastMode = next;
      track("color_mode_toggle", { mode: next });
    }
  });
  observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/* ── visibility ─────────────────────────────────────────────────────── */

function installVisibilityHook(): () => void {
  // Placeholder for future flush-on-pagehide logic; Firebase batches for us,
  // so just keep a hook here for symmetry with the others.
  return () => {};
}

/**
 * Fire a `page_view` event for a given pathname. Astro reloads the page on
 * navigation, so a single bootstrap-time call is enough — there's no
 * client-side router to subscribe to.
 */
export function firePageView(pathname: string, title?: string): void {
  const ctx = deriveSiteContext(pathname);
  trackDeduped(
    "page_view",
    {
      ...ctx,
      page_title: title,
      page_location: typeof window !== "undefined" ? window.location.href : undefined,
      page_referrer: typeof document !== "undefined" ? document.referrer : undefined,
    },
    `pv:${pathname}`,
  );
}
