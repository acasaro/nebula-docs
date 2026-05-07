const wrapperStyle: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  padding: '80px 48px',
  backgroundImage: 'url(/images/landing/overview-hero-background.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
};

const innerStyle: React.CSSProperties = {
  maxWidth: '960px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 1,
};

const eyebrowStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 16px',
  borderRadius: '100px',
  background: 'rgba(0, 38, 119, 0.08)',
  border: '1px solid rgba(0, 38, 119, 0.15)',
  marginBottom: '24px',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--mcoe-brand-display, #002677)',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
};

const eyebrowDotStyle: React.CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: 'var(--mcoe-brand-primary, #4956E5)',
  boxShadow: '0 0 8px rgba(0, 38, 119, 0.4)',
};

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(32px, 5vw, 52px)',
  fontWeight: 700,
  color: 'var(--mcoe-brand-display, #002677)',
  lineHeight: 1.1,
  marginBottom: '16px',
  letterSpacing: '-0.02em',
};

const accentStyle: React.CSSProperties = {
  color: 'var(--mcoe-brand-primary-light, #6B7BFF)',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '18px',
  color: 'var(--mcoe-text-secondary, #475569)',
  lineHeight: 1.6,
  marginBottom: '32px',
  maxWidth: '560px',
};

const ctaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
};

const ctaPrimaryStyle: React.CSSProperties = {
  padding: '14px 28px',
  borderRadius: '10px',
  background: 'var(--mcoe-brand-primary, #4956E5)',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 700,
  textDecoration: 'none',
  display: 'inline-block',
};

const ctaSecondaryStyle: React.CSSProperties = {
  padding: '14px 28px',
  borderRadius: '10px',
  background: 'rgba(0, 38, 119, 0.08)',
  border: '1px solid rgba(0, 38, 119, 0.2)',
  color: 'var(--mcoe-brand-display, #002677)',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
};

export function Hero() {
  return (
    <div style={wrapperStyle}>
      <div style={innerStyle}>
        <div style={eyebrowStyle}>
          <span style={eyebrowDotStyle} />
          Mobile Center of Excellence
        </div>
        <h1 style={titleStyle}>
          The Standard for <span style={accentStyle}>Mobile Engineering</span>
        </h1>
        <p style={subtitleStyle}>
          Your team's single source of truth for CI/CD pipelines, release management, code signing,
          and everything mobile. Built by engineers, for engineers.
        </p>
        <div style={ctaRowStyle}>
          <a
            href="/developers/"
            style={ctaPrimaryStyle}
            data-analytics-surface="home.hero"
            data-analytics-label="Get Started"
            data-analytics-position={0}
            data-analytics-type="cta"
          >
            Get Started →
          </a>
          <a
            href="/developers/release-management/getting-started"
            style={ctaSecondaryStyle}
            data-analytics-surface="home.hero"
            data-analytics-label="Rollouts Guide"
            data-analytics-position={1}
            data-analytics-type="cta"
          >
            Rollouts Guide
          </a>
        </div>
      </div>
    </div>
  );
}
