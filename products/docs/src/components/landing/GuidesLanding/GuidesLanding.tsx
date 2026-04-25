import React from "react";
import Link from "@docusaurus/Link";
import { styled } from "@site/src/lib/styled";
import { heroPatternBackground } from "../primitives";

/* ── Hero — centered variant (guides-specific shape) ── */

const HeroWrapper = styled("div", {
  ...heroPatternBackground,
  padding: "40px 48px 40px",
  textAlign: "center",
  "@media (max-width: 996px)": { padding: "40px 24px 32px" },
});

const HeroTitle = styled("h1", {
  fontSize: "clamp(26px, 3.5vw, 36px)",
  fontWeight: 700,
  color: "var(--mcoe-brand-display)",
  lineHeight: 1.2,
  marginBottom: "12px",
  letterSpacing: "-0.02em",
});

const HeroSubtitle = styled("p", {
  fontSize: "15px",
  color: "var(--mcoe-text-secondary)",
  margin: "0 auto 20px",
  maxWidth: "560px",
  lineHeight: 1.5,
});

const HeroBar = styled("div", {
  width: "48px",
  height: "4px",
  borderRadius: "2px",
  background: "var(--ifm-color-primary)",
  margin: "0 auto",
});

/* ── Body ── */

// Guides-specific: deepest bg variant; no Content wrapper (Grid sits directly in body).
const PageBody = styled("div", {
  background: "var(--mcoe-bg-deepest)",
  minHeight: "60vh",
  padding: "40px 24px 80px",
});

const Grid = styled("div", {
  maxWidth: "1060px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "24px",
  "@media (min-width: 640px)": { gridTemplateColumns: "repeat(2, 1fr)" },
  "@media (min-width: 960px)": { gridTemplateColumns: "repeat(3, 1fr)" },
});

/* ── Card ── */

const Card = styled(Link, {
  display: "flex",
  flexDirection: "column",
  borderRadius: "16px",
  border: "1px solid var(--mcoe-border-default)",
  overflow: "hidden",
  background: "var(--mcoe-bg-primary)",
  textDecoration: "none",
  color: "inherit",
  transition: "all 0.2s ease",
  "&:hover": {
    color: "inherit",
    textDecoration: "none",
    transform: "translateY(-2px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
  },
});

const CardImage = styled("div", {
  height: "100px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "13px",
  color: "var(--mcoe-text-secondary)",
  overflow: "hidden",
});

const CardBody = styled("div", {
  padding: "16px 20px 20px",
});

const Tag = styled("span", {
  display: "inline-block",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  padding: "3px 8px",
  borderRadius: "4px",
  marginBottom: "8px",
});

const CardTitle = styled("h3", {
  fontSize: "16px",
  fontWeight: 650,
  margin: "0 0 6px",
  lineHeight: 1.3,
});

const CardDesc = styled("p", {
  fontSize: "13px",
  color: "var(--ifm-color-emphasis-600)",
  lineHeight: 1.5,
  margin: 0,
});

/* ── Data ── */

interface Guide {
  title: string;
  desc: string;
  href: string;
  category: string;
  categoryColor: string;
  categoryText: string;
  bgColor: string;
  image?: string;
}

