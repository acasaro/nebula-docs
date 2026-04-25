import type { CSSObject } from "@emotion/react";
import { styled } from "@site/src/lib/styled";

/**
 * Shared style fragment: gradient + pixel-pattern hero background with dark-mode variant.
 * Spread into a styled block when a landing's hero needs its own padding/alignment
 * but the background treatment is the canonical MCOE hero look.
 */
export const heroPatternBackground: CSSObject = {
  backgroundImage:
    "linear-gradient(135deg, rgba(241,245,249,0.93) 0%, rgba(237,242,247,0.95) 40%, rgba(231,238,244,0.96) 100%), url(/images/landing/pixel-pattern-hero.jpg)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  '[data-theme="dark"] &': {
    backgroundImage:
      "linear-gradient(135deg, rgba(20,27,35,0.92) 0%, rgba(20,27,35,0.95) 100%), url(/images/landing/pixel-pattern-hero.jpg)",
  },
};

/** Standard hero chrome — left-aligned, used by Product / Resources / About. */
export const HeroWrapper = styled("div", {
  ...heroPatternBackground,
  padding: "64px 48px 48px",
  "@media (max-width: 996px)": { padding: "40px 24px 32px" },
});

export const HeroInner = styled("div", {
  maxWidth: "960px",
  margin: "0 auto",
});

export const HeroTitle = styled("h1", {
  fontSize: "clamp(28px, 4vw, 40px)",
  fontWeight: 700,
  color: "var(--mcoe-brand-display)",
  lineHeight: 1.15,
  marginBottom: "8px",
  letterSpacing: "-0.02em",
});

export const HeroSubtitle = styled("p", {
  fontSize: "15px",
  color: "var(--mcoe-text-secondary)",
  margin: 0,
  maxWidth: "520px",
});

export const PageBody = styled("div", {
  background: "var(--mcoe-bg-secondary)",
  minHeight: "100vh",
});

export const Content = styled("div", {
  maxWidth: "960px",
  margin: "0 auto",
  padding: "40px 24px 80px",
});

export const SectionTitle = styled("h2", {
  fontSize: "20px",
  fontWeight: 700,
  marginBottom: "4px",
  marginTop: 0,
});

export const SectionSubtitle = styled("p", {
  fontSize: "14px",
  color: "var(--mcoe-text-secondary)",
  marginBottom: "24px",
});
