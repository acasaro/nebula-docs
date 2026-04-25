import type { PluginConfig } from "@docusaurus/types";

/**
 * Additional `@docusaurus/plugin-content-docs` instances beyond the default
 * (`developers`) instance, which is configured in the preset. Each instance
 * has its own folder under `docs/`, its own sidebar in `sidebars/`, and its
 * own route base.
 */
export const docInstances: PluginConfig[] = [
  [
    "@docusaurus/plugin-content-docs",
    {
      id: "resources",
      path: "docs/resources",
      routeBasePath: "resources",
      sidebarPath: "./sidebars/resources.ts",
      breadcrumbs: true,
    },
  ],
  [
    "@docusaurus/plugin-content-docs",
    {
      id: "product",
      path: "docs/product",
      routeBasePath: "product",
      sidebarPath: "./sidebars/product.ts",
      breadcrumbs: true,
    },
  ],
  [
    "@docusaurus/plugin-content-docs",
    {
      id: "about",
      path: "docs/about",
      routeBasePath: "about",
      sidebarPath: "./sidebars/about.ts",
      breadcrumbs: true,
    },
  ],
];