const guides: Guide[] = [
    {
    title: "Apple Developer Access",
    desc: "Security groups governing external team access to App Store Connect for UHC, Optum, UHG, Soultran, and UHG Enterprise.",
    href: "/resources/apple-developer-access",
    category: "Platform",
    categoryColor: "#D1FAE5",
    categoryText: "#065F46",
    bgColor: "#F0FDF4",
    image: "/images/wallpapers/mcoe-generic-wallpaper-20.png",
  },
  {
    title: "Google Developer Access",
    desc: "Security groups governing external team access to Google Play Console for UHC, Optum, UHG, and Soultran.",
    href: "/resources/google-developer-access",
    category: "Platform",
    categoryColor: "#D1FAE5",
    categoryText: "#065F46",
    bgColor: "#F0FDF4",
    image: "/images/wallpapers/mcoe-generic-wallpaper-19.png",
  },
  {
    title: "What is Release Management?",
    desc: "Learn what release management is, the 6-step process teams follow, best practices for measuring success, and how it applies to mobile app releases.",
    href: "#",
    category: "Development",
    categoryColor: "#D6E9FF",
    categoryText: "#1A5FB4",
    bgColor: "#EBF5FF",
    image: "/images/wallpapers/mcoe-generic-wallpaper-0.png",
  },
  {
    title: "What is CI/CD?",
    desc: "CI/CD combines continuous integration and continuous deployment, automating the process of integrating, testing and delivering code changes into production.",
    href: "#",
    category: "Development",
    categoryColor: "#D6E9FF",
    categoryText: "#1A5FB4",
    bgColor: "#F0F4FF",
    image: "/images/wallpapers/mcoe-generic-wallpaper-1.png",
  },
  {
    title: "What is Continuous Integration?",
    desc: "Continuous integration is a software development practice ensuring your codebase remains healthy by continuously validating updates.",
    href: "#",
    category: "Development",
    categoryColor: "#D6E9FF",
    categoryText: "#1A5FB4",
    bgColor: "#F5F0FF",
    image: "/images/wallpapers/mcoe-generic-wallpaper-4.png",
  },
  {
    title: "What is Continuous Delivery?",
    desc: "Continuous delivery is a practice focusing on automating the delivery of code updates to production both quickly and reliably.",
    href: "/developers/mobile-ci/about-mobile-ci",
    category: "Development",
    categoryColor: "#D6E9FF",
    categoryText: "#1A5FB4",
    bgColor: "#FFF8F0",
    image: "/images/wallpapers/mcoe-generic-wallpaper-3.png",
  },
  {
    title: "Understanding the Approvals Process",
    desc: "A walkthrough of the 6 approval types required before an app can be submitted for store review, including compliance and business sign-offs.",
    href: "/developers/release-management/versions/pipeline-stages/approvals",
    category: "Product",
    categoryColor: "#F3E8FF",
    categoryText: "#6B21A8",
    bgColor: "#FAF5FF",
    image: "/images/wallpapers/mcoe-generic-wallpaper-6.png",
  },
  {
    title: "Getting Started with Rollouts",
    desc: "Step-by-step guide to creating your first rollout, configuring your pipeline, and shipping your first release through Immerse.",
    href: "/developers/release-management/getting-started",
    category: "Product",
    categoryColor: "#F3E8FF",
    categoryText: "#6B21A8",
    bgColor: "#F0FFF4",
    image: "/images/wallpapers/mcoe-generic-wallpaper-7.png",
  },
  {
    title: "OSPO Compliance & License Scanning",
    desc: "How automated open-source license scanning works, understanding scan results, resolving violations, and downloading your SBOM.",
    href: "/developers/release-management/versions/pipeline-stages/ospo-compliance",
    category: "Development",
    categoryColor: "#D6E9FF",
    categoryText: "#1A5FB4",
    bgColor: "#F0FFF4",
    image: "/images/wallpapers/mcoe-generic-wallpaper-9.png",
  },
  {
    title: "Migrating from GitHub to Bitrise",
    desc: "Move your mobile CI workflows from GitHub Actions to Bitrise for native build environments, code signing, and release management integration.",
    href: "/developers/mobile-ci/migrate-github-to-bitrise",
    category: "Development",
    categoryColor: "#D6E9FF",
    categoryText: "#1A5FB4",
    bgColor: "#FFF8F0",
    image: "/images/wallpapers/mcoe-generic-wallpaper-8.png",
  },
  {
    title: "Phased Releases on the App Store",
    desc: "How to configure and manage phased releases to gradually roll out updates to your users over a 7-day period.",
    href: "/developers/release-management/versions/pipeline-stages/release",
    category: "Product",
    categoryColor: "#F3E8FF",
    categoryText: "#6B21A8",
    bgColor: "#EBF5FF",
    image: "/images/wallpapers/mcoe-generic-wallpaper-10.png",
  }

];

/* ── Component ── */

export function GuidesLanding() {
  return (
    <>
      <HeroWrapper>
        <HeroTitle>Guides</HeroTitle>
        <HeroSubtitle>
          Dive into software delivery topics such as CI/CD, DevOps, Agile, and the unique challenges
          posed by mobile development.
        </HeroSubtitle>
        <HeroBar />
      </HeroWrapper>
      <PageBody>
        <Grid data-analytics-surface="landing.guides">
          {guides.map((guide, i) => (
            <Card
              key={guide.title}
              to={guide.href}
              data-analytics-label={guide.title}
              data-analytics-position={i}
              data-analytics-category={guide.category}
              data-analytics-type="card"
            >
              <CardImage style={{ background: guide.bgColor }}>
                {guide.image ? (
                  <img
                    src={guide.image}
                    alt={guide.title}
                    style={{
                      height: "100%",
                      objectFit: "cover",
                      width: "100%",
                      objectPosition: "center 15%",
                    }}
                  />
                ) : (
                  `${guide.title} illustration`
                )}
              </CardImage>
              <CardBody>
                <Tag
                  style={{
                    background: guide.categoryColor,
                    color: guide.categoryText,
                  }}>
                  {guide.category}
                </Tag>
                <CardTitle>{guide.title}</CardTitle>
                <CardDesc>{guide.desc}</CardDesc>
              </CardBody>
            </Card>
          ))}
        </Grid>
      </PageBody>
    </>
  );
}
