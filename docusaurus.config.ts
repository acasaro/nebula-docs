import * as dotenv from "dotenv";
import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { docInstances } from "./src/config/doc-instances";
import { themeConfig } from "./src/config/theme";

dotenv.config();

const config: Config = {
  title: "MCoE",
  tagline: "Mobile Center of Excellence",
  favicon: "images/favicon.ico",

  future: {
    v4: true,
  },

  url: "https://mcoe.example.com",
  baseUrl: "/",

  onBrokenLinks: "warn",
  onBrokenAnchors: "warn",

  markdown: {
    mermaid: true,
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        // Default docs instance: Developers
        docs: {
          id: "developers",
          path: "docs/developers",
          routeBasePath: "developers",
          sidebarPath: "./sidebars/developers.ts",
          breadcrumbs: true,
          showLastUpdateTime: true,
        },
        blog: {
          path: "docs/announcements",
          routeBasePath: "announcements",
          showReadingTime: true,
          blogTitle: "Announcements",
          blogDescription: "Latest updates and announcements from the MCOE team.",
          blogSidebarTitle: "Recent Posts",
          blogSidebarCount: "ALL",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  customFields: {
    firebaseConfig: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGE_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    },
    environment: process.env.NODE_ENV === "development" ? "development" : "production",
  },

  clientModules: ["./src/plugins/firebase-analytics.ts"],

  plugins: docInstances,

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        docsPluginIdForPreferredVersion: "developers",
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: ["/developers", "/resources", "/product", "/about"],
      },
    ],
  ],

  themeConfig,
};

export default config;
