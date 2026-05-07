interface Item {
  title: string;
  desc: string;
  href: string;
  accent: string;
}

const items: Item[] = [
  {
    title: 'Product',
    desc: 'Product strategy, roadmaps, and initiative overviews for the MCoE platform.',
    href: '/product/',
    accent: 'var(--mcoe-brand-accent, #00BED5)',
  },
  {
    title: 'Developers',
    desc: 'Technical documentation for mobile CI, release management, code signing, and workflows.',
    href: '/developers/',
    accent: 'var(--mcoe-brand-primary, #4956E5)',
  },
  {
    title: 'Resources',
    desc: 'Guides, glossary, announcements, and reference materials for the team.',
    href: '/resources',
    accent: 'var(--mcoe-brand-primary-light, #6B7BFF)',
  },
];

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gap: '20px',
  marginBottom: '48px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
};

const cardStyle: React.CSSProperties = {
  position: 'relative',
  border: '1px solid var(--mcoe-border-default, #e2e8f0)',
  borderRadius: '16px',
  background: 'var(--mcoe-bg-primary, #fff)',
  overflow: 'hidden',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

const linkStyle: React.CSSProperties = {
  display: 'block',
  padding: '32px 28px',
  color: 'inherit',
  textDecoration: 'none',
  height: '100%',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 650,
  lineHeight: 1.3,
  marginTop: 0,
  marginBottom: '8px',
};

const descStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: 1.6,
  color: 'var(--mcoe-text-secondary, #64748b)',
  marginTop: 0,
  marginBottom: '16px',
};

export function FeatureCards() {
  return (
    <div style={gridStyle}>
      {items.map((item, i) => (
        <div key={item.title} style={cardStyle}>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              opacity: 0.8,
              borderRadius: '16px 16px 0 0',
              background: item.accent,
              zIndex: 1,
            }}
          />
          <a
            href={item.href}
            style={linkStyle}
            data-analytics-surface="home.feature_cards"
            data-analytics-label={item.title}
            data-analytics-position={i}
            data-analytics-type="card"
          >
            <h3 style={titleStyle}>{item.title}</h3>
            <p style={descStyle}>{item.desc}</p>
            <span style={{ fontSize: '13px', fontWeight: 600, color: item.accent }}>
              Explore →
            </span>
          </a>
        </div>
      ))}
    </div>
  );
}
