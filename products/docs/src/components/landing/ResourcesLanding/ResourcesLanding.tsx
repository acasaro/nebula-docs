import React from "react";
import Link from "@docusaurus/Link";
import { styled } from "@site/src/lib/styled";
import { GuideThumbnail } from "@site/src/components/illustrations/GuideThumbnail";
import { GlossaryThumbnail } from "@site/src/components/illustrations/GlossaryThumbnail";
import {
  HeroInner,
  HeroSubtitle,
  HeroTitle,
  HeroWrapper,
  PageBody,
} from "../primitives";

/* ── Page Body ── */

// Resources uses a flush-left content lane — no horizontal padding.
const Content = styled("div", {
  maxWidth: "960px",
  margin: "0 auto",
  padding: "40px 0px 80px",
});

/* ── Featured Row — full-width highlight cards ── */

const FeaturedGrid = styled("div", {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "20px",
  marginBottom: "40px",
  "@media (min-width: 768px)": { gridTemplateColumns: "repeat(2, 1fr)" },
});

const FeaturedCard = styled(Link, {
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

const FeaturedImage = styled("div", {
  height: "140px",
  overflow: "hidden",
  borderRadius: "16px 16px 0 0",
  lineHeight: 0,
  "& svg": { display: "block", width: "100%", marginTop: "-15%" },
});

const FeaturedBody = styled("div", {
  padding: "20px 24px 24px",
});

const FeaturedTag = styled("span", {
  display: "inline-block",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  padding: "3px 8px",
  borderRadius: "4px",
  marginBottom: "8px",
});

const FeaturedTitle = styled("h3", {
  fontSize: "17px",
  fontWeight: 650,
  margin: "0 0 6px",
});

const FeaturedDesc = styled("p", {
  fontSize: "13px",
  color: "var(--ifm-color-emphasis-600)",
  lineHeight: 1.5,
  margin: 0,
});

/* ── Quick-access list section ── */

// Local SectionTitle — Resources uses 16px bottom gap (shared primitive is 4px).
const SectionTitle = styled("h2", {
  fontSize: "20px",
  fontWeight: 700,
  marginBottom: "16px",
  marginTop: 0,
});

const ListGrid = styled("div", {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "12px",
  marginBottom: "40px",
  "@media (min-width: 768px)": { gridTemplateColumns: "repeat(3, 1fr)" },
});

const ListCard = styled(Link, {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "16px 20px",
  borderRadius: "12px",
  border: "1px solid var(--mcoe-border-default)",
  background: "var(--mcoe-bg-primary)",
  textDecoration: "none",
  color: "inherit",
  transition: "all 0.15s ease",
  "&:hover": {
    color: "inherit",
    textDecoration: "none",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
  },
});

const ListIconBox = styled("div", {
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

const ListIcon = styled("span", {
  display: "block",
  width: 35,
  height: 35,
  backgroundColor: "currentColor",
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
});

const ListText = styled("div", {
  flex: 1,
});

const ListTitle = styled("span", {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  marginBottom: "2px",
});

const ListDesc = styled("span", {
  display: "block",
  fontSize: "12px",
  color: "var(--ifm-color-emphasis-600)",
});

/* ── Data ── */

const featured = [
  {
    title: "Guides",
    desc: "Step-by-step walkthroughs for rollouts, CI/CD pipelines, and measuring release success.",
    href: "/resources/guides",
    tag: "Guide",
    tagColor: "#D6E9FF",
    tagText: "#1A5FB4",
    thumbnail: GuideThumbnail,
  },
  {
    title: "Glossary",
    desc: "Definitions and context for key terms used across MCOE, Bitrise, and the release pipeline.",
    href: "/resources/glossary",
    tag: "Reference",
    tagColor: "#D4F5DC",
    tagText: "#1A7A36",
    thumbnail: GlossaryThumbnail,
  },
];

const quickAccess = [
  {
    title: "Announcements",
    desc: "Latest updates and news",
    href: "/announcements",
    icon: "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/campaign/default/48px.svg",
    color: "#FFE4CC",
    iconColor: "#C45A1A",
  },
  {
    title: "Library",
    desc: "Curated references and materials",
    href: "/resources/library",
    icon: "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/auto_stories/default/48px.svg",
    color: "#E8DEFF",
    iconColor: "#6B3FA0",
  },
  {
    title: "CI/CD Overview",
    desc: "Integration and deployment concepts",
    href: "/resources/guides",
    icon: "/images/icons/bitrise_ci.svg",
    color: "#D6E9FF",
    iconColor: "#1A5FB4",
  },
];

/* ── Component ── */

export function ResourcesLanding() {
  return (
    <>
      <HeroWrapper>
        <HeroInner>
          <HeroTitle>Resources</HeroTitle>
          <HeroSubtitle>
            Guides, glossary, announcements, and reference materials to support your mobile
            engineering workflow.
          </HeroSubtitle>
        </HeroInner>
      </HeroWrapper>
      <PageBody>
        <Content>
          <FeaturedGrid data-analytics-surface="landing.resources.featured">
            {featured.map((item, i) => {
              const Thumbnail = item.thumbnail;
              return (
              <FeaturedCard
                key={item.title}
                to={item.href}
                data-analytics-label={item.title}
                data-analytics-position={i}
                data-analytics-type="card"
              >
                <FeaturedImage>
                  <Thumbnail />
                </FeaturedImage>
                <FeaturedBody>
                  <FeaturedTag style={{ background: item.tagColor, color: item.tagText }}>
                    {item.tag}
                  </FeaturedTag>
                  <FeaturedTitle>{item.title}</FeaturedTitle>
                  <FeaturedDesc>{item.desc}</FeaturedDesc>
                </FeaturedBody>
              </FeaturedCard>
              );
            })}
          </FeaturedGrid>

          <SectionTitle>Quick Access</SectionTitle>
          <ListGrid data-analytics-surface="landing.resources.quick_access">
            {quickAccess.map((item, i) => (
              <ListCard
                key={item.title}
                to={item.href}
                data-analytics-label={item.title}
                data-analytics-position={i}
                data-analytics-type="card"
              >
                <ListIconBox style={{ background: item.color, color: item.iconColor }}>
                  <ListIcon
                    style={{
                      maskImage: `url(${item.icon})`,
                      WebkitMaskImage: `url(${item.icon})`,
                    }}
                  />
                </ListIconBox>
                <ListText>
                  <ListTitle>{item.title}</ListTitle>
                  <ListDesc>{item.desc}</ListDesc>
                </ListText>
              </ListCard>
            ))}
          </ListGrid>
        </Content>
      </PageBody>
    </>
  );
}
