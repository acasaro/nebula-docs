import Link from "@docusaurus/Link";
import { styled } from "@site/src/lib/styled";
import { Content, PageBody, heroPatternBackground } from "../primitives";

/* ── Hero — split layout (developer-specific; not shared) ── */

const HeroOuter = styled("div", {
  position: "relative",
});

/* Top row: gradient background */
const HeroTop = styled("div", {
  ...heroPatternBackground,
  padding: "64px 48px 48px",
  "@media (max-width: 996px)": { padding: "40px 24px 32px" },
});

/* Bottom row: white background */
const HeroBottom = styled("div", {
  background: "var(--mcoe-bg-primary)",
  padding: "40px 48px 48px",
  "@media (max-width: 996px)": { padding: "32px 24px 32px" },
});

const HeroInner = styled("div", {
  maxWidth: "960px",
  margin: "0 auto",
  position: "relative",
  zIndex: 1,
});

const HeroTitle = styled("h1", {
  fontSize: "clamp(28px, 4vw, 40px)",
  fontWeight: 700,
  color: "var(--mcoe-brand-display)",
  lineHeight: 1.15,
  marginBottom: "8px",
  letterSpacing: "-0.02em",
  maxWidth: "480px",
});

const HeroSubtitle = styled("p", {
  fontSize: "15px",
  color: "var(--mcoe-text-secondary)",
  margin: 0,
  maxWidth: "480px",
});

const HeroLeadTitle = styled("h2", {
  fontSize: "20px",
  fontWeight: 700,
  color: "var(--mcoe-text-primary)",
  marginBottom: "12px",
  marginTop: 0,
  maxWidth: "480px",
});

const HeroLeadDesc = styled("p", {
  fontSize: "14px",
  color: "var(--mcoe-text-secondary)",
  lineHeight: 1.7,
  margin: 0,
  maxWidth: "480px",
});

/* Constrains the image to the same 960px content width */
const HeroImageAnchor = styled("div", {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: "50%",
  transform: "translateX(-50%)",
  width: "100%",
  maxWidth: "960px",
  pointerEvents: "none",
  zIndex: 2,
  "@media (max-width: 996px)": { display: "none" },
});

/* Image spans both rows — positioned within the content-width anchor */
const HeroImage = styled("img", {
  position: "absolute",
  right: 0,
  top: "50%",
  transform: "translateY(-50%)",
  width: "400px",
  height: "auto",
  objectFit: "contain",
  pointerEvents: "auto",
  border: "none",
  borderRadius: 0,
  background: "none",
  margin: 0,
});

/* ── Cards Grid ── */

const CardsGrid = styled("div", {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "24px",
  "@media (min-width: 768px)": { gridTemplateColumns: "repeat(2, 1fr)" },
});

const Card = styled("div", {
  borderRadius: "16px",
  border: "1px solid var(--mcoe-border-default)",
  padding: "28px",
  background: "var(--mcoe-bg-primary)",
  display: "flex",
  flexDirection: "column",
});

const CardHeader = styled("div", {
  display: "flex",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "16px",
});

