interface Link {
  label: string;
  href: string;
  tag?: string;
}

const links: Link[] = [
  { label: 'Getting Started with Rollouts', href: '/developers/release-management/getting-started' },
  { label: 'Migrating GitHub CI to Bitrise', href: '/developers/mobile-ci/migrate-github-to-bitrise' },
  { label: 'Rollout Key Concepts', href: '/developers/release-management/pipeline-overview' },
  {
    label: 'Version Stages',
    href: '/developers/release-management/versions/pipeline-stages/release-candidate',
    tag: 'Popular',
  },
  { label: 'Contributing to Rollouts', href: '/developers/contributing/rollouts', tag: 'New' },
  { label: 'Bitrise Platform', href: '/developers/bitrise-platform/' },
];

const eyebrowStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 650,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: 'var(--mcoe-text-secondary, #64748b)',
  marginBottom: '16px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: '10px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
};

const linkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 20px',
  borderRadius: '10px',
  border: '1px solid var(--mcoe-border-default, #e2e8f0)',
  textDecoration: 'none',
  color: 'inherit',
  fontSize: '14px',
  fontWeight: 500,
  background: 'var(--mcoe-bg-primary, #fff)',
};

export function QuickLinks() {
  return (
    <div style={{ marginBottom: '48px' }}>
      <h2 style={eyebrowStyle}>Popular Pages</h2>
      <div style={gridStyle}>
        {links.map((lnk, i) => (
          <a
            key={lnk.label}
            href={lnk.href}
            style={linkStyle}
            data-analytics-surface="home.quick_links"
            data-analytics-label={lnk.label}
            data-analytics-position={i}
            data-analytics-type="link"
          >
            <span>{lnk.label}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '16px' }}>
              {lnk.tag && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 10px',
                    borderRadius: '100px',
                    color: '#fff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    background:
                      lnk.tag === 'New'
                        ? 'var(--mcoe-brand-accent, #00BED5)'
                        : 'var(--mcoe-brand-primary, #4956E5)',
                  }}
                >
                  {lnk.tag}
                </span>
              )}
              ›
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
