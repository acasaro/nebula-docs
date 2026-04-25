import React from "react";
import { styled } from "@site/src/lib/styled";
import { useTheme } from "@site/src/theme/ThemeContext";

const Wrapper = styled("div", {
  marginBottom: "48px",
});

const Pipeline = styled("div", {
  display: "flex",
  alignItems: "center",
  gap: "0",
  "@media (max-width: 768px)": {
    flexDirection: "column",
    gap: "8px",
  },
});

const CardBorder = styled("div", {
  flex: 1,
  display: "flex",
  padding: "1px",
  borderRadius: "14px",
});

const StageCard = styled("div", {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "16px",
  borderRadius: "13px",
  position: "relative",
  overflow: "hidden",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  cursor: "default",
  width: "100%",
  "&:hover": {
    transform: "translateY(-3px)",
  },
});

const Arrow = styled("div", {
  flexShrink: 0,
  width: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "@media (max-width: 768px)": {
    display: "none",
  },
});

const StepBadge = styled("span", {
  fontFamily: "var(--mcoe-font-family-mono, monospace)",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "1px",
  padding: "2px 7px",
  borderRadius: "5px",
  display: "inline-block",
  marginBottom: "12px",
});

const IconWrap = styled("div", {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "10px",
});

const IconImg = styled("span", {
  display: "block",
  width: "18px",
  height: "18px",
  backgroundColor: "currentColor",
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
});

const StageLabel = styled("div", {
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  marginBottom: "3px",
});

const StageSub = styled("div", {
  fontSize: "11px",
  fontFamily: "var(--mcoe-font-family-mono, monospace)",
  letterSpacing: "0.02em",
  opacity: 0.7,
});

const Shimmer = styled("div", {
  position: "absolute",
  top: "-40%",
  right: "-20%",
  width: "60%",
  paddingBottom: "60%",
  borderRadius: "50%",
  opacity: 0.1,
  filter: "blur(28px)",
  pointerEvents: "none",
});

// Per-theme: [primary, faint, border]
type ThemePalette = { primary: string; faint: string; border: string; darkCard: string };

const themePalettes: Record<string, ThemePalette> = {
  'mcoe-default': {
    primary:  '#4956E5',   // indigo.5
    faint:    '#EFF2FF',   // indigo.0
    border:   '#B3C1FD',   // indigo.2
    darkCard: 'rgba(18, 20, 79, 0.6)',
  },
  'optum': {
    primary:  '#B85B06',   // orange.5
    faint:    '#FFF1E5',   // orange.0
    border:   '#F4A876',   // orange.2
    darkCard: 'rgba(71, 23, 0, 0.6)',
  },
  'uhc': {
    primary:  '#0377FF',   // blue.5
    faint:    '#DDF4FF',   // blue.0
    border:   '#8DD6FF',   // blue.2
    darkCard: 'rgba(0, 28, 77, 0.6)',
  },
};

const stages = [
  { label: "Build",   sub: "Release Candidate", icon: "/images/icons/bitrise_builds.svg"  },
  { label: "Test",    sub: "TestFlight / Play",  icon: "/images/icons/step_test.svg"        },
  { label: "Approve", sub: "Team Sign-off",      icon: "/images/icons/step_approvals.svg"   },
  { label: "Review",  sub: "Store Review",       icon: "/images/icons/step_review_ios.svg"  },
  { label: "Release", sub: "Go Live",            icon: "/images/icons/step_release.svg"     },
];

export function ReleasePipeline() {
  const { themeId, isDark } = useTheme();
  const pal = themePalettes[themeId] ?? themePalettes['mcoe-default'];

  const cardBg     = isDark ? pal.darkCard  : pal.faint;
  const borderCol  = isDark ? `${pal.primary}55` : pal.border;
  const badgeBg    = isDark ? `${pal.primary}33` : `${pal.primary}18`;
  const badgeColor = pal.primary;
  const iconBg     = isDark ? `${pal.primary}33` : `${pal.primary}18`;
  const iconColor  = pal.primary;
  const labelColor = isDark ? "#e2e8f0" : "#0f172a";
  const subColor   = isDark ? pal.border : pal.primary;
  const arrowColor = isDark ? `${pal.primary}66` : pal.border;
  const boxShadow  = isDark
    ? `0 0 18px ${pal.primary}22, 0 4px 20px rgba(0,0,0,0.4)`
    : `0 2px 12px ${pal.primary}14, 0 1px 3px rgba(0,0,0,0.05)`;

  return (
    <Wrapper>
      <Pipeline>
        {stages.map((st, i) => (
          <React.Fragment key={st.label}>
            <CardBorder style={{ background: borderCol }}>
              <StageCard style={{ background: cardBg, boxShadow }}>
                <Shimmer style={{ background: pal.primary }} />
                <div>
                  <StepBadge style={{ background: badgeBg, color: badgeColor }}>
                    {String(i + 1).padStart(2, "0")}
                  </StepBadge>
                  <IconWrap style={{ background: iconBg }}>
                    <IconImg
                      style={{
                        color: iconColor,
                        maskImage: `url(${st.icon})`,
                        WebkitMaskImage: `url(${st.icon})`,
                      }}
                    />
                  </IconWrap>
                </div>
                <div>
                  <StageLabel style={{ color: labelColor }}>{st.label}</StageLabel>
                  <StageSub style={{ color: subColor }}>{st.sub}</StageSub>
                </div>
              </StageCard>
            </CardBorder>

            {i < stages.length - 1 && (
              <Arrow>
                <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1 7H17M12 2L18 7L12 12"
                    stroke={arrowColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Arrow>
            )}
          </React.Fragment>
        ))}
      </Pipeline>
    </Wrapper>
  );
}
