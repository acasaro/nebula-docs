import type { CSSProperties } from 'react';

export const heroPatternBackground: CSSProperties = {
  backgroundImage:
    'linear-gradient(135deg, rgba(241,245,249,0.93) 0%, rgba(237,242,247,0.95) 40%, rgba(231,238,244,0.96) 100%), url(/images/landing/pixel-pattern-hero.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

export const heroWrapperStyle: CSSProperties = {
  ...heroPatternBackground,
  padding: '64px 48px 48px',
};

export const heroInnerStyle: CSSProperties = {
  maxWidth: '960px',
  margin: '0 auto',
};

export const heroTitleStyle: CSSProperties = {
  fontSize: 'clamp(28px, 4vw, 40px)',
  fontWeight: 700,
  color: 'var(--mcoe-brand-display, #002677)',
  lineHeight: 1.15,
  marginBottom: '8px',
  letterSpacing: '-0.02em',
};

export const heroSubtitleStyle: CSSProperties = {
  fontSize: '15px',
  color: 'var(--mcoe-text-secondary, #475569)',
  margin: 0,
  maxWidth: '520px',
};

export const pageBodyStyle: CSSProperties = {
  background: 'var(--mcoe-bg-secondary, #f8fafc)',
  minHeight: '100vh',
};

export const contentStyle: CSSProperties = {
  maxWidth: '960px',
  margin: '0 auto',
  padding: '40px 24px 80px',
};

export const sectionTitleStyle: CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  marginBottom: '4px',
  marginTop: 0,
};

export const sectionSubtitleStyle: CSSProperties = {
  fontSize: '14px',
  color: 'var(--mcoe-text-secondary, #475569)',
  marginBottom: '24px',
};
