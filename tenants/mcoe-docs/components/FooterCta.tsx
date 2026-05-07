const wrapperStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '32px',
  borderRadius: '16px',
  border: '1px solid var(--mcoe-border-default, #e2e8f0)',
  background: 'var(--mcoe-bg-primary, #fff)',
};

const textStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--mcoe-text-secondary, #64748b)',
  marginBottom: '4px',
};

const linkStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--mcoe-brand-primary, #4956E5)',
  textDecoration: 'none',
};

export function FooterCta() {
  return (
    <div style={wrapperStyle}>
      <p style={textStyle}>Can't find what you're looking for?</p>
      <a
        href="https://support.bitrise.io"
        style={linkStyle}
        data-analytics-surface="home.footer_cta"
        data-analytics-label="Reach out to the MCoE team"
        data-analytics-type="cta"
      >
        Reach out to the MCoE team →
      </a>
    </div>
  );
}
