import {
  contentStyle,
  pageBodyStyle,
  sectionSubtitleStyle,
  sectionTitleStyle,
} from './_primitives';
import { AppsHeroComponent } from './AppsHeroComponent';

const values = [
  {
    title: 'Standardized CI/CD',
    desc: 'Every mobile team builds and tests on the same platform with shared, governed workflows.',
    icon: '/images/icons/bitrise_ci.svg',
    color: '#D6E9FF',
    iconColor: '#1A5FB4',
  },
  {
    title: 'Governed Releases',
    desc: 'Staged rollouts with approval gates ensure quality at every step from RC to production.',
    icon: '/images/icons/bitrise_release_management.svg',
    color: '#D4F5DC',
    iconColor: '#1A7A36',
  },
  {
    title: 'Centralized Tooling',
    desc: 'One platform for access management, build distribution, and code signing across the enterprise.',
    icon: '/images/icons/bitrise_logo.svg',
    color: '#E8DEFF',
    iconColor: '#6B3FA0',
  },
  {
    title: 'Developer Enablement',
    desc: 'Documentation, onboarding guides, and self-service resources so teams move fast independently.',
    icon: '/images/icons/bitrise_builds.svg',
    color: '#FFE4CC',
    iconColor: '#C45A1A',
  },
];

const team = [
  { name: 'David Hetrick', role: 'Architect', photo: '/images/team/team2-david-hetrick.png' },
  { name: 'Stephanie Talati', role: 'Dir Product', photo: '/images/team/team2-stephanie-talati.png' },
  { name: 'Ari Olson', role: 'VP, Software Engineering', photo: '/images/team/team2-ari-olson.png' },
  { name: 'Suketu Vyas', role: 'Principal Architect', photo: '/images/team/team2-suketu-vyas.png' },
  { name: 'Satish Kulkarni', role: 'Sr Engineer', photo: '/images/team/team2-satish-kulkarni.png' },
  { name: 'Joel Durham', role: 'Sr Product Manager', photo: '/images/team/team2-joel-durham.png' },
  { name: 'Soumya Vaidya', role: 'Project Operations', photo: '/images/team/team2-soumya-vaidya.png' },
  { name: 'Anthony Asaro', role: 'Technical Lead', photo: '/images/team/team2-anthony-asaro.png' },
  { name: 'Rosalee Hacker', role: 'Sr Platform Engineer', photo: '/images/team/team2-rosalee-hacker.png' },
  { name: 'Narayana Routhu', role: 'Sr Engineer', photo: '/images/team/team2-narayana-routhu.png' },
];

const getInvolved = [
  {
    title: 'Developer Docs',
    desc: 'Technical guides for CI/CD, release management, and platform access.',
    link: 'Explore docs →',
    href: '/developers',
  },
  {
    title: 'Contributing',
    desc: 'How to contribute to MCOE projects, pipelines, and documentation.',
    link: 'Get started →',
    href: '/developers/overview',
  },
  {
    title: 'Support',
    desc: 'Reach the MCOE team for help with onboarding, access, or issues.',
    link: 'Contact support →',
    href: 'https://support.bitrise.io',
  },
];

export function AboutLanding() {
  return (
    <>
      <AppsHeroComponent />
      <div style={pageBodyStyle}>
        <div style={contentStyle}>
          <div
            style={{
              borderRadius: '16px',
              background: 'var(--mcoe-bg-primary, #fff)',
              border: '1px solid var(--mcoe-border-default, #e2e8f0)',
              padding: '40px 36px',
              marginBottom: '40px',
              textAlign: 'center',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                padding: '3px 10px',
                borderRadius: '4px',
                background: 'var(--mcoe-info-light, #DBEAFE)',
                color: 'var(--mcoe-info, #1E40AF)',
                marginBottom: '16px',
              }}
            >
              Our Mission
            </span>
            <p
              style={{
                fontSize: '18px',
                fontWeight: 500,
                lineHeight: 1.6,
                color: 'var(--mcoe-text-primary, #0f172a)',
                margin: 0,
                maxWidth: '640px',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Provide every mobile engineering team with a unified, governed platform for CI/CD and
              release management — so they can focus on building great apps, not managing
              infrastructure.
            </p>
          </div>

          <h2 style={sectionTitleStyle}>Our Team</h2>
          <p style={sectionSubtitleStyle}>The people behind the Mobile Center of Excellence.</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '20px',
              marginBottom: '48px',
              justifyItems: 'center',
            }}
          >
            {team.map((m) => (
              <div
                key={m.name}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}
              >
                <img
                  src={m.photo}
                  alt={m.name}
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--mcoe-bg-secondary, #f8fafc)',
                    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
                    background: 'var(--mcoe-bg-primary, #fff)',
                    margin: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--mcoe-text-primary, #0f172a)',
                    textAlign: 'center',
                  }}
                >
                  {m.name}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--mcoe-text-secondary, #64748b)',
                    textAlign: 'center',
                    marginTop: '-6px',
                  }}
                >
                  {m.role}
                </span>
              </div>
            ))}
          </div>

          <h2 style={sectionTitleStyle}>What We Do</h2>
          <p style={sectionSubtitleStyle}>
            The capabilities MCOE delivers to mobile teams across the enterprise.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '48px',
            }}
          >
            {values.map((v) => (
              <div
                key={v.title}
                style={{
                  borderRadius: '12px',
                  border: '1px solid var(--mcoe-border-default, #e2e8f0)',
                  background: 'var(--mcoe-bg-primary, #fff)',
                  padding: '24px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
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
                    background: v.color,
                    color: v.iconColor,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      display: 'block',
                      width: '20px',
                      height: '20px',
                      backgroundColor: 'currentColor',
                      maskImage: `url(${v.icon})`,
                      WebkitMaskImage: `url(${v.icon})`,
                      maskSize: 'contain',
                      WebkitMaskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      WebkitMaskRepeat: 'no-repeat',
                      maskPosition: 'center',
                      WebkitMaskPosition: 'center',
                    }}
                  />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 650, margin: '0 0 4px' }}>{v.title}</h3>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--mcoe-text-secondary, #64748b)',
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <h2 style={sectionTitleStyle}>Get Involved</h2>
          <p style={sectionSubtitleStyle}>
            Jump in — whether you're onboarding, contributing, or need help.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
            }}
            data-analytics-surface="landing.about.get_involved"
          >
            {getInvolved.map((item, i) => (
              <a
                key={item.title}
                href={item.href}
                data-analytics-label={item.title}
                data-analytics-position={i}
                data-analytics-type="cta"
                style={{
                  display: 'block',
                  borderRadius: '12px',
                  border: '1px solid var(--mcoe-border-default, #e2e8f0)',
                  background: 'var(--mcoe-bg-primary, #fff)',
                  padding: '24px',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 650, margin: '0 0 6px' }}>{item.title}</h3>
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--mcoe-text-secondary, #64748b)',
                    lineHeight: 1.5,
                    margin: '0 0 12px',
                  }}
                >
                  {item.desc}
                </p>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mcoe-text-link, #2563eb)' }}>
                  {item.link}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
