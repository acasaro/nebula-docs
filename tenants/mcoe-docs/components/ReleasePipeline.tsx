import React from 'react';

const stages = [
  { label: 'Build', sub: 'Release Candidate', icon: '/images/icons/bitrise_builds.svg' },
  { label: 'Test', sub: 'TestFlight / Play', icon: '/images/icons/step_test.svg' },
  { label: 'Approve', sub: 'Team Sign-off', icon: '/images/icons/step_approvals.svg' },
  { label: 'Review', sub: 'Store Review', icon: '/images/icons/step_review_ios.svg' },
  { label: 'Release', sub: 'Go Live', icon: '/images/icons/step_release.svg' },
];

const palette = {
  primary: '#4956E5',
  faint: '#EFF2FF',
  border: '#B3C1FD',
};

const wrapperStyle: React.CSSProperties = {
  marginBottom: '48px',
};

const pipelineStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 0,
  flexWrap: 'wrap',
};

const cardBorderStyle: React.CSSProperties = {
  flex: '1 1 160px',
  display: 'flex',
  padding: '1px',
  borderRadius: '14px',
  background: palette.border,
};

const cardStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: '16px',
  borderRadius: '13px',
  position: 'relative',
  overflow: 'hidden',
  width: '100%',
  background: palette.faint,
  boxShadow: `0 2px 12px ${palette.primary}14, 0 1px 3px rgba(0,0,0,0.05)`,
};

const arrowStyle: React.CSSProperties = {
  flexShrink: 0,
  width: '28px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const badgeStyle: React.CSSProperties = {
  fontFamily: 'var(--mcoe-font-family-mono, monospace)',
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '1px',
  padding: '2px 7px',
  borderRadius: '5px',
  display: 'inline-block',
  marginBottom: '12px',
  background: `${palette.primary}18`,
  color: palette.primary,
};

const iconWrapStyle: React.CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '10px',
  background: `${palette.primary}18`,
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '-0.01em',
  marginBottom: '3px',
  color: '#0f172a',
};

const subStyle: React.CSSProperties = {
  fontSize: '11px',
  fontFamily: 'var(--mcoe-font-family-mono, monospace)',
  letterSpacing: '0.02em',
  color: palette.primary,
  opacity: 0.8,
};

export function ReleasePipeline() {
  return (
    <div style={wrapperStyle}>
      <div style={pipelineStyle}>
        {stages.map((st, i) => (
          <React.Fragment key={st.label}>
            <div style={cardBorderStyle}>
              <div style={cardStyle}>
                <div>
                  <span style={badgeStyle}>{String(i + 1).padStart(2, '0')}</span>
                  <div style={iconWrapStyle}>
                    <span
                      aria-hidden
                      style={{
                        display: 'block',
                        width: '18px',
                        height: '18px',
                        backgroundColor: palette.primary,
                        maskImage: `url(${st.icon})`,
                        WebkitMaskImage: `url(${st.icon})`,
                        maskSize: 'contain',
                        WebkitMaskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>{st.label}</div>
                  <div style={subStyle}>{st.sub}</div>
                </div>
              </div>
            </div>
            {i < stages.length - 1 && (
              <div style={arrowStyle}>
                <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1 7H17M12 2L18 7L12 12"
                    stroke={palette.border}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
