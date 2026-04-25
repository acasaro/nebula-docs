import Link from "@docusaurus/Link";
import { styled } from "@site/src/lib/styled";
import { AppsHeroComponent } from "../../ui/AppsHeroComponent";
import {
  Content,
  PageBody,
  SectionSubtitle,
  SectionTitle,
} from "../primitives";

/* ── Mission Banner ── */

const MissionBanner = styled("div", {
  borderRadius: "16px",
  background: "var(--mcoe-bg-primary)",
  border: "1px solid var(--mcoe-border-default)",
  padding: "40px 36px",
  marginBottom: "40px",
  textAlign: "center",
});

const MissionLabel = styled("span", {
  display: "inline-block",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  padding: "3px 10px",
  borderRadius: "4px",
  background: "var(--mcoe-info-light)",
  color: "var(--mcoe-info)",
  marginBottom: "16px",
});

const MissionText = styled("p", {
  fontSize: "18px",
  fontWeight: 500,
  lineHeight: 1.6,
  color: "var(--mcoe-text-primary)",
  margin: 0,
  maxWidth: "640px",
  marginLeft: "auto",
  marginRight: "auto",
});

/* ── What We Do — value props ── */

const ValueGrid = styled("div", {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "16px",
  marginBottom: "48px",
  "@media (min-width: 768px)": { gridTemplateColumns: "repeat(2, 1fr)" },
});

const ValueCard = styled("div", {
  borderRadius: "12px",
  border: "1px solid var(--mcoe-border-default)",
  background: "var(--mcoe-bg-primary)",
  padding: "24px",
  display: "flex",
  gap: "16px",
  alignItems: "flex-start",
});

const ValueIconBox = styled("div", {
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

const ValueIcon = styled("span", {
  display: "block",
  width: "20px",
  height: "20px",
  backgroundColor: "currentColor",
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
});

const ValueTitle = styled("h3", {
  fontSize: "15px",
  fontWeight: 650,
  margin: "0 0 4px",
});

const ValueDesc = styled("p", {
  fontSize: "13px",
  color: "var(--ifm-color-emphasis-600)",
  lineHeight: 1.5,
  margin: 0,
});

/* ── Team Section ── */

const TeamGrid = styled("div", {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "20px",
  marginBottom: "48px",
  justifyItems: "center",
  "@media (max-width: 768px)": {
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
  },
});

const TeamMember = styled("div", {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "10px",
});

const TeamPhoto = styled("img", {
  width: "96px",
  height: "96px",
  borderRadius: "50%",
  objectFit: "cover",
  border: "3px solid var(--mcoe-bg-secondary)",
  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.1)",
  background: "var(--mcoe-bg-primary)",
  margin: 0,
});

const TeamLogoCircle = styled("div", {
  width: "96px",
  height: "96px",
  borderRadius: "50%",
  background: "var(--mcoe-brand-primary)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "3px solid var(--mcoe-bg-secondary)",
  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.1)",
});

const TeamLogoImg = styled("img", {
  width: "48px",
  height: "48px",
  objectFit: "contain",
  border: "none",
  borderRadius: 0,
  background: "none",
  margin: 0,
  filter: "brightness(0) invert(1)",
});

const TeamName = styled("span", {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--mcoe-text-primary)",
  textAlign: "center",
});

const TeamRole = styled("span", {
  fontSize: "11px",
  color: "var(--mcoe-text-secondary)",
  textAlign: "center",
  marginTop: "-6px",
});

/* ── Get Involved ── */

const CtaGrid = styled("div", {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "16px",
  "@media (min-width: 768px)": { gridTemplateColumns: "repeat(3, 1fr)" },
});

