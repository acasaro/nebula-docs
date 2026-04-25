import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  developersSidebar: [
    {
      type: "html",
      value: `<div class="sidebar-quick-links">
  <a href="https://app.bitrise.io/users/sign_in" target="_blank" rel="noopener noreferrer" class="sidebar-quick-link">
    <img src="/images/icons/bitrise_logo.svg" alt="" />
    <span>Bitrise</span>
  </a>
  <a href="https://immerse.uhg.com/overview" target="_blank" rel="noopener noreferrer" class="sidebar-quick-link">
    <img src="/images/icons/immerse_logo.svg" alt="" />
    <span>Immerse</span>
  </a>
</div>`,
      defaultStyle: false,
    },
    {
      type: "category",
      label: "Mobile CI",
      items: [
        "mobile-ci/about-mobile-ci",
        "mobile-ci/migrate-github-to-bitrise",
        {
          type: "category",
          label: "Mobile Workflows",
          items: [
            "mobile-ci/mobile-workflows/index",
            "mobile-ci/mobile-workflows/react-native-ci",
          ],
        },
      ],
    },

    {
      type: "category",
      label: "Release Management",
      items: [
        "release-management/getting-started",
        "release-management/pipeline-overview",
        {
          type: "category",
          label: "Manage Rollout",
          items: [
            "release-management/manage-rollout/create-rollout",
            "release-management/manage-rollout/settings",
            "release-management/manage-rollout/setup-checklist",
          ],
        },
        {
          type: "category",
          label: "Versions",
          items: [
            "release-management/versions/about-versions",
            "release-management/versions/create-version",
            "release-management/versions/manage-versions",
            {
              type: "category",
              label: "Pipeline Stages",
              items: [
                "release-management/versions/pipeline-stages/release-candidate",
                "release-management/versions/pipeline-stages/testing",
                "release-management/versions/pipeline-stages/google-play-testing",
                "release-management/versions/pipeline-stages/approvals",
                "release-management/versions/pipeline-stages/ospo-compliance",
                "release-management/versions/pipeline-stages/app-store-review",
                "release-management/versions/pipeline-stages/google-review",
                "release-management/versions/pipeline-stages/release",
                "release-management/versions/pipeline-stages/google-release",
              ],
            },
          ],
        },
        "release-management/troubleshooting",
      ],
    },

    {
      type: "category",
      label: "Bitrise Platform",
      items: [
        "bitrise-platform/index",
        "bitrise-platform/bitrise-access",
      ],
    },

    {
      type: "category",
      label: "Contributing",
      items: [
        "contributing/rollouts",
        "contributing/immerse",
        "contributing/enterprise-pipelines",
      ],
    },
  ],
};

export default sidebars;
