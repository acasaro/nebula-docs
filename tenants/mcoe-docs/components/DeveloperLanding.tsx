import { heroPatternBackground, contentStyle, pageBodyStyle } from './_primitives';

const categories = [
  {
    icon: '/images/icons/bitrise_ci.svg',
    color: '#D6E9FF',
    iconColor: '#1A5FB4',
    title: 'Mobile CI',
    desc: 'CI/CD pipelines, workflows, and migration guides for MCOE mobile apps.',
    links: [
      { label: 'About Mobile CI', href: '/developers/mobile-ci/about-mobile-ci' },
      { label: 'Migrating to Bitrise', href: '/developers/mobile-ci/migrate-github-to-bitrise' },
      { label: 'Mobile workflows', href: '/developers/mobile-ci/mobile-workflows' },
    ],
    viewAll: '/developers/mobile-ci/about-mobile-ci',
  },
  {
    icon: '/images/icons/bitrise_release_management.svg',
    color: '#D4F5DC',
    iconColor: '#1A7A36',
    title: 'Release Management',
    desc: 'Rollouts, version tracking, and staged release processes across platforms.',
    links: [
      { label: 'Getting Started', href: '/developers/release-management/getting-started' },
      { label: 'Key concepts', href: '/developers/release-management/pipeline-overview' },
      { label: 'Adding a new rollout', href: '/developers/release-management/manage-rollout/create-rollout' },
    ],
    viewAll: '/developers/release-management/getting-started',
  },
  {
    icon: '/images/icons/bitrise_logo.svg',
    color: '#E8DEFF',
    iconColor: '#6B3FA0',
    title: 'Bitrise Access',
    desc: 'Getting set up on the Bitrise platform, permissions, and environment configuration.',
    links: [
      { label: 'Platform overview', href: '/developers/bitrise-platform' },
      { label: 'Access & permissions', href: '/developers/bitrise-platform/bitrise-access' },
    ],
    viewAll: '/developers/bitrise-platform',
  },
  {
    icon: '/images/icons/bitrise_approvals.svg',
    color: '#FFE4CC',
    iconColor: '#C45A1A',
    title: 'Version Stages',
    desc: 'How versions move through the MCOE release pipeline — from RC to production.',
    links: [
      {
        label: 'Release candidate',
        href: '/developers/release-management/versions/pipeline-stages/release-candidate',
      },
      { label: 'MCOE Approvals', href: '/developers/release-management/versions/pipeline-stages/approvals' },
      { label: 'Submit to App Store', href: '/developers/release-management/versions/pipeline-stages/app-store-review' },
      { label: 'Release to Google Play', href: '/developers/release-management/versions/pipeline-stages/release' },
    ],
    viewAll: '/developers/release-management/versions/about-versions',
  },
];

export function DeveloperLanding() {
  return (
    <>
      <div style={{ position: 'relative' }}>
        <div style={{ ...heroPatternBackground, padding: '64px 48px 48px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <h1
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 700,
                color: 'var(--mcoe-brand-display, #002677)',
                lineHeight: 1.15,
                marginBottom: '8px',
                letterSpacing: '-0.02em',
                maxWidth: '480px',
                marginTop: 0,
              }}
            >
              Developer Documentation
            </h1>
            <p
              style={{
                fontSize: '15px',
                color: 'var(--mcoe-text-secondary, #475569)',
                margin: 0,
                maxWidth: '480px',
              }}
            >
              CI/CD, releases, and mobile engineering
            </p>
          </div>
        </div>
        <div style={{ background: 'var(--mcoe-bg-primary, #fff)', padding: '40px 48px 48px' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--mcoe-text-primary, #0f172a)',
                marginBottom: '12px',
                marginTop: 0,
                maxWidth: '480px',
              }}
            >
              Build, test, and ship mobile apps with confidence.
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--mcoe-text-secondary, #475569)',
                lineHeight: 1.7,
                margin: 0,
                maxWidth: '480px',
              }}
            >
              Standardized CI/CD, a staged release pipeline, and tooling to take every MCOE app from
              first build to production.
            </p>
          </div>
        </div>
      </div>
      <div style={pageBodyStyle}>
        <div style={contentStyle}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
            }}
            data-analytics-surface="landing.developers"
          >
            {categories.map((cat, i) => (
              <div
                key={cat.title}
                data-analytics-category={cat.title}
                data-analytics-position={i}
                style={{
                  borderRadius: '16px',
                  border: '1px solid var(--mcoe-border-default, #e2e8f0)',
                  padding: '28px',
                  background: 'var(--mcoe-bg-primary, #fff)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: cat.color,
                      color: cat.iconColor,
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        display: 'block',
                        width: '24px',
                        height: '24px',
                        backgroundColor: 'currentColor',
                        maskImage: `url(${cat.icon})`,
                        WebkitMaskImage: `url(${cat.icon})`,
                        maskSize: 'contain',
                        WebkitMaskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        WebkitMaskRepeat: 'no-repeat',
                        maskPosition: 'center',
                        WebkitMaskPosition: 'center',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '17px', fontWeight: 650, margin: '0 0 4px' }}>{cat.title}</h3>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--mcoe-text-secondary, #64748b)',
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {cat.desc}
                    </p>
                  </div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', flex: 1 }}>
                  {cat.links.map((link, idx) => (
                    <li
                      key={link.href}
                      style={{
                        borderBottom:
                          idx === cat.links.length - 1
                            ? 'none'
                            : '1px solid var(--mcoe-border-default, #e2e8f0)',
                      }}
                    >
                      <a
                        href={link.href}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 0',
                          fontSize: '14px',
                          color: 'var(--mcoe-text-link, #2563eb)',
                          textDecoration: 'none',
                        }}
                      >
                        {link.label}
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>›</span>
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  href={cat.viewAll}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--mcoe-text-link, #2563eb)',
                    textDecoration: 'none',
                  }}
                >
                  View all →
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
