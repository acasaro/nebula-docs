import {
  heroInnerStyle,
  heroSubtitleStyle,
  heroTitleStyle,
  heroWrapperStyle,
  pageBodyStyle,
} from './_primitives';
import { GuideThumbnail } from './GuideThumbnail';
import { GlossaryThumbnail } from './GlossaryThumbnail';

const featured = [
  {
    title: 'Guides',
    desc: 'Step-by-step walkthroughs for rollouts, CI/CD pipelines, and measuring release success.',
    href: '/resources/guides',
    tag: 'Guide',
    tagColor: '#D6E9FF',
    tagText: '#1A5FB4',
    Thumbnail: GuideThumbnail,
  },
  {
    title: 'Glossary',
    desc: 'Definitions and context for key terms used across MCOE, Bitrise, and the release pipeline.',
    href: '/resources/glossary',
    tag: 'Reference',
    tagColor: '#D4F5DC',
    tagText: '#1A7A36',
    Thumbnail: GlossaryThumbnail,
  },
];

const quickAccess = [
  {
    title: 'Library',
    desc: 'Curated references and materials',
    href: '/resources/library',
    icon: 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/auto_stories/default/48px.svg',
    color: '#E8DEFF',
    iconColor: '#6B3FA0',
  },
  {
    title: 'Apple Developer Access',
    desc: 'App Store Connect security groups',
    href: '/resources/apple-developer-access',
    icon: '/images/icons/ios_platform.svg',
    color: '#E0F2FE',
    iconColor: '#0369A1',
  },
  {
    title: 'CI/CD Overview',
    desc: 'Integration and deployment concepts',
    href: '/resources/guides',
    icon: '/images/icons/bitrise_ci.svg',
    color: '#D6E9FF',
    iconColor: '#1A5FB4',
  },
];

const resourcesContentStyle: React.CSSProperties = {
  maxWidth: '960px',
  margin: '0 auto',
  padding: '40px 0px 80px',
};

export function ResourcesLanding() {
  return (
    <>
      <div style={heroWrapperStyle}>
        <div style={heroInnerStyle}>
          <h1 style={{ ...heroTitleStyle, marginTop: 0 }}>Resources</h1>
          <p style={heroSubtitleStyle}>
            Guides, glossary, announcements, and reference materials to support your mobile
            engineering workflow.
          </p>
        </div>
      </div>
      <div style={pageBodyStyle}>
        <div style={resourcesContentStyle}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
              marginBottom: '40px',
            }}
            data-analytics-surface="landing.resources.featured"
          >
            {featured.map((item, i) => {
              const Thumbnail = item.Thumbnail;
              return (
                <a
                  key={item.title}
                  href={item.href}
                  data-analytics-label={item.title}
                  data-analytics-position={i}
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
                      height: '140px',
                      overflow: 'hidden',
                      borderRadius: '16px 16px 0 0',
                      lineHeight: 0,
                    }}
                  >
                    <Thumbnail />
                  </div>
                  <div style={{ padding: '20px 24px 24px' }}>
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
                        background: item.tagColor,
                        color: item.tagText,
                      }}
                    >
                      {item.tag}
                    </span>
                    <h3 style={{ fontSize: '17px', fontWeight: 650, margin: '0 0 6px' }}>
                      {item.title}
                    </h3>
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
                </a>
              );
            })}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', marginTop: 0 }}>
            Quick Access
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '12px',
              marginBottom: '40px',
            }}
            data-analytics-surface="landing.resources.quick_access"
          >
            {quickAccess.map((item, i) => (
              <a
                key={item.title}
                href={item.href}
                data-analytics-label={item.title}
                data-analytics-position={i}
                data-analytics-type="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '1px solid var(--mcoe-border-default, #e2e8f0)',
                  background: 'var(--mcoe-bg-primary, #fff)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: item.color,
                    color: item.iconColor,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      display: 'block',
                      width: '22px',
                      height: '22px',
                      backgroundColor: 'currentColor',
                      maskImage: `url(${item.icon})`,
                      WebkitMaskImage: `url(${item.icon})`,
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
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
                    {item.title}
                  </span>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--mcoe-text-secondary, #64748b)' }}>
                    {item.desc}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
