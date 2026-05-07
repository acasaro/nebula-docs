interface Props {
  product: string;
  path?: string;
}

const stepStyle: React.CSSProperties = {
  position: 'relative',
  paddingLeft: '40px',
  paddingBottom: '20px',
  borderLeft: '2px solid var(--mcoe-border-default, #e5e7eb)',
  marginLeft: '12px',
};

const numberStyle: React.CSSProperties = {
  position: 'absolute',
  left: '-15px',
  top: '-2px',
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: 'var(--mcoe-brand-primary, #4956E5)',
  color: '#fff',
  fontSize: '13px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  marginBottom: '4px',
};

const bodyStyle: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: 1.6,
  color: 'var(--mcoe-text-secondary, #475569)',
};

export function PlatformNav({ product, path }: Props) {
  return (
    <div style={{ margin: '24px 0' }}>
      <div style={stepStyle}>
        <span style={numberStyle}>1</span>
        <div style={titleStyle}>Open Immerse Platform</div>
        <div style={bodyStyle}>
          Navigate to{' '}
          <a href="https://uhg.immerse.com" style={{ color: 'var(--mcoe-brand-primary, #2563eb)' }}>
            Immerse Platform
          </a>{' '}
          and sign in with your credentials.
        </div>
      </div>
      <div style={{ ...stepStyle, paddingBottom: 0, borderLeft: 'none' }}>
        <span style={numberStyle}>2</span>
        <div style={titleStyle}>Go to {product}</div>
        <div style={bodyStyle}>
          From the left navigation sidebar, select <strong>{product}</strong>
          {path ? ` > ${path}` : ''}.
        </div>
      </div>
    </div>
  );
}
