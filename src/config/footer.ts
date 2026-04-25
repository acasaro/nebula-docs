import type * as Preset from "@docusaurus/preset-classic";

export const footer = {
  style: "dark",
  links: [
    {
      title: "Documentation",
      items: [
        { label: "Developers", to: "/developers/" },
        {
          label: "Rollouts",
          to: "/developers/release-management/getting-started",
        },
        {
          label: "Mobile CI",
          to: "/developers/mobile-ci/about-mobile-ci",
        },
      ],
    },
    {
      title: "Resources",
      items: [
        { label: "Guides", to: "/resources/guides" },
        { label: "Glossary", to: "/resources/glossary" },
        { label: "Announcements", to: "/announcements" },
      ],
    },
    {
      title: "External",
      items: [
        { label: "Bitrise", href: "https://bitrise.io" },
        { label: "Immerse Platform", href: "https://immerse.uhg.com/overview" },
      ],
    },
  ],
  copyright: `© ${new Date().getFullYear()} UnitedHealth Group`,
} satisfies Preset.ThemeConfig["footer"];
