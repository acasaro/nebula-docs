# Analytics

Event instrumentation for tenant docs sites + the dashboard that reads
those events back. Two systems, one mental model. Read this when touching
anything in `packages/analytics/`, the `getAnalyticsSummary*` Cloud
Functions, or the `/analytics` route in the Platform.

## Two systems, deliberately decoupled

```
┌──────────────────┐   events   ┌────────────────┐   read   ┌───────────────┐
│  CLI-rendered    │ ─────────► │ GA4 property   │ ───────► │ Cloud Function │
│  tenant docs     │  (Firebase │ on mcoe-d      │  (GA4    │ getAnalytics-  │
│  site            │   SDK)     │ (#533814457)   │  Data    │ Summary{,Dev}  │
│                  │            │                │   API)   │                │
│  @nebula-docs/   │            │  Same project  │          │  functions/    │
│  analytics +     │            │  serves prod + │          │                │
│  Firebase        │            │  dev — no env  │          │                │
│  provider        │            │  split on the  │          │                │
│                  │            │  property      │          │                │
└──────────────────┘            └────────────────┘          └───────┬───────┘
                                                                    │
                                                                    │ httpsCallable
                                                                    ▼
                                                           ┌──────────────────┐
                                                           │  Platform        │
                                                           │  /analytics page │
                                                           │  + Home widgets  │
                                                           │  (eventually)    │
                                                           └──────────────────┘
```

- **Write side** — `@nebula-docs/analytics` runs in every tenant docs page
  served by the CLI. Captures `page_view`, `nav_click`, `outbound_click`,
  `protocol_click`, `code_copy`, `search`, `theme_switch`,
  `color_mode_toggle`, `scroll_depth`, `engaged_time`,
  `surface_impression`, `custom_interaction`. Ships them to GA4 via the
  Firebase Analytics SDK.
- **Read side** — the Platform calls `getAnalyticsSummary{,Dev}` over a
  Firebase callable. The function authenticates with a service account
  JSON, queries GA4 Data API, shapes the response to match the SPA's
  `AnalyticsSummary` type, and returns aggregates for the active range.

The two halves never touch each other directly. The GA4 property is the
seam. Either side can change shape (event taxonomy, dashboard cards)
without redeploying the other.

## Settled decisions

These are decided. Don't re-litigate in a new chat without flagging here
first.

| Decision | What we picked | Why |
|---|---|---|
| Provider for v1 | Firebase Analytics SDK → GA4 | MCOE was already using it on the legacy Docusaurus site; same project (`mcoe-d`) serves both. No vendor switch tax. |
| Env split for the GA4 property | None — same property serves dev + prod | Property/account access is at the GCP-project level. Splitting per env would require a second GCP project + duplicate access management for negligible benefit on a public-traffic site. |
| Read path | GA4 Data API (not BigQuery export) | Real-time-ish, no daily-job lag, no extra billing surface. Trade-off: no user-level breakdowns (see Top users). |
| Site context (`doc_instance`, `doc_section`) derivation | MCOE-specific path map (`developers`, `resources`, `product`, `about`, `announcements`, `support`) | Hard-coded until tenant #2 lands. When that happens, lift into a tenant config and accept as an argument; don't generalize speculatively. |
| Function VPC | None | GA4 Data API is on the public Google network. The MintGithubToken pattern's VPC connector is for GitHub Enterprise; analytics doesn't need it. |
| Bootstrap in CLI layouts | Dynamic `import()` from inside an inline module script | Astro's hoisted-script pipeline silently dropped a side-effect-only import here. Wrapping it in `import('/src/runtime/analytics/bootstrap.mjs').catch(...)` from `<script is:inline type="module">` is the workaround. Documented in code comments. |
| Top users | Always empty for now | GA4 Data API doesn't expose user-level breakdowns without a `userId` set on the SDK side; public docs are anonymous. Either adopt BigQuery export or punt indefinitely. The dashboard column is honest about it ("No active users yet"). |
| Caching on the function | None | Editor-only audience today. Add a 5-minute Firestore-backed cache the moment the dashboard opens up to wider traffic. |

## Code map

