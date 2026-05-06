# Component API audit: Mintlify spec vs Nebula Docs

Comparison of the Mintlify documented MDX surface (per `vendor/mint-docs-ref/.claude/skills/mintlify/reference/`) against Nebula's current implementation in `packages/components/src/`, `packages/schemas/src/blocks/`, and the platform editor registry at `products/nebula-platform/src/components/mdx/registry.tsx`.

Status legend: `match` = identical prop set + types + semantics. `drift` = component exists with at least one prop discrepancy. `missing` = no Nebula equivalent. `renamed` = prop name(s) differ but semantics match.

## 1. Components

| Mintlify component | Nebula component | Schema | Status | Drift details |
|---|---|---|---|---|
| `Note` | `packages/components/src/callout/Callout.tsx` (`Note`) | via `blocks/callout.ts` | drift | Mintlify exposes `Note` as a fixed-variant callout with no variant override. Nebula's `Note` is a preset wrapping `Callout` and inherits `title`, `icon`, `className`, `ariaLabel`. Mintlify spec docs no props on `Note` — Nebula adds `title`, `icon`, `className`, `ariaLabel`. Visually maps a different Lucide icon (`CircleAlert`) than Mintlify's `Note` reference; cosmetic drift only. |
| `Info` | `callout/Callout.tsx` (`Info`) | `blocks/callout.ts` | drift | Same shape as `Note`. Schema `calloutVariant` enum includes `info` so MDX→block round-trips. Note: registry exports `Info` correctly. |
| `Tip` | `callout/Callout.tsx` (`Tip`) | `blocks/callout.ts` | match | Preset wrapping shared `Callout`. |
| `Warning` | `callout/Callout.tsx` (`Warning`) | `blocks/callout.ts` | match | Preset wrapping shared `Callout`. |
| `Check` | `callout/Callout.tsx` (`Check`) | `blocks/callout.ts` | match | Preset wrapping shared `Callout`. |
| `Danger` | `callout/Callout.tsx` (`Danger`) | `blocks/callout.ts` | match | Preset wrapping shared `Callout`. |
| `Callout` (custom) | `callout/Callout.tsx` (`Callout`) | `blocks/callout.ts` | drift | Mintlify props per `components.md` reference: `icon` (string), `color` (string), `iconType` (string). Nebula `Callout` props: `title`, `variant`, `icon` (ReactNode), `className`, `ariaLabel`. Drift: Nebula is missing `color` (Mintlify accepts a hex value), missing `iconType` (passed through to the icon library), and missing standalone `iconType` propagation; Nebula adds `title`, `variant`, `className`, `ariaLabel` not in spec. Schema: `calloutPropsSchema` accepts `color` and `iconLibrary` (Nebula-only name) — so the schema includes Nebula extras (`title`, `iconLibrary`) and is missing `iconType`. |
| `Accordion` | `accordion/Accordion.tsx` | (no schema) | drift | Mintlify props: `title` (string, required), `description` (string), `defaultOpen` (boolean), `icon` (string), `iconType` (string). Nebula props: `title` (ReactNode), `description` (string), `defaultOpen` (boolean), `icon` (ReactNode), `className`. Drift: Nebula `title` is `ReactNode` instead of `string`; Nebula `icon` is `ReactNode` (Mintlify is `string` — name only); Nebula is missing `iconType`; Nebula adds `className`. No `accordion` block schema exists in `packages/schemas/src/blocks/`. |
| `AccordionGroup` | `accordion/Accordion.tsx` (`AccordionGroup`) | — | match | No props beyond `children` + `className`; matches spec (which documents none). |
| `Card` | `card/Card.tsx` | — | drift | Mintlify props: `title` (required), `icon` (string), `iconType` (string), `color` (string for icon hex), `href`, `horizontal` (boolean), `img` (string), `cta` (string), `arrow` (boolean). Nebula props: `title` (ReactNode), `icon` (ReactNode), `img`, `horizontal`, `href`, `cta`, `arrow`, `disabled`, `className`. Drift: Nebula is missing `iconType` and `color`; Nebula `title` is optional (Mintlify required); Nebula `icon` accepts ReactNode (string handled internally); Nebula adds `disabled` and `className` (not in spec). No card schema. |
| `Columns` | `columns/Columns.tsx` | — | match | Mintlify: `cols` (number, default 2). Nebula: `cols` (1-4 union or string template, default 2), `className`. Coerces string `cols`. Functionally identical. Also exports `CardGroup` as alias of `Columns` (compatible with Mintlify ecosystem usage). |
| `Steps` | `steps/Steps.tsx` | `blocks/steps.ts` | drift | Mintlify spec: no `Steps`-level props documented (only per-`Step`). Nebula adds `titleSize` on the `Steps` container that propagates to children. Schema `stepsPropsSchema` carries `titleSize` only. Forward-compatible with Mintlify (Mintlify-authored MDX won't pass `titleSize` on Steps — fine), but Nebula authoring with `titleSize` on `Steps` won't work in Mintlify. |
| `Step` | `step/Step.tsx` | `blocks/step.ts` | drift | Mintlify props: `title` (string), `icon` (string), `iconType` (string), `stepNumber` (number), `titleSize` (`"p"`/`"h2"`/`"h3"`, default `"p"`). Nebula props: `title` (ReactNode), `titleSize` (`"p"`/`"h2"`/`"h3"`/`"h4"`), `icon` (ReactNode), `stepNumber` (number), `isLast` (boolean, internal), `className`. Drift: Nebula adds `"h4"` to `titleSize` enum (Mintlify only allows `p`/`h2`/`h3`); Nebula is missing `iconType`; Nebula `icon` is ReactNode (Mintlify is icon-name string); Nebula adds `isLast` + `className`. Schema `stepPropsSchema`: requires `title` (Mintlify spec doesn't mark required), uses Nebula-only `iconLibrary`, includes `titleSize` with `h4`, omits `iconType` and `stepNumber`. |
| `Tabs` | `tabs/Tabs.tsx` | — | drift | Mintlify props: `sync` (boolean, default `true`), `borderBottom` (boolean). Nebula props: `defaultTabIndex` (number), `className`, `ariaLabel`. Drift: Nebula is missing `sync` (cross-Tabs/CodeGroup tab sync by matching titles — silent loss in Mintlify→Nebula round-trip), missing `borderBottom`; Nebula adds `defaultTabIndex` (Mintlify uses an internal mechanism — not in spec) and `ariaLabel`. No schema. |
| `Tab` | `tabs/Tabs.tsx` (`Tab`) | — | drift | Mintlify props: `title` (required), `icon` (string), `iconType` (string). Nebula props: `title` (string, required), `id` (string), `children`. Drift: Nebula is missing `icon` and `iconType`; Nebula adds `id`. (`Tab` is also a "marker" component in Nebula — only its props are read by `Tabs`.) |
| `CodeGroup` | `code-group/CodeGroup.tsx` | — | drift | Mintlify props: `dropdown` (boolean, no default specified). Per `components.md`, also implicitly title-syncs with `<Tabs>` having matching titles (via the `sync` mechanism). Nebula props: `dropdown`, `defaultIndex` (number), `className`. Drift: Nebula is missing the cross-component title sync feature; Nebula adds `defaultIndex` and `className`. Tab labels in Nebula derive from `filename ?? language` of each child `CodeBlock`. No schema. |
| `Expandable` | `expandable/Expandable.tsx` | — | drift | Mintlify props: `title` (string), `defaultOpen` (boolean, default `false`). Nebula props: `title` (string, default `"child attributes"`), `defaultOpen`, `openedText` (default `"Hide"`), `closedText` (default `"Show"`), `className`. Drift: Nebula adds `openedText`, `closedText`, `className` (not in spec); Nebula's default for `title` is `"child attributes"` instead of being unset/falsy. Functional behavior: Nebula renders the toggle as `Show/Hide {title}` (Mintlify renders the title alone with a chevron — different visual idiom). No schema. |
| `ParamField` | `property/Property.tsx` (`ParamField` alias of `Property`) | — | drift | Mintlify props: positional `path` first parameter (`query.name`, `path.name`, `body.name`, or `header.name`), `type` (string with optional `[]` array suffix), `required` (boolean), `deprecated` (boolean), `default` (any), `placeholder` (string). Nebula: `ParamField` shimmed onto `Property` accepting `path` or `name`, plus all `Property` props: `name`, `type`, `location`, `hidden`, `default`, `required`, `deprecated`, `pre`, `post`, `className`, `defaultLabel`, `requiredLabel`, `deprecatedLabel`. Drift: Nebula is missing `placeholder` (Mintlify uses for playground input placeholder); Nebula adds `name`, `location`, `hidden`, `pre`, `post`, `className`, `*Label` overrides; Nebula does not parse the `query.|path.|body.|header.` prefix on `path` (it's used verbatim as the name shown). No schema. |
| `ResponseField` | `property/Property.tsx` (`ResponseField` alias of `Property`) | — | drift | Mintlify props: `name` (required), `type` (required), `required` (boolean), `deprecated` (boolean), `default` (string). Nebula: same shim onto `Property`; accepts both `name` and `path`. Drift: same shape as `ParamField` audit above (Nebula adds `location`, `hidden`, `pre`, `post`, `*Label`); Nebula's `default` is `unknown` (Mintlify spec types it as `string`). No schema. |
| `RequestExample` | `example/Example.tsx` (`RequestExample`) | — | drift | Mintlify spec: no documented props — wraps a fenced code block. Nebula props: `title` (string), `className`. Drift: Nebula adds `title` (used as tab label) and `className`; renders a "Request example" ear chrome and a fake tab/close-button UI not in Mintlify. Multi-tab support absent (Nebula renders a single tab); Mintlify supports multiple language tabs. |
| `ResponseExample` | `example/Example.tsx` (`ResponseExample`) | — | drift | Same as `RequestExample`: Nebula adds `title`/`className`; multi-tab support absent. |
| `Frame` | `frame/Frame.tsx` | `blocks/frame.ts` | drift | Mintlify props: `caption` (string, supports Markdown), `hint` (string, displays above image). Nebula props: `caption`, `title` (alias kept for MDX compat), `description` (alias mapped to `caption`), `className`, `style`. Drift: Nebula is missing `hint` (Mintlify renders text above the image); Nebula adds `title` (renders as a heading above the frame, with a custom inline SVG), `description` (alias for `caption`), `className`, `style`. Schema `framePropsSchema` only carries `caption` (no `hint`, no `title`, no `description`). Caption Markdown rendering: Nebula renders caption as plain text inside `<p>` (no Markdown). |
| `Icon` | `icon/Icon.tsx` | `blocks/icon.ts` | drift | Mintlify props: `icon` (required), `iconType` (Font Awesome style string), `size` (number), `color` (string). Nebula props: `icon` (optional in code; required for non-children path), `iconLibrary` (`"lucide"`/`"material"`/`"material-symbols"`), `iconType` (Material/MS variant only — `"filled"`/`"outlined"`/`"rounded"`/`"sharp"`/`"two-tone"`), `size`, `color`, `className`, `children`. Drift: `iconType` semantics differ — Mintlify expects Font Awesome styles (`regular`/`solid`/`light`/etc.), Nebula expects Material variants. Nebula adds `iconLibrary`, `className`, `children` (inline SVG bypass). Mintlify is unaware of Nebula's CDN; Mintlify icons resolve from configured library (default `lucide`, switchable to `fontawesome`). Schema `iconPropsSchema` mirrors Nebula impl: requires `icon`, has `iconLibrary` enum (`material-symbol`/`material` — note: spelled differently from impl which uses `material-symbols`), missing `iconType`. |
| `Tooltip` | — | — | missing | Mintlify props: `tip` (required), `headline`, `cta`, `href` (required if `cta`). No Nebula component. |
| `Badge` | `badge/Badge.tsx` | — | drift | Mintlify props: `color` (default `"gray"`; allowed: `gray`, `blue`, `green`, `yellow`, `orange`, `red`, `purple`, `white`, `surface`), `size` (default `"md"`; `xs`/`sm`/`md`/`lg`), `shape` (default `"rounded"`; `rounded`/`pill`), `icon` (string), `stroke` (boolean), `disabled` (boolean). Nebula props: same `color` set plus `white-destructive` and `surface-destructive` (Nebula extras), `size`, `shape`, `variant` (`"solid"`/`"outline"` — Nebula concept not in Mintlify spec), `disabled`, `leadIcon` (ReactNode), `tailIcon` (ReactNode), `icon` (deprecated alias for `tailIcon`), `stroke` (deprecated alias for `variant="outline"`), `onClick`, `href`, `className`. Drift: Nebula adds `variant`, `leadIcon`, `tailIcon`, `onClick`, `href`, `className`; Mintlify spec says `icon` is a single icon — Nebula treats it as the tail icon by default. Mintlify spec does not mention link/button rendering when `href`/`onClick` is set. |
| `Tree` | `tree/Tree.tsx` | — | match | Mintlify: `<Tree>`, `<Tree.Folder>` (`name` required, `defaultOpen` boolean default `false`, `openable` boolean default `true`), `<Tree.File>` (`name` required). Nebula matches: same `Tree.Folder`/`Tree.File` props with same defaults. |
| Mermaid (fenced ` ```mermaid `) | `mermaid/Mermaid.tsx` | — | drift | Mintlify spec: a `mermaid` code-fence — not a JSX component. Nebula ships an MDX `<Mermaid>` JSX component with props `chart`, `children` (string), `className`, `ariaLabel`. Mintlify-authored MDX uses `\`\`\`mermaid` fences only; whether Nebula's MDX pipeline transforms `mermaid` fences into `<Mermaid>` tags is out of scope of this file-level audit. The JSX surface is a Nebula-only addition. |
| `Panel` | — | — | missing | Mintlify wraps right-sidebar content. No Nebula component. |
| `Prompt` | — | — | missing | Mintlify props: `description` (required, supports Markdown), `actions` (array, default `["copy"]`; `"copy"` or `"cursor"`), `icon` (string). No Nebula component (also absent from upstream `vendor/mintlify-components/`, so it's a Mintlify-app-only block). |
| `Color`, `Color.Item`, `Color.Row` | — | — | missing | Mintlify props: `Color`: `variant` (`"compact"`/`"table"`); `Color.Item`: `name` (required), `value` (string or `{light, dark}` object); `Color.Row`: `title`. No Nebula component. |
| `Tile` | — | — | missing | Mintlify props: `href` (required), `title`, `description`. No Nebula component. |
| `Update` | `update/Update.tsx` | — | drift | Mintlify props: `label` (required), `description`, `tags` (string array), `rss` (object with `title` + `description`). Nebula props: `label` (required), `description`, `tags` (`string \| string[]` — accepts comma-separated string), `className`. Drift: Nebula is missing `rss`; Nebula accepts `tags` as comma-separated string in addition to array (graceful extra); Nebula adds `className`. |
| `View` | — | — | missing | Mintlify props: `title` (required), `icon`. No Nebula component. |

## 2. Nebula extras

Components in `packages/components/src/` with no Mintlify-spec equivalent:

- `code-block/CodeBlock.tsx` — Nebula-only renderer used inside `<CodeGroup>` and as the bridge from MDX fenced code. Props: `code` (string), `language`, `filename`, `className`, `fixedTheme`. Mintlify treats fenced code blocks natively without a JSX component; Nebula exposes one. Functional, not a rename.
- `example/Example.tsx` — Internal shared component. The exposed `RequestExample` and `ResponseExample` map to Mintlify spec entries (covered in section 1). Not Nebula-only at the surface.
- `property/Property.tsx` — Internal primitive backing `ParamField` and `ResponseField`. Mintlify spec only documents the two aliases; Nebula additionally exports `Property` directly with its own prop set (`name`, `type`, `location`, `hidden`, `default`, `required`, `deprecated`, `pre`, `post`, `defaultLabel`, `requiredLabel`, `deprecatedLabel`). MDX authored against Mintlify never references `<Property>`, so Nebula authors using it would not round-trip. Treat as Nebula-only.
- `video/Video.tsx` (`Video`, `VideoLoop`) — Legacy MCOE component. Not in Mintlify spec. Props: `src`, `caption`, `loop`, `maxLoops`. `VideoLoop` is a deprecated alias.
- `Step` is exported standalone, but Mintlify spec only documents `<Steps><Step/></Steps>`. The standalone export is harmless — the prop drift is captured in section 1.

## 3. Configuration drift (`docs.json`)

Comparison of fields documented in `vendor/mint-docs-ref/.claude/skills/mintlify/reference/configuration.md` against the only typed `docs.json` shape found in Nebula: `products/nebula-platform/src/lib/docsConfig.ts` (the platform editor's runtime view). The CLI runtime at `packages/cli/src/runtime/lib/loadDocsConfig.mjs` does **no schema validation** — it reads and `JSON.parse`s the file with no shape enforcement. `packages/cli/src/cli/commands/validate.mjs` shape-checks only `name` (required) and `navigation.tabs` (required) — far narrower than the Mintlify spec.

| `docs.json` field | Mintlify | Nebula `docsConfig.ts` interface | Status |
|---|---|---|---|
| `$schema` | yes (URL) | not modeled | drift (passes through, not validated) |
| `theme` | required (enum: `mint`/`maple`/`palm`/`willow`/`linden`/`almond`/`aspen`/`sequoia`/`luma`) | not modeled | missing |
| `name` | required | not modeled in TS interface (validate.mjs requires it) | partial |
| `description` | not in `docs.json` (in frontmatter only) | n/a | n/a |
| `colors` | required (`primary` mandatory; `light`, `dark`) | not modeled | missing |
| `logo` | object with `light`/`dark`/`href` | not modeled | missing |
| `favicon` | string or `{light, dark}` | not modeled | missing |
| `icons.library` | `lucide` or `fontawesome` | not modeled | missing |
| `fonts` | object with `family`/`source`/`format`/`weight`/`heading`/`body` | not modeled | missing |
| `appearance` | `{default, strict}` | not modeled | missing |
| `background` | `{image, decoration, color}` | not modeled | missing |
| `styling` | `{eyebrows, latex, codeblocks}` | not modeled | missing |
| `navbar.links` | array of `{label, href, type?}` | not modeled at TS level (CLI tenant uses it) | missing in editor schema |
| `navbar.primary` | `{type, label, href}` | not modeled | missing |
| `footer.socials` | object keyed by network | not modeled | missing |
| `footer.links` | array of `{header, items}` | not modeled (CLI tenant uses `copyright` not in spec) | drift |
| `banner` | `{content, dismissible}` | not modeled | missing |
| `redirects` | array of `{source, destination, permanent}` | not modeled | missing |
| `metadata.timestamp` | boolean | not modeled | missing |
| `interaction.drilldown` | boolean | not modeled | missing |
| `seo.metatags` / `seo.indexing` | objects | not modeled | missing |
| `search.prompt` | string | not modeled | missing |
| `contextual.options` | array of strings | not modeled | missing |
| `thumbnails` | object | not modeled | missing |
| `errors.404` | object | not modeled | missing |
| `api.openapi` / `api.asyncapi` / `api.playground` / `api.examples` / `api.mdx` | nested objects | not modeled | missing |
| `integrations` | analytics provider keyed map | not modeled | missing |
| `versions` | nav-level (also: tenant uses top-level `versions` array — Mintlify documents under `navigation.versions`) | not modeled | drift (location) |
| `navigation` | required, contains the patterns matrix below | typed as `{tabs?: Tab[]}` only | drift (limited) |

Frontmatter-field drift (Mintlify documents 14 frontmatter fields). Nebula's editor maintains a frontmatter cache (`products/nebula-platform/src/lib/frontmatter.ts`) but no Zod or interface enumerates the allowed keys — the parser accepts arbitrary scalar key/value pairs. **No frontmatter schema exists** to compare against.

## 4. Navigation drift

Patterns documented in `navigation.md` vs Nebula support:

| Pattern | Mintlify | Nebula CLI runtime | Nebula platform editor (`docsConfig.ts`) |
|---|---|---|---|
| Flat `pages` (no groups/tabs) | yes | not handled in `loadDocsConfig.mjs`/`validate.mjs` walkers (they iterate `navigation.tabs[].groups[]` only) | not in `DocsConfig` interface — `tabs` only |
| `groups` (top-level, without tabs) | yes | not walked at top level (`validate.mjs` only walks `navigation.tabs[].groups`) | not on `DocsConfig` (only nested under `Tab`) |
| Group props: `group`, `pages`, `icon`, `tag`, `root`, `expanded` | yes | `loadDocsConfig.mjs` only reads `group`, `pages` for breadcrumb resolution | `Group` interface includes all six plus `hidden` |
| `tabs` (with `groups` or `pages`) | yes | walked | `Tab` interface includes `tab`, `icon`, `hidden`, `groups`, `pages` |
| `tabs[].href` external link | yes | not handled | not in `Tab` interface |
| `tabs[].menu` (sub-menus inside a tab) | yes | not handled | not in `Tab` interface |
| `anchors` | yes | not handled | not modeled |
| `global.anchors` | yes | not handled | not modeled |
| `dropdowns` | yes | not handled | not modeled |
| `products` | yes | not handled | not modeled |
| `versions` | yes | not handled in walker | not modeled (tenant `docs.json` has top-level `versions` array, but no parser path) |
| `languages` (with per-language `banner`) | yes | not handled | not modeled |
| OpenAPI in nav (`group.openapi` + `"GET /endpoint"` page strings) | yes | not handled (CLI has no OpenAPI integration) | not modeled |

`PageObject` extras Nebula exposes that Mintlify doesn't document at the page-entry level: `slug` (alias of `page`), `sidebarTitle`, `description`, `externalUrl`, `ogImage`, `tag`, `keywords`, `mode`. Several of these mirror frontmatter rather than nav fields.

## 5. API-docs surface

**No equivalent OpenAPI / AsyncAPI integration in Nebula.** The CLI's content collection (`packages/cli/src/content.config.ts`) loads only `**/*.mdx` files from the tenant `content/` directory; there is no OpenAPI loader, no auto-generated endpoint pages, no playground, no example-language config. `packages/cli/src/cli/commands/validate.mjs` does not look at `api`, `openapi`, or `asyncapi` keys in `docs.json`. The Mintlify `api` block, `examples` config, `playground` config, and `mdx.auth` config are all absent.

The MDX manual API page frontmatter fields `api` and `openapi` are not interpreted — they pass through as opaque frontmatter scalars (the editor's `frontmatter.ts` parser accepts any key/value pair). The Astro page route at `packages/cli/src/pages/[...slug].astro` reads only `title` and `description` from `entry.data`; everything else in frontmatter is discarded for layout purposes.

The closest Nebula has to API-doc rendering is the `<ParamField>` / `<ResponseField>` / `<RequestExample>` / `<ResponseExample>` MDX components (audited in section 1), all of which are manual MDX-authored — no OpenAPI source feeds them.

OpenAPI extensions (`x-hidden`, `x-excluded`, `x-codeSamples`) are unsupported. AsyncAPI channel references (`asyncapi: "/path channelName"` frontmatter) are unsupported.

## Summary counts

- Components in Mintlify spec: 31 (counting variants like `Note`, `Tip` and sub-components like `Tree.Folder`, `Color.Item`).
- Components implemented in Nebula with matching name: 22.
- Components missing entirely: 5 (`Tooltip`, `Panel`, `Prompt`, `Color` family, `Tile`, `View`).
- Components with prop drift: 16 of the 22 implemented.
- Components with no Zod schema in `packages/schemas/src/blocks/`: 14 of 22 (only `callout`, `frame`, `icon`, `step`, `steps`, `video`, plus the structural `heading` and `text`, are modeled).
- `docs.json` fields documented by Mintlify but not modeled in Nebula's `DocsConfig` TypeScript interface: 26 of ~28 top-level fields/groups (only `name` and `navigation.tabs` are validated by the CLI).
- Navigation patterns: 7 of 13 Mintlify pattern cells either absent from `DocsConfig` or unhandled by the CLI walker.
- OpenAPI / AsyncAPI / playground integration: 0% present.
