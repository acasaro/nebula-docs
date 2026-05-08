import type { SiteContextParams } from "./events";

/**
 * Derive site-context parameters from a pathname.
 *
 * MCOE-specific: top-level segments map to known instances (developers,
 * resources, product, about, announcements, support). When tenant #2 lands,
 * lift the instance set into a tenant config and accept it as an argument.
 *
 * `doc_section` is the first segment after the instance — useful for
 * segmenting "release-management" vs. "mobile-ci" clicks without
 * exploding cardinality.
 */
export function deriveSiteContext(pathname: string): SiteContextParams {
  const clean = pathname.replace(/^\/+|\/+$/g, "");
  if (!clean) {
    return { doc_instance: "home", page_path: "/" };
  }

  const [first, second] = clean.split("/");

  const KNOWN_INSTANCES = new Set([
    "developers",
    "resources",
    "product",
    "about",
    "announcements",
    "support",
  ]);

  const doc_instance = first && KNOWN_INSTANCES.has(first) ? first : "other";
  const doc_section = second || undefined;

  return {
    doc_instance,
    doc_section,
    page_path: "/" + clean,
  };
}

/** Truncate a string to GA4's 100-char parameter limit. */
export function clipParam(value: string | undefined, max = 100): string | undefined {
  if (value === undefined) return undefined;
  if (value.length <= max) return value;
  return value.slice(0, max - 1) + "…";
}

/** Coerce an unknown into a GA4-safe scalar. */
export function safeValue(value: unknown): string | number | boolean | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return clipParam(value);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value;
  try {
    return clipParam(String(value));
  } catch {
    return undefined;
  }
}
