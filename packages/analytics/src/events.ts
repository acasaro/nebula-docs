/**
 * Typed event schema for the analytics pipeline.
 *
 * Conventions:
 * - Event names are snake_case and <= 40 chars (GA4 limit).
 * - Parameter names are snake_case and <= 40 chars; values <= 100 chars.
 * - Prefer a small set of well-typed events over ad-hoc string literals.
 * - Reserved GA4 events (`page_view`, `search`, `login`, etc.) are allowed and
 *   keep their native meaning so standard GA4 reports still work.
 */

/* ── Shared parameter shapes ────────────────────────────────────────── */

/** Where in the site the event originated. Derived from pathname. */
export interface SiteContextParams {
  /** Top-level instance bucket. */
  doc_instance?: string;
  /** First path segment after the instance. */
  doc_section?: string;
  /** Full pathname at time of event. */
  page_path?: string;
}

/** Surface = the component or region the user interacted with. */
export interface SurfaceParams {
  /** e.g. "navbar.tabs", "home.feature_cards", "support.channels". */
  surface: string;
  /** Free-form label — typically the visible text of the element. */
  label?: string;
  /** Position within a list (0-indexed). */
  position?: number;
  /** Optional secondary grouping (e.g. feature category, section). */
  category?: string;
}

/* ── Event catalog ──────────────────────────────────────────────────── */

export type AnalyticsEventMap = {
  /** GA4 reserved — fired on every route change. */
  page_view: SiteContextParams & {
    page_title?: string;
    page_location?: string;
    page_referrer?: string;
  };

  /** Internal link/button/card clicks. Use for navigation within the site. */
  nav_click: SurfaceParams &
    SiteContextParams & {
      destination: string;
      /** "link" | "button" | "card" | "tab" | "sidebar" | "cta" */
      element_type?: string;
    };

  /** Clicks on anything leaving the domain. */
  outbound_click: SurfaceParams &
    SiteContextParams & {
      destination: string;
      destination_host: string;
    };

  /** Clicks on mailto: / tel: / teams: / other protocols. */
  protocol_click: SurfaceParams &
    SiteContextParams & {
      destination: string;
      protocol: string;
    };

  /** User copied a code block. */
  code_copy: SiteContextParams & {
    language?: string;
    /** Char length of snippet — crude "value" signal. */
    length?: number;
    /** Free-form grouping (e.g. "install", "config"). */
    snippet_id?: string;
  };

  /** GA4 reserved — use when users submit a search term. */
  search: SiteContextParams & {
    search_term: string;
  };

  /** User switched the docs theme (mcoe-default → uhc → optum, etc). */
  theme_switch: {
    from_theme: string;
    to_theme: string;
  };

  /** User toggled light/dark color mode. */
  color_mode_toggle: {
    mode: "light" | "dark";
  };

  /** Scroll-depth milestone (25/50/75/100) reached on current page. */
  scroll_depth: SiteContextParams & {
    percent: 25 | 50 | 75 | 100;
  };

  /** Reached time-on-page milestone (in seconds). */
  engaged_time: SiteContextParams & {
    seconds: 15 | 30 | 60 | 120 | 300;
  };

  /** Generic surface-impression — fires once when a tagged surface enters view. */
  surface_impression: SurfaceParams & SiteContextParams;

  /** Catch-all for surfaces that don't fit the above. Use sparingly. */
  custom_interaction: SurfaceParams &
    SiteContextParams & {
      action: string;
      [key: string]: unknown;
    };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;
