import Link from '@docusaurus/Link';
import { styled } from '@site/src/lib/styled';

const Wrapper = styled('div', {
  marginBottom: '48px',
});

const SectionEyebrow = styled('h2', {
  fontSize: '13px',
  fontWeight: 650,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: 'var(--ifm-color-emphasis-600)',
  marginBottom: '16px',
});

const Grid = styled('div', {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '10px',
  '@media (min-width: 997px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
});

const QuickLink = styled(Link, {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 20px',
  borderRadius: '10px',
  border: '1px solid var(--mcoe-border-default)',
  textDecoration: 'none',
  color: 'inherit',
  fontSize: '14px',
  fontWeight: 500,
  background: 'var(--ifm-background-surface-color)',
  transition: 'border-color 0.15s ease',
  '&:hover': {
    color: 'inherit',
    textDecoration: 'none',
    borderColor: 'var(--mcoe-brand-primary)',
  },
});

const LinkRight = styled('span', {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  color: 'var(--ifm-color-emphasis-400)',
  fontSize: '16px',
});

const links = [
  { label: 'Getting Started with Rollouts', href: '/developers/release-management/getting-started' },
  { label: 'Migrating GitHub CI to Bitrise', href: '/developers/mobile-ci/migrate-github-to-bitrise' },
  { label: 'Rollout Key Concepts', href: '/developers/release-management/pipeline-overview' },
  { label: 'Version Stages', href: '/developers/release-management/versions/pipeline-stages/release-candidate', tag: 'Popular' },
  { label: 'Contributing to Rollouts', href: '/developers/contributing/rollouts', tag: 'New' },
  { label: 'Bitrise Platform', href: '/developers/bitrise-platform/' },
];

export function QuickLinks() {
  return (
    <Wrapper>
      <SectionEyebrow>Popular Pages</SectionEyebrow>
      <Grid>
        {links.map((lnk, i) => (
          <QuickLink
            key={lnk.label}
            to={lnk.href}
            data-analytics-surface="home.quick_links"
            data-analytics-label={lnk.label}
            data-analytics-position={i}
            data-analytics-type="link"
          >
            <span>{lnk.label}</span>
            <LinkRight>
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
                    background: lnk.tag === 'New' ? 'var(--mcoe-brand-accent)' : 'var(--mcoe-brand-primary)',
                  }}
                >
                  {lnk.tag}
                </span>
              )}
              ›
            </LinkRight>
          </QuickLink>
        ))}
      </Grid>
    </Wrapper>
  );
}
