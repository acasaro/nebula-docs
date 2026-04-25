import type * as Preset from "@docusaurus/preset-classic";
import mcoeCodeTheme from "../lib/prismTheme";
import { footer } from "./footer";
import { navbar } from "./navbar";

export const themeConfig = {
  colorMode: {
    defaultMode: "light",
    respectPrefersColorScheme: false,
  },
  navbar,
  footer,
  prism: {
    theme: mcoeCodeTheme,
    darkTheme: mcoeCodeTheme,
  },
} satisfies Preset.ThemeConfig;
