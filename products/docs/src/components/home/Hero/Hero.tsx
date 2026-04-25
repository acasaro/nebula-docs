import Link from '@docusaurus/Link';
import { styled } from '@site/src/lib/styled';

const HeroWrapper = styled('div', {
  position: 'relative',
  overflow: 'hidden',
  padding: '80px 48px',
  backgroundImage: 'url(/images/landing/overview-hero-background.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  '@media (max-width: 996px)': { padding: '48px 24px' },
});

const HeroInner = styled('div', {
  maxWidth: '960px',
  margin: '0 auto',
  position: 'relative',
  zIndex: 1,
});

const Eyebrow = styled('div', {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 16px',
  borderRadius: '100px',
  background: 'rgba(0, 38, 119, 0.08)',
  border: '1px solid rgba(0, 38, 119, 0.15)',
  marginBottom: '24px',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--mcoe-brand-display)',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
});

const EyebrowDot = styled('span', {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: 'var(--mcoe-brand-primary)',
  boxShadow: '0 0 8px rgba(0, 38, 119, 0.4)',
});

const Title = styled('h1', {
  fontSize: 'clamp(32px, 5vw, 52px)',
  fontWeight: 700,
  color: 'var(--mcoe-brand-display)',
  lineHeight: 1.1,
  marginBottom: '16px',
  letterSpacing: '-0.02em',
});

const Accent = styled('span', {
  color: 'var(--mcoe-brand-primary-light)',
});

const Subtitle = styled('p', {
  fontSize: '18px',
  color: 'var(--mcoe-text-secondary)',
  lineHeight: 1.6,
  marginBottom: '32px',
  maxWidth: '560px',
});

const CtaRow = styled('div', {
  display: 'flex',
  gap: '12px',
});

const CtaPrimary = styled(Link, {
  padding: '14px 28px',
  borderRadius: '10px',
  background: 'var(--mcoe-brand-primary)',
  color: '#fff',
  fontSize: '15px',
  fontWeight: 700,
  textDecoration: 'none',
  '&:hover': { opacity: 0.9, color: '#fff' },
});

const CtaSecondary = styled(Link, {
  padding: '14px 28px',
  borderRadius: '10px',
  background: 'rgba(0, 38, 119, 0.08)',
  border: '1px solid rgba(0, 38, 119, 0.2)',
  color: 'var(--mcoe-brand-display)',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  '&:hover': { background: 'rgba(0, 38, 119, 0.12)', color: 'var(--mcoe-brand-primary)' },
});

export function Hero() {
  return (
    <HeroWrapper>
      <HeroInner>
        <Eyebrow>
          <EyebrowDot />
          Mobile Center of Excellence
        </Eyebrow>
        <Title>
          The Standard for <Accent>Mobile Engineering</Accent>
        </Title>
        <Subtitle>
          Your team's single source of truth for CI/CD pipelines, release management,
          code signing, and everything mobile. Built by engineers, for engineers.
        </Subtitle>
        <CtaRow>
          <CtaPrimary
            to="/developers/"
            data-analytics-surface="home.hero"
            data-analytics-label="Get Started"
            data-analytics-position={0}
            data-analytics-type="cta"
          >
            Get Started →
          </CtaPrimary>
          <CtaSecondary
            to="/developers/release-management/getting-started"
            data-analytics-surface="home.hero"
            data-analytics-label="Rollouts Guide"
            data-analytics-position={1}
            data-analytics-type="cta"
          >
            Rollouts Guide
          </CtaSecondary>
        </CtaRow>
      </HeroInner>
    </HeroWrapper>
  );
}