const CardIconBox = styled("div", {
  width: "48px",
  height: "48px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

const CardIconImg = styled("span", {
  display: "block",
  width: "24px",
  height: "24px",
  backgroundColor: "currentColor",
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
});

const CardTitleGroup = styled("div", {
  flex: 1,
});

const CardTitle = styled("h3", {
  fontSize: "17px",
  fontWeight: 650,
  margin: "0 0 4px",
});

const CardDesc = styled("p", {
  fontSize: "13px",
  color: "var(--ifm-color-emphasis-600)",
  lineHeight: 1.5,
  margin: 0,
});

const CardLinks = styled("ul", {
  listStyle: "none",
  padding: 0,
  margin: "0 0 16px",
  flex: 1,
});

const CardLinkItem = styled("li", {
  borderBottom: "1px solid var(--mcoe-border-default)",
  "&:last-child": { borderBottom: "none" },
});

const CardLink = styled(Link, {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 0",
  fontSize: "14px",
  color: "var(--mcoe-text-link)",
  textDecoration: "none",
  "&:hover": {
    color: "var(--mcoe-brand-primary-dark)",
    textDecoration: "underline",
  },
});

const CardLinkArrow = styled("span", {
  fontSize: "12px",
  color: "var(--ifm-color-emphasis-400)",
});

const ViewAll = styled(Link, {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--mcoe-text-link)",
  textDecoration: "none",
  "&:hover": { textDecoration: "underline" },
});

/* ── Data ── */

const categories = [
  {
    icon: "/images/icons/bitrise_ci.svg",
    color: "#D6E9FF",
    iconColor: "#1A5FB4",
    title: "Mobile CI",
    desc: "CI/CD pipelines, workflows, and migration guides for MCOE mobile apps.",
    links: [
      { label: "About Mobile CI", href: "/developers/mobile-ci/about-mobile-ci" },
      { label: "Migrating to Bitrise", href: "/developers/mobile-ci/migrate-github-to-bitrise" },
      { label: "Mobile workflows", href: "/developers/mobile-ci/mobile-workflows" },
    ],
    viewAll: "/developers/mobile-ci/about-mobile-ci",
  },
  {
    icon: "/images/icons/bitrise_release_management.svg",
    color: "#D4F5DC",
    iconColor: "#1A7A36",
    title: "Release Management",
    desc: "Rollouts, version tracking, and staged release processes across platforms.",
    links: [
      { label: "Getting Started", href: "/developers/release-management/getting-started" },
      { label: "Key concepts", href: "/developers/release-management/pipeline-overview" },
      {
        label: "Adding a new rollout",
        href: "/developers/release-management/manage-rollout/create-rollout",
      },
    ],
    viewAll: "/developers/release-management/getting-started",
  },
  {
    icon: "/images/icons/bitrise_logo.svg",
    color: "#E8DEFF",
    iconColor: "#6B3FA0",
    title: "Bitrise Access",
    desc: "Getting set up on the Bitrise platform, permissions, and environment configuration.",
    links: [
      { label: "Platform overview", href: "/developers/bitrise-platform" },
      { label: "Access & permissions", href: "/developers/bitrise-platform/bitrise-access" },
    ],
    viewAll: "/developers/bitrise-platform",
  },
  {
    icon: "/images/icons/bitrise_approvals.svg",
    color: "#FFE4CC",
    iconColor: "#C45A1A",
    title: "Version Stages",
    desc: "How versions move through the MCOE release pipeline — from RC to production.",
    links: [
      {
        label: "Release candidate",
        href: "/developers/release-management/versions/pipeline-stages/release-candidate",
      },
      {
        label: "MCOE Approvals",
        href: "/developers/release-management/versions/pipeline-stages/approvals",
      },
      {
        label: "Submit to App Store",
        href: "/developers/release-management/versions/pipeline-stages/app-store-review",
      },
      {
        label: "Release to Google Play",
        href: "/developers/release-management/versions/pipeline-stages/release",
      },
    ],
    viewAll: "/developers/release-management/versions/about-versions",
  },
];

/* ── Component ── */

export function DeveloperLanding() {
  return (
    <>
      <HeroOuter>
        <HeroImageAnchor>
          <HeroImage
            src='/images/illustrations/shuttle.png'
            alt='Developer documentation illustration'
          />
        </HeroImageAnchor>
        <HeroTop>
          <HeroInner>
            <HeroTitle>Developer Documentation</HeroTitle>
            <HeroSubtitle>CI/CD, releases, and mobile engineering</HeroSubtitle>
          </HeroInner>
        </HeroTop>
        <HeroBottom>
          <HeroInner>
            <HeroLeadTitle>Build, test, and ship mobile apps with confidence.</HeroLeadTitle>
            <HeroLeadDesc>
              Standardized CI/CD, a staged release pipeline, and tooling to take every MCOE app from
              first build to production.
            </HeroLeadDesc>
          </HeroInner>
        </HeroBottom>
      </HeroOuter>
      <PageBody>
        <Content>
          <CardsGrid data-analytics-surface='landing.developers'>
            {categories.map((cat, i) => (
              <Card key={cat.title} data-analytics-category={cat.title} data-analytics-position={i}>
                <CardHeader>
                  <CardIconBox style={{ background: cat.color, color: cat.iconColor }}>
                    <CardIconImg
                      style={{ maskImage: `url(${cat.icon})`, WebkitMaskImage: `url(${cat.icon})` }}
                    />
                  </CardIconBox>
                  <CardTitleGroup>
                    <CardTitle>{cat.title}</CardTitle>
                    <CardDesc>{cat.desc}</CardDesc>
                  </CardTitleGroup>
                </CardHeader>
                <CardLinks>
                  {cat.links.map((link) => (
                    <CardLinkItem key={link.href}>
                      <CardLink to={link.href}>
                        {link.label}
                        <CardLinkArrow>›</CardLinkArrow>
                      </CardLink>
                    </CardLinkItem>
                  ))}
                </CardLinks>
                <ViewAll to={cat.viewAll}>View all →</ViewAll>
              </Card>
            ))}
          </CardsGrid>
        </Content>
      </PageBody>
    </>
  );
}
