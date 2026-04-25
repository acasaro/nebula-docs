import Link from "@docusaurus/Link";
import { styled } from "@site/src/lib/styled";
import {
  Content,
  HeroInner,
  HeroSubtitle,
  HeroTitle,
  HeroWrapper,
  PageBody,
  SectionSubtitle,
  SectionTitle,
} from "../primitives";

/* ── Pillar Cards — vertical strategy cards ── */

const PillarGrid = styled("div", {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "20px",
  marginBottom: "48px",
  "@media (min-width: 768px)": { gridTemplateColumns: "repeat(3, 1fr)" },
});

const PillarCard = styled("div", {
  borderRadius: "16px",
  border: "1px solid var(--mcoe-border-default)",
  background: "var(--mcoe-bg-primary)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
});

const PillarBar = styled("div", {
  height: "4px",
});

const PillarBody = styled("div", {
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  flex: 1,
});

const PillarIconBox = styled("div", {
  width: "44px",
  height: "44px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
});

const PillarIcon = styled("span", {
  display: "block",
  width: "22px",
  height: "22px",
  backgroundColor: "currentColor",
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
});

const PillarTitle = styled("h3", {
  fontSize: "16px",
  fontWeight: 650,
  margin: "0 0 8px",
});

const PillarDesc = styled("p", {
  fontSize: "13px",
  color: "var(--ifm-color-emphasis-600)",
  lineHeight: 1.6,
  margin: "0 0 16px",
  flex: 1,
});

const PillarLink = styled(Link, {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--mcoe-text-link)",
  textDecoration: "none",
  "&:hover": { textDecoration: "underline" },
});

/* ── Roadmap timeline ── */

const TimelineSection = styled("div", {
  marginBottom: "48px",
});

const Timeline = styled("div", {
  display: "flex",
  flexDirection: "column",
  gap: "0",
  position: "relative",
  paddingLeft: "24px",
  borderLeft: "2px solid var(--mcoe-border-default)",
});

const TimelineItem = styled("div", {
  position: "relative",
  paddingLeft: "24px",
  paddingBottom: "28px",
  "&:last-child": { paddingBottom: 0 },
});

const TimelineDot = styled("div", {
  position: "absolute",
  left: "-31px",
  top: "4px",
  width: "12px",
  height: "12px",
  borderRadius: "50%",
  border: "2px solid var(--mcoe-bg-secondary)",
});

const TimelineLabel = styled("span", {
  display: "inline-block",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  padding: "2px 8px",
  borderRadius: "4px",
  marginBottom: "6px",
});

const TimelineTitle = styled("h4", {
  fontSize: "15px",
  fontWeight: 600,
  margin: "0 0 4px",
});

const TimelineDesc = styled("p", {
  fontSize: "13px",
  color: "var(--ifm-color-emphasis-600)",
  lineHeight: 1.5,
  margin: 0,
});

/* ── Data ── */

const pillars = [
  {
    title: "CI/CD Standardization",
    desc: "Unified build and test pipelines across all mobile teams. One workflow, every platform, consistent results.",
    icon: "/images/icons/bitrise_ci.svg",
    color: "#D6E9FF",
    iconColor: "#1A5FB4",
    barColor: "#1A5FB4",
    href: "/developers/mobile-ci/about-mobile-ci",
  },
  {
    title: "Release Management",
    desc: "Staged rollouts with governance, approvals, and automated promotion from RC to production.",
    icon: "/images/icons/bitrise_release_management.svg",
    color: "#D4F5DC",
    iconColor: "#1A7A36",
    barColor: "#1A7A36",
    href: "/developers/release-management/getting-started",
  },
  {
    title: "Platform Enablement",
    desc: "Centralized access, onboarding, and tooling so every team ships on the same foundation.",
    icon: "/images/icons/bitrise_logo.svg",
    color: "#E8DEFF",
    iconColor: "#6B3FA0",
    barColor: "#6B3FA0",
    href: "/developers/bitrise-platform",
  },
];

const roadmap = [
  {
    phase: "Delivered",
    phaseColor: "#D4F5DC",
    phaseText: "#1A7A36",
    dotColor: "#1A7A36",
    title: "Bitrise CI/CD Migration",
    desc: "All mobile teams migrated from GitHub Actions to standardized Bitrise workflows.",
  },
  {
    phase: "Delivered",
    phaseColor: "#D4F5DC",
    phaseText: "#1A7A36",
    dotColor: "#1A7A36",
    title: "Release Management Rollout",
    desc: "Staged version pipeline with approval gates live across iOS and Android.",
  },
  {
    phase: "In Progress",
    phaseColor: "#D6E9FF",
    phaseText: "#1A5FB4",
    dotColor: "#1A5FB4",
    title: "Enterprise Pipeline Templates",
    desc: "Reusable pipeline configurations for rapid onboarding of new mobile products.",
  },
  {
    phase: "Planned",
    phaseColor: "#F4F4F5",
    phaseText: "#6D6F70",
    dotColor: "#CBCCCD",
    title: "Analytics & Release Insights",
    desc: "Dashboards for build health, release velocity, and rollout success metrics.",
  },
];

/* ── Component ── */

export function ProductLanding() {
  return (
    <>
      <HeroWrapper>
        <HeroInner>
          <HeroTitle>Product</HeroTitle>
          <HeroSubtitle>
            Strategy, roadmap, and initiative overviews driving the MCOE
            platform forward.
          </HeroSubtitle>
        </HeroInner>
      </HeroWrapper>
      <PageBody>
        <Content>
          <SectionTitle>Strategic Pillars</SectionTitle>
          <SectionSubtitle>
            The three areas of investment that define the MCOE platform.
          </SectionSubtitle>
          <PillarGrid data-analytics-surface="landing.product.pillars">
            {pillars.map((p, i) => (
              <PillarCard
                key={p.title}
                data-analytics-label={p.title}
                data-analytics-position={i}
              >
                <PillarBar style={{ background: p.barColor }} />
                <PillarBody>
                  <PillarIconBox
                    style={{ background: p.color, color: p.iconColor }}
                  >
                    <PillarIcon
                      style={{
                        maskImage: `url(${p.icon})`,
                        WebkitMaskImage: `url(${p.icon})`,
                      }}
                    />
                  </PillarIconBox>
                  <PillarTitle>{p.title}</PillarTitle>
                  <PillarDesc>{p.desc}</PillarDesc>
                  <PillarLink to={p.href}>Learn more →</PillarLink>
                </PillarBody>
              </PillarCard>
            ))}
          </PillarGrid>

          <TimelineSection>
            <SectionTitle>Roadmap</SectionTitle>
            <SectionSubtitle>
              Where we've been and where we're headed.
            </SectionSubtitle>
            <Timeline>
              {roadmap.map((item) => (
                <TimelineItem key={item.title}>
                  <TimelineDot style={{ background: item.dotColor }} />
                  <TimelineLabel
                    style={{
                      background: item.phaseColor,
                      color: item.phaseText,
                    }}
                  >
                    {item.phase}
                  </TimelineLabel>
                  <TimelineTitle>{item.title}</TimelineTitle>
                  <TimelineDesc>{item.desc}</TimelineDesc>
                </TimelineItem>
              ))}
            </Timeline>
          </TimelineSection>
        </Content>
      </PageBody>
    </>
  );
}