```
packages/analytics/                                      # the package
  src/
    index.ts                # public barrel
    core.ts                 # provider-agnostic queue / track / dedupe / listeners
    provider.ts             # AnalyticsProvider interface
    events.ts               # AnalyticsEventMap (the typed schema)
    config.ts               # milestones, internal hosts, tracked protocols, debug flag
    context.ts              # deriveSiteContext (MCOE-specific), clipParam, safeValue
    autoTracker.ts          # DOM click delegation + scroll/engagement/color-mode watchers
    firebase/
      index.ts              # bootstrapFirebase — registers provider via setProvider()

packages/cli/                                            # CLI integration
  src/
    cli/
      prepareAstro.mjs      # loads root .env, emits .nebula/analyticsConfig.mjs
    layouts/
      DocsLayout.astro      # mounts <AnalyticsBootstrap />
      CustomLayout.astro    # mounts <AnalyticsBootstrap /> (custom-mode pages)
    runtime/
      analytics/
        AnalyticsBootstrap.astro   # tiny wrapper: <script is:inline type="module">…</script>
        bootstrap.mjs              # imports config + package, calls bootstrapFirebase + installAutoTracker + firePageView
      search/
        SearchModal.tsx     # fires `search` event after Pagefind returns results
  .nebula/analyticsConfig.mjs       # GENERATED at startup; gitignored

functions/                                               # read-side
  src/
    getAnalyticsSummary.ts            # prod callable
    getAnalyticsSummaryHandler.ts     # shared GA4 query + shaping (used by both)
    dev/
      getAnalyticsSummaryDev.ts       # dev callable (same handler)

products/nebula-platform/                                # dashboard
  src/
    routes/Analytics.tsx              # route entry (just renders <AnalyticsPage />)
    components/analytics/
      AnalyticsPage.tsx               # composes the page
      MetricCard.tsx                  # Visitors / Views / Searches cards
      VisitorsChart.tsx               # SVG bar chart with hatched partial-day bar
      TopPagesTable.tsx
      TopUsersTable.tsx               # currently always shows empty state
      DateRangePicker.tsx             # 7d / 30d / 90d
    lib/analytics/
      types.ts                        # AnalyticsSummary, AnalyticsRangeKey, etc.
      mockData.ts                     # buildAnalyticsMock (fallback when no provider)
      useAnalyticsSummary.ts          # the hook that calls httpsCallable

tenants/mcoe-docs/docs.json           # opt-in: { "analytics": { "provider": "firebase" } }
```

## Data flow

### Write — page load on the docs site

```
1. CLI renders the page; layout includes <AnalyticsBootstrap />
2. <script is:inline type="module"> dynamic-imports bootstrap.mjs
3. bootstrap.mjs reads .nebula/analyticsConfig.mjs
   → if `null` (tenant didn't opt in), no-op and exit
   → if firebase provider, call bootstrapFirebase({ firebaseConfig, environment })
4. bootstrapFirebase awaits isSupported(), then setProvider(firebaseProvider)
5. installAutoTracker() attaches the click delegate + scroll/engagement/color-mode listeners
6. firePageView(window.location.pathname, document.title) → trackDeduped('page_view', ...)
7. Subsequent clicks / scroll milestones / engagement ticks fire the typed events
8. Each event passes through the core's queue → provider.send → logEvent(analytics, ...)
```

Astro is full-page-reload between routes (no client router), so every
navigation re-runs steps 1–6. There's no need for router subscription
hooks.

### Read — dashboard load

```
1. User navigates to /analytics in the Platform
2. AnalyticsPage mounts, useAnalyticsSummary("7d") fires
3. Hook resolves env.fn.getAnalyticsSummary → "getAnalyticsSummary" or "getAnalyticsSummaryDev"
4. httpsCallable(getFunctions(getApp()), <name>)({ rangeKey })
5. Function checks request.auth, validates rangeKey, parses GA4_SERVICE_ACCOUNT_JSON
6. getAnalyticsSummaryHandler runs ~8 GA4 Data API queries in parallel
   (current + previous totalUsers, current + previous screenPageViews,
    current + previous search-event count, daily timeseries, top pages)
7. Handler shapes response to AnalyticsSummaryWire (dates as ISO strings)
8. Hook decodes ISO dates → Date instances, returns ready state
9. AnalyticsPage renders cards / chart / tables
```

