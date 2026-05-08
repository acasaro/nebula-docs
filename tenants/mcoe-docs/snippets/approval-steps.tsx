import { Fragment } from "react";

interface Stage {
  label: string;
  description: string;
  icon: string;
}

const STAGES: Stage[] = [
  { label: "Build", description: "Release Candidate", icon: "/images/icons/bitrise_builds.svg" },
  { label: "Test", description: "TestFlight / Play", icon: "/images/icons/step_test.svg" },
  { label: "Approve", description: "Team Sign-off", icon: "/images/icons/step_approvals.svg" },
  { label: "Review", description: "Store Review", icon: "/images/icons/step_review_ios.svg" },
  { label: "Release", description: "Go Live", icon: "/images/icons/step_release.svg" },
];

const wrapperStyle: React.CSSProperties = {
  marginTop: "24px",
  marginBottom: "32px",
};

const pipelineStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "stretch",
  gap: "0",
  flexWrap: "wrap",
};

// Accent driven from the active theme's primary brand token. Swaps
// automatically when the tenant's theme.json is changed (mcoe-default → blue,
// optum → orange, uhc → deep navy).
const ACCENT = "var(--mcoe-brand-primary)";

const cardBorderStyle: React.CSSProperties = {
  flex: "1 1 0",
  display: "flex",
  padding: "1px",
  borderRadius: "14px",
  background: `color-mix(in srgb, ${ACCENT} 25%, transparent)`,
  minWidth: "140px",
};

const cardStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "16px",
  borderRadius: "13px",
  position: "relative",
  overflow: "hidden",
  width: "100%",
  background: `color-mix(in srgb, ${ACCENT} 8%, transparent)`,
  boxShadow: `0 2px 12px color-mix(in srgb, ${ACCENT} 12%, transparent), 0 1px 3px rgba(0, 0, 0, 0.05)`,
};

const shimmerStyle: React.CSSProperties = {
  position: "absolute",
  top: "-40%",
  right: "-20%",
  width: "60%",
  paddingBottom: "60%",
  borderRadius: "50%",
  opacity: 0.1,
  filter: "blur(28px)",
  pointerEvents: "none",
  background: ACCENT,
};

const stepBadgeStyle: React.CSSProperties = {
  fontFamily: "var(--mcoe-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "1px",
  padding: "2px 7px",
  borderRadius: "5px",
  display: "inline-block",
  marginBottom: "12px",
  background: `color-mix(in srgb, ${ACCENT} 18%, transparent)`,
  color: ACCENT,
};

const iconWrapStyle: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "10px",
  background: `color-mix(in srgb, ${ACCENT} 18%, transparent)`,
};

const iconImgBaseStyle: React.CSSProperties = {
  display: "block",
  width: "18px",
  height: "18px",
  backgroundColor: ACCENT,
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
};

// Text colors inherit from the page so they flip with the host's
// light/dark mode regardless of which token system is in scope.
// `--mcoe-text-primary` only dark-flips inside `[data-theme="dark"]`
// (the legacy docs-site convention), but the editor uses a `.dark`
// class — so a fixed-token color renders dark-on-dark and is
// unreadable in editor dark mode.
const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "-0.01em",
  marginBottom: "3px",
  color: "inherit",
};

const subStyle: React.CSSProperties = {
  fontSize: "11px",
  fontFamily: "var(--mcoe-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  letterSpacing: "0.02em",
  color: "inherit",
  opacity: 0.7,
};

const arrowStyle: React.CSSProperties = {
  flexShrink: 0,
  width: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: `color-mix(in srgb, ${ACCENT} 60%, transparent)`,
};

export function ApprovalSteps() {
  return (
    <div style={wrapperStyle}>
      <div style={pipelineStyle}>
        {STAGES.map((stage, i) => (
          <Fragment key={stage.label}>
            <div style={cardBorderStyle}>
              <div style={cardStyle}>
                <div style={shimmerStyle} />
                <div>
                  <span style={stepBadgeStyle}>{String(i + 1).padStart(2, "0")}</span>
                  <div style={iconWrapStyle}>
                    <span
                      aria-hidden
                      style={{
                        ...iconImgBaseStyle,
                        maskImage: `url(${stage.icon})`,
                        WebkitMaskImage: `url(${stage.icon})`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>{stage.label}</div>
                  <div style={subStyle}>{stage.description}</div>
                </div>
              </div>
            </div>

            {i < STAGES.length - 1 ? (
              <div style={arrowStyle} aria-hidden>
                <svg
                  width='20'
                  height='14'
                  viewBox='0 0 20 14'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    d='M1 7H17M12 2L18 7L12 12'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
            ) : null}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export default ApprovalSteps;