const CtaCard = styled(Link, {
  display: "block",
  borderRadius: "12px",
  border: "1px solid var(--mcoe-border-default)",
  background: "var(--mcoe-bg-primary)",
  padding: "24px",
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

const CtaTitle = styled("h3", {
  fontSize: "15px",
  fontWeight: 650,
  margin: "0 0 6px",
});

const CtaDesc = styled("p", {
  fontSize: "13px",
  color: "var(--ifm-color-emphasis-600)",
  lineHeight: 1.5,
  margin: "0 0 12px",
});

const CtaLink = styled("span", {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--mcoe-text-link)",
});

/* ── Data ── */

const values = [
  {
    title: "Standardized CI/CD",
    desc: "Every mobile team builds and tests on the same platform with shared, governed workflows.",
    icon: "/images/icons/bitrise_ci.svg",
    color: "#D6E9FF",
    iconColor: "#1A5FB4",
  },
  {
    title: "Governed Releases",
    desc: "Staged rollouts with approval gates ensure quality at every step from RC to production.",
    icon: "/images/icons/bitrise_release_management.svg",
    color: "#D4F5DC",
    iconColor: "#1A7A36",
  },
  {
    title: "Centralized Tooling",
    desc: "One platform for access management, build distribution, and code signing across the enterprise.",
    icon: "/images/icons/bitrise_logo.svg",
    color: "#E8DEFF",
    iconColor: "#6B3FA0",
  },
  {
    title: "Developer Enablement",
    desc: "Documentation, onboarding guides, and self-service resources so teams move fast independently.",
    icon: "/images/icons/bitrise_builds.svg",
    color: "#FFE4CC",
    iconColor: "#C45A1A",
  },
];

const team = [
  { name: "David Hetrick", role: "Architect", photo: "/images/team/team2-david-hetrick.png" },
  { name: "Stephanie Talati", role: "Dir Product", photo: "/images/team/team2-stephanie-talati.png" },
  { name: "Ari Olson", role: "VP, Software Engineering", photo: "/images/team/team2-ari-olson.png" },
  { name: "Suketu Vyas", role: "Principal Architect", photo: "/images/team/team2-suketu-vyas.png" },
  { name: "Satish Kulkarni", role: "Sr Engineer", photo: "/images/team/team2-satish-kulkarni.png" },
  { name: "Joel Durham", role: "Sr Product Manager", photo: "/images/team/team2-joel-durham.png" },
  { name: "Soumya Vaidya", role: "Project Operations", photo: "/images/team/team2-soumya-vaidya.png" },
  { name: "Anthony Asaro", role: "Technical Lead", photo: "/images/team/team2-anthony-asaro.png" },
  { name: "Rosalee Hacker", role: "Sr Platform Engineer", photo: "/images/team/team2-rosalee-hacker.png" },
  { name: "Narayana Routhu", role: "Sr Engineer", photo: "/images/team/team2-narayana-routhu.png" },
];

const getInvolved = [
  {
    title: "Developer Docs",
    desc: "Technical guides for CI/CD, release management, and platform access.",
    link: "Explore docs →",
    href: "/developers",
  },
  {
    title: "Contributing",
    desc: "How to contribute to MCOE projects, pipelines, and documentation.",
    link: "Get started →",
    href: "/developers/overview",
  },
  {
    title: "Support",
    desc: "Reach the MCOE team for help with onboarding, access, or issues.",
    link: "Contact support →",
    href: "https://support.bitrise.io",
  },
];

/* ── Component ── */

export function AboutLanding() {
  return (
    <>
      <AppsHeroComponent />
      <PageBody>
        <Content>
          <MissionBanner>
            <MissionLabel>Our Mission</MissionLabel>
            <MissionText>
              Provide every mobile engineering team with a unified, governed platform for CI/CD and
              release management — so they can focus on building great apps, not managing
              infrastructure.
            </MissionText>
          </MissionBanner>

          <SectionTitle>Our Team</SectionTitle>
          <SectionSubtitle>The people behind the Mobile Center of Excellence.</SectionSubtitle>
          <TeamGrid>
            {team.map((m, i) =>
              m.photo ? (
                <TeamMember key={i}>
                  <TeamPhoto src={m.photo} alt={m.name} />
                  <TeamName>{m.name}</TeamName>
                  <TeamRole>{m.role}</TeamRole>
                </TeamMember>
              ) : (
                <TeamMember key={i}>
                  <TeamLogoCircle>
                    <TeamLogoImg src='/images/logo-light.svg' alt='MCOE' />
                  </TeamLogoCircle>
                  <TeamName>{m.name}</TeamName>
                </TeamMember>
              ),
            )}
          </TeamGrid>

          <SectionTitle>What We Do</SectionTitle>
          <SectionSubtitle>
            The capabilities MCOE delivers to mobile teams across the enterprise.
          </SectionSubtitle>
          <ValueGrid>
            {values.map((v) => (
              <ValueCard key={v.title}>
                <ValueIconBox style={{ background: v.color, color: v.iconColor }}>
                  <ValueIcon
                    style={{
                      maskImage: `url(${v.icon})`,
                      WebkitMaskImage: `url(${v.icon})`,
                    }}
                  />
                </ValueIconBox>
                <div>
                  <ValueTitle>{v.title}</ValueTitle>
                  <ValueDesc>{v.desc}</ValueDesc>
                </div>
              </ValueCard>
            ))}
          </ValueGrid>

          <SectionTitle>Get Involved</SectionTitle>
          <SectionSubtitle>
            Jump in — whether you're onboarding, contributing, or need help.
          </SectionSubtitle>
          <CtaGrid data-analytics-surface="landing.about.get_involved">
            {getInvolved.map((item, i) => (
              <CtaCard
                key={item.title}
                to={item.href}
                data-analytics-label={item.title}
                data-analytics-position={i}
                data-analytics-type="cta"
              >
                <CtaTitle>{item.title}</CtaTitle>
                <CtaDesc>{item.desc}</CtaDesc>
                <CtaLink>{item.link}</CtaLink>
              </CtaCard>
            ))}
          </CtaGrid>
        </Content>
      </PageBody>
    </>
  );
}
