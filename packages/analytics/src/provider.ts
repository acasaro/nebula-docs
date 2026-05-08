/**
 * Provider interface — what the analytics core needs from any concrete
 * sink (Firebase, GA4, PostHog, Plausible, …). Keeping this small lets
 * the core stay framework- and vendor-agnostic.
 */
export interface AnalyticsProvider {
  /** Identifier surfaced for diagnostics. */
  readonly name: string;
  /** Fire-and-forget event dispatch. */
  send(name: string, params: Record<string, string | number | boolean>): void;
  /** Set or clear the user identifier on the active session. */
  setUserId(id: string | null): void;
  /** Merge user properties onto the active session. */
  setUserProperties(props: Record<string, string | number | boolean | null>): void;
}
