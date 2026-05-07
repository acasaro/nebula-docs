const items = [
  { value: '2', label: 'Platforms' },
  { value: '5', label: 'Release Stages' },
  { value: '40+', label: 'Technical Docs' },
  { value: '100%', label: 'Bitrise Coverage' },
];

const gridStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  padding: '28px 32px',
  borderRadius: '16px',
  border: '1px solid var(--mcoe-border-default, #e2e8f0)',
  background: 'var(--mcoe-bg-primary, #fff)',
  marginBottom: '48px',
  flexWrap: 'wrap',
};

const statStyle: React.CSSProperties = {
  textAlign: 'center',
  flex: '1 1 140px',
};

const valueStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 750,
  letterSpacing: '-0.03em',
  lineHeight: 1.2,
  background:
    'linear-gradient(135deg, var(--mcoe-brand-primary, #4956E5), var(--mcoe-brand-primary-light, #6B7BFF))',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--mcoe-text-secondary, #64748b)',
  fontWeight: 500,
  marginTop: '4px',
};

export function StatsGrid() {
  return (
    <div style={gridStyle}>
      {items.map((item) => (
        <div key={item.label} style={statStyle}>
          <div style={valueStyle}>{item.value}</div>
          <div style={labelStyle}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}