Total round-trip is ~1.5s cold, ~600ms warm. No caching.

## Configuration

### Workspace root `.env` (gitignored)

```
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=mcoe-d
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGE_SENDER_ID=...
FIREBASE_APP_ID=...
FIREBASE_MEASUREMENT_ID=...
```

Loaded at CLI startup by `prepareAstro.mjs` via `process.loadEnvFile()`
(Node ≥22, see `.nvmrc`). Same values feed Platform (Vite) and the legacy
Docusaurus site.

### Functions env (`functions/.env`, gitignored)

```
GA4_PROPERTY_ID=533814457
```

Required for Firebase deploys to succeed (parameterized config). Not
sensitive — the property ID is a public identifier.

### Functions secrets (Google Secret Manager)

```
GA4_SERVICE_ACCOUNT_JSON   # full JSON, set via --data-file
```

Set with:

```
firebase functions:secrets:set GA4_SERVICE_ACCOUNT_JSON \
  --data-file=/path/to/firebase-key.json
```

**Never** paste secrets interactively (memory rule). The current key is
the auto-generated `firebase-adminsdk-fbsvc@mcoe-d.iam.gserviceaccount.com`
service account, granted Viewer role on the GA4 property.

### Tenant opt-in (`docs.json`)

```json
{
  "analytics": {
    "provider": "firebase"
  }
}
```

When absent, `prepareAstro.mjs` writes `.nebula/analyticsConfig.mjs`
exporting `null` and the bootstrap short-circuits — zero analytics JS
runs.

### Generated artefact (`packages/cli/.nebula/analyticsConfig.mjs`, gitignored)

```js
export default {
  provider: 'firebase',
  environment: 'development' | 'production',
  firebaseConfig: { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId }
};
```

Or `export default null;` when the tenant hasn't opted in OR when one of
the FIREBASE_* env vars is missing (fail closed).

## Operations

### Deploying the Cloud Function

```
# Dev only (the default for active development)
pnpm --filter @nebula-docs/functions deploy:dev

# Prod (required before flipping NEBULA_ENV=prod on the SPA)
pnpm --filter @nebula-docs/functions deploy:prod
```

Both scripts include `getAnalyticsSummary{Dev,}` alongside the GitHub App
functions. Don't run the unfiltered `deploy` — it touches both env
variants and risks pushing dev code into prod slots.

### Verifying analytics events flowing

1. Boot the CLI dev preview against MCOE: `nebula-cli-mcoe` launch
   config (or `pnpm --filter @nebula-docs/cli dev tenants/mcoe-docs`).
2. Open the page in a browser, do something (click a nav link, scroll).
3. Check the Firebase console → Analytics → DebugView for `mcoe-d`. Events
   should appear within ~30 seconds when the SDK is in debug mode
   (automatic when `environment === 'development'` per the config).
4. Or inspect the network tab for `googletagmanager.com/g/collect`
   beacons (the underlying Firebase Analytics endpoint).

### Verifying the dashboard

1. SPA at `/analytics` should show real numbers, not the mock fallback.
2. Loading state shows the Nebula Loader.
3. Error state shows the raw HttpsError message — the most common one is
   `"Google Analytics Data API has not been used in project … or it is
   disabled"` (see Troubleshooting).

### Troubleshooting

**Dashboard shows "INTERNAL"**

Check `firebase functions:log --only getAnalyticsSummaryDev`. The
function wraps unhandled errors as INTERNAL. Three common causes:

1. **GA4 Data API disabled** on the GCP project. Error message includes
   the activation URL with the project number pre-filled. Enable it,
   wait ~2 min for propagation, retry.
2. **Service account missing GA4 property access**. Add
   `firebase-adminsdk-fbsvc@mcoe-d.iam.gserviceaccount.com` as a Viewer
   in GA4 → Admin → Property access management.
3. **Wrong Property ID** in `functions/.env`. Verify against GA4 → Admin
   → Property settings.

**Events fire locally but not visible in GA4**

Firebase Analytics has a delay of up to ~24h for non-DebugView reports.
Use DebugView during testing — it shows events within ~30s.

**Dashboard works in dev mode but breaks in prod**

