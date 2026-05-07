import { heroPatternBackground } from './_primitives';

interface Guide {
  title: string;
  desc: string;
  href: string;
  category: string;
  categoryColor: string;
  categoryText: string;
  bgColor: string;
  image?: string;
}

const guides: Guide[] = [
  {
    title: 'Apple Developer Access',
    desc: 'Security groups governing external team access to App Store Connect for UHC, Optum, UHG, Soultran, and UHG Enterprise.',
    href: '/resources/apple-developer-access',
    category: 'Platform',
    categoryColor: '#D1FAE5',
    categoryText: '#065F46',
    bgColor: '#F0FDF4',
    image: '/images/wallpapers/mcoe-generic-wallpaper-20.png',
  },
  {
    title: 'Google Developer Access',
    desc: 'Security groups governing external team access to Google Play Console for UHC, Optum, UHG, and Soultran.',
    href: '/resources/google-developer-access',
    category: 'Platform',
    categoryColor: '#D1FAE5',
    categoryText: '#065F46',
    bgColor: '#F0FDF4',
    image: '/images/wallpapers/mcoe-generic-wallpaper-19.png',
  },
  {
    title: 'What is Release Management?',
    desc: 'Learn what release management is, the 6-step process teams follow, best practices for measuring success, and how it applies to mobile app releases.',
    href: '#',
    category: 'Development',
    categoryColor: '#D6E9FF',
    categoryText: '#1A5FB4',
    bgColor: '#EBF5FF',
    image: '/images/wallpapers/mcoe-generic-wallpaper-0.png',
  },
  {
    title: 'What is CI/CD?',
    desc: 'CI/CD combines continuous integration and continuous deployment, automating the process of integrating, testing and delivering code changes into production.',
    href: '#',
    category: 'Development',
    categoryColor: '#D6E9FF',
    categoryText: '#1A5FB4',
    bgColor: '#F0F4FF',
    image: '/images/wallpapers/mcoe-generic-wallpaper-1.png',
  },
  {
    title: 'What is Continuous Integration?',
    desc: 'Continuous integration is a software development practice ensuring your codebase remains healthy by continuously validating updates.',
    href: '#',
    category: 'Development',
    categoryColor: '#D6E9FF',
    categoryText: '#1A5FB4',
    bgColor: '#F5F0FF',
    image: '/images/wallpapers/mcoe-generic-wallpaper-4.png',
  },
  {
    title: 'What is Continuous Delivery?',
    desc: 'Continuous delivery is a practice focusing on automating the delivery of code updates to production both quickly and reliably.',
    href: '/developers/mobile-ci/about-mobile-ci',
    category: 'Development',
    categoryColor: '#D6E9FF',
    categoryText: '#1A5FB4',
    bgColor: '#FFF8F0',
    image: '/images/wallpapers/mcoe-generic-wallpaper-3.png',
  },
  {
    title: 'Understanding the Approvals Process',
    desc: 'A walkthrough of the 6 approval types required before an app can be submitted for store review, including compliance and business sign-offs.',
    href: '/developers/release-management/versions/pipeline-stages/approvals',
    category: 'Product',
    categoryColor: '#F3E8FF',
    categoryText: '#6B21A8',
    bgColor: '#FAF5FF',
    image: '/images/wallpapers/mcoe-generic-wallpaper-6.png',
  },
  {
    title: 'Getting Started with Rollouts',
    desc: 'Step-by-step guide to creating your first rollout, configuring your pipeline, and shipping your first release through Immerse.',
    href: '/developers/release-management/getting-started',
    category: 'Product',
    categoryColor: '#F3E8FF',
    categoryText: '#6B21A8',
    bgColor: '#F0FFF4',
    image: '/images/wallpapers/mcoe-generic-wallpaper-7.png',
  },
  {
    title: 'OSPO Compliance & License Scanning',
    desc: 'How automated open-source license scanning works, understanding scan results, resolving violations, and downloading your SBOM.',
    href: '/developers/release-management/versions/pipeline-stages/ospo-compliance',
    category: 'Development',
    categoryColor: '#D6E9FF',
    categoryText: '#1A5FB4',
    bgColor: '#F0FFF4',
    image: '/images/wallpapers/mcoe-generic-wallpaper-9.png',
  },
  {
    title: 'Migrating from GitHub to Bitrise',
    desc: 'Move your mobile CI workflows from GitHub Actions to Bitrise for native build environments, code signing, and release management integration.',
    href: '/developers/mobile-ci/migrate-github-to-bitrise',
    category: 'Development',
    categoryColor: '#D6E9FF',
    categoryText: '#1A5FB4',
    bgColor: '#FFF8F0',
    image: '/images/wallpapers/mcoe-generic-wallpaper-8.png',
  },
  {
    title: 'Phased Releases on the App Store',
    desc: 'How to configure and manage phased releases to gradually roll out updates to your users over a 7-day period.',
    href: '/developers/release-management/versions/pipeline-stages/release',
    category: 'Product',
    categoryColor: '#F3E8FF',
    categoryText: '#6B21A8',
    bgColor: '#EBF5FF',
    image: '/images/wallpapers/mcoe-generic-wallpaper-10.png',
  },
];

export function GuidesLanding() {
  return (
    <>
      <div
        style={{
          ...heroPatternBackground,
          padding: '40px 48px 40px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 'clamp(26px, 3.5vw, 36px)',
            fontWeight: 700,
            color: 'var(--mcoe-brand-display, #002677)',
            lineHeight: 1.2,
            marginBottom: '12px',
            letterSpacing: '-0.02em',
            marginTop: 0,
          }}
        >
          Guides
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--mcoe-text-secondary, #475569)',
            margin: '0 auto 20px',
            maxWidth: '560px',
            lineHeight: 1.5,
          }}
        >
          Dive into software delivery topics such as CI/CD, DevOps, Agile, and the unique challenges
          posed by mobile development.
        </p>
        <div
          style={{
            width: '48px',
            height: '4px',
            borderRadius: '2px',
            background: 'var(--mcoe-brand-primary, #4956E5)',
            margin: '0 auto',
          }}
        />
      </div>
      <div
        style={{
          background: 'var(--mcoe-bg-deepest, #f1f5f9)',
          minHeight: '60vh',
          padding: '40px 24px 80px',
        }}
      >
        <div
          style={{
            maxWidth: '1060px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
          data-analytics-surface="landing.guides"
        >
          {guides.map((guide, i) => (
            <a
              key={guide.title}
              href={guide.href}
              data-analytics-label={guide.title}
              data-analytics-position={i}
              data-analytics-category={guide.category}
              data-analytics-type="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '16px',
                border: '1px solid var(--mcoe-border-default, #e2e8f0)',
                overflow: 'hidden',
                background: 'var(--mcoe-bg-primary, #fff)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  height: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  color: 'var(--mcoe-text-secondary, #475569)',
                  overflow: 'hidden',
                  background: guide.bgColor,
                }}
              >
                {guide.image && (
                  <img
                    src={guide.image}
                    alt={guide.title}
                    style={{
                      height: '100%',
                      objectFit: 'cover',
                      width: '100%',
                      objectPosition: 'center 15%',
                    }}
                  />
                )}
              </div>
              <div style={{ padding: '16px 20px 20px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    background: guide.categoryColor,
                    color: guide.categoryText,
                  }}
                >
                  {guide.category}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 650, margin: '0 0 6px', lineHeight: 1.3 }}>
                  {guide.title}
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--mcoe-text-secondary, #64748b)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {guide.desc}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
