import {
  contentStyle,
  heroInnerStyle,
  heroSubtitleStyle,
  heroTitleStyle,
  heroWrapperStyle,
  pageBodyStyle,
  sectionSubtitleStyle,
  sectionTitleStyle,
} from './_primitives';

const pillars = [
  {
    title: 'CI/CD Standardization',
    desc: 'Unified build and test pipelines across all mobile teams. One workflow, every platform, consistent results.',
    icon: '/images/icons/bitrise_ci.svg',
    color: '#D6E9FF',
    iconColor: '#1A5FB4',
    barColor: '#1A5FB4',
    href: '/developers/mobile-ci/about-mobile-ci',
  },
  {
    title: 'Release Management',
    desc: 'Staged rollouts with governance, approvals, and automated promotion from RC to production.',
    icon: '/images/icons/bitrise_release_management.svg',
    color: '#D4F5DC',
    iconColor: '#1A7A36',
    barColor: '#1A7A36',
    href: '/developers/release-management/getting-started',
  },
  {
    title: 'Platform Enablement',
    desc: 'Centralized access, onboarding, and tooling so every team ships on the same foundation.',
    icon: '/images/icons/bitrise_logo.svg',
    color: '#E8DEFF',
    iconColor: '#6B3FA0',
    barColor: '#6B3FA0',
    href: '/developers/bitrise-platform',
  },
];

const roadmap = [
  {
    phase: 'Delivered',
    phaseColor: '#D4F5DC',
    phaseText: '#1A7A36',
    dotColor: '#1A7A36',
    title: 'Bitrise CI/CD Migration',
    desc: 'All mobile teams migrated from GitHub Actions to standardized Bitrise workflows.',
  },
  {
    phase: 'Delivered',
    phaseColor: '#D4F5DC',
    phaseText: '#1A7A36',
    dotColor: '#1A7A36',
    title: 'Release Management Rollout',
    desc: 'Staged version pipeline with approval gates live across iOS and Android.',
  },
  {
    phase: 'In Progress',
    phaseColor: '#D6E9FF',
    phaseText: '#1A5FB4',
    dotColor: '#1A5FB4',
    title: 'Enterprise Pipeline Templates',
    desc: 'Reusable pipeline configurations for rapid onboarding of new mobile products.',
  },
  {
    phase: 'Planned',
    phaseColor: '#F4F4F5',
    phaseText: '#6D6F70',
    dotColor: '#CBCCCD',
    title: 'Analytics & Release Insights',
    desc: 'Dashboards for build health, release velocity, and rollout success metrics.',
  },
];

export function ProductLanding() {
  return (
    <>
      <div style={heroWrapperStyle}>
        <div style={heroInnerStyle}>
          <h1 style={{ ...heroTitleStyle, marginTop: 0 }}>Product</h1>
          <p style={heroSubtitleStyle}>
            Strategy, roadmap, and initiative overviews driving the MCOE platform forward.
          </p>
        </div>
      </div>
      <div style={pageBodyStyle}>
        <div style={contentStyle}>
          <h2 style={sectionTitleStyle}>Strategic Pillars</h2>
          <p style={sectionSubtitleStyle}>
            The three areas of investment that define the MCOE platform.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px',
              marginBottom: '48px',
            }}
            data-analytics-surface="landing.product.pillars"
          >
            {pillars.map((p, i) => (
              <div
                key={p.title}
                data-analytics-label={p.title}
                data-analytics-position={i}
                style={{
                  borderRadius: '16px',
                  border: '1px solid var(--mcoe-border-default, #e2e8f0)',
                  background: 'var(--mcoe-bg-primary, #fff)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ height: '4px', background: p.barColor }} />
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                      background: p.color,
                      color: p.iconColor,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: 'block',
                        width: '22px',
                        height: '22px',
                        backgroundColor: 'currentColor',
                        maskImage: `url(${p.icon})`,
                        WebkitMaskImage: `url(${p.icon})`,
                        maskSize: 'contain',
                        WebkitMaskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center',
                      }}
                    />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 650, margin: '0 0 8px' }}>{p.title}</h3>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--mcoe-text-secondary, #64748b)',
                      lineHeight: 1.6,
                      margin: '0 0 16px',
                      flex: 1,
                    }}
                  >
                    {p.desc}
                  </p>
                  <a
                    href={p.href}
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--mcoe-text-link, #2563eb)',
                      textDecoration: 'none',
                    }}
                  >
                    Learn more →
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '48px' }}>
            <h2 style={sectionTitleStyle}>Roadmap</h2>
            <p style={sectionSubtitleStyle}>Where we've been and where we're headed.</p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                paddingLeft: '24px',
                borderLeft: '2px solid var(--mcoe-border-default, #e2e8f0)',
              }}
            >
              {roadmap.map((item) => (
                <div
                  key={item.title}
                  style={{
                    position: 'relative',
                    paddingLeft: '24px',
                    paddingBottom: '28px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '-31px',
                      top: '4px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      border: '2px solid var(--mcoe-bg-secondary, #f8fafc)',
                      background: item.dotColor,
                    }}
                  />
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      marginBottom: '6px',
                      background: item.phaseColor,
                      color: item.phaseText,
                    }}
                  >
                    {item.phase}
                  </span>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>{item.title}</h4>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--mcoe-text-secondary, #64748b)',
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