`getAnalyticsSummary` (prod variant) wasn't deployed. The Platform's
`env.fn.getAnalyticsSummary` resolves to the prod name (no `Dev`
suffix). Run `deploy:prod`.

**`UnknownContentCollectionError` on every CLI page after restart**

Known HMR brittleness. Per the memory rule:
[feedback_astro_config_hmr_restart.md](../.claude). Stop the dev server,
start it fresh, don't try to fix in place.

## Known limits

- **Top users** is always empty. GA4 Data API doesn't expose user-level
  breakdowns without `setUserId()` having been called by the SDK. The
  docs site is anonymous traffic. Two paths forward if it matters:
  enable BigQuery export and query `userPseudoId` against
  `events_intraday_*`, or wait for the docs site to gain a sign-in flow.
- **No caching.** Every dashboard load = 8 Data API requests. Editor-only
  audience today, fine. If the page goes wider, add a 5-minute
  Firestore-backed cache keyed on `{ rangeKey, today }`.
- **Phase 4 (`data-analytics-surface` tagging) not done.** Today nav
  clicks come back as `surface: "link"` with the link text as the label.
  Tagging specific Nebula components in `packages/components/` (Card,
  FeatureCard, navbar tabs, footer columns) with explicit surface names
  would give cleaner aggregations like
  `surface: "navbar.primary_links"` instead of one undifferentiated
  bucket. The auto-tracker already reads `data-analytics-surface` —
  components just need to emit the attribute.
- **`deriveSiteContext` is MCOE-specific.** When tenant #2 lands, lift
  the instance set into a tenant config (probably `docs.json.analytics.contextMap`) and accept it as a function argument.

## Extension points

### Adding a new event type

1. Add the event + its parameter shape to `packages/analytics/src/events.ts`
   (`AnalyticsEventMap`). Stay snake_case, ≤40 chars on names, ≤100
   chars on values.
2. Call `track('your_event', { ... })` from wherever the user action
   originates. The auto-tracker is for DOM-delegated events; bespoke
   actions (search submit, app-specific affordances) should fire `track`
   directly. See `SearchModal.tsx` for the canonical example.
3. If you want it on the dashboard, extend `AnalyticsSummaryWire` in
   `functions/src/getAnalyticsSummaryHandler.ts`, add a GA4 Data API
   query for it, mirror the field on `AnalyticsSummary` in the Platform
   (`products/nebula-platform/src/lib/analytics/types.ts`), and render a
   card / table for it.

### Adding a new provider

1. Implement `AnalyticsProvider` (see `packages/analytics/src/provider.ts`)
   in a new subpath: `packages/analytics/src/<provider>/index.ts`.
2. Export it via `package.json` exports map: `"./<provider>"`.
3. Provider's bootstrap function calls
   `setProvider(provider, { environment })` once initialized.
4. Update `prepareAstro.mjs`'s `resolveAnalyticsConfig` to accept
   `docs.json.analytics.provider === "<your-provider>"` and emit the
   appropriate config shape.
5. Update `runtime/analytics/bootstrap.mjs` to dispatch on provider name.

### Switching MCOE to BigQuery export later

If the Top users column ever matters, BigQuery is the path. Outline:

1. In GA4 → Admin → BigQuery Linking, link the `mcoe-d` GCP project.
   This creates an `analytics_<propertyId>` dataset with daily +
   intraday tables.
2. Grant the function's service account `roles/bigquery.dataViewer` +
   `roles/bigquery.jobUser` on that dataset.
3. Add `@google-cloud/bigquery` to `functions/package.json`.
4. Replace the `userPseudoId` query path in
   `getAnalyticsSummaryHandler.ts` with a BigQuery SQL query against
   `events_intraday_*`.
5. The Data API queries (visitors / views / searches / top pages) can
   stay — no need to migrate everything if only one column needs the
   richer source.

## See also

- [architecture.md](architecture.md) — 10000-ft framework view
- [status.md](status.md) — workstream snapshot (this work was #4 in Upcoming)
- [conventions.md](conventions.md) — repo-wide rules including secrets handling
- The `products/docs/src/lib/analytics/` legacy implementation —
  reference for the original event taxonomy and auto-tracker design;
  delete once we're sure no behavior was missed.
