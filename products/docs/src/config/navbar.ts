import type * as Preset from "@docusaurus/preset-classic";

export const navbar = {
  title: "",
  logo: {
    alt: "MCoE Logo",
    src: "images/logo-light.svg",
    srcDark: "images/logo-dark.svg",
  },
  items: [
    // Left nav — mirrors Mintlify tabs
    {
      to: "/developers",
      position: "left",
      label: "Developers",
      activeBaseRegex: "/developers(/|$)",
    },
    {
      to: "/resources",
      position: "left",
      label: "Resources",
      activeBaseRegex: "/resources(/|$)",
    },
    {
      to: "/product",
      position: "left",
      label: "Product",
      activeBaseRegex: "/product(/|$)",
    },
    {
      to: "/about",
      position: "left",
      label: "About",
      activeBaseRegex: "/about(/|$)",
    },
    // Right nav — handled in swizzled Navbar/Content component
  ],
} satisfies Preset.ThemeConfig["navbar"];
