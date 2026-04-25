import Link from '@docusaurus/Link';
import { styled } from '@site/src/lib/styled';

const Wrapper = styled('div', {
  textAlign: 'center',
  padding: '32px',
  borderRadius: '16px',
  border: '1px solid var(--mcoe-border-default)',
  background: 'var(--ifm-background-surface-color)',
});

const Text = styled('p', {
  fontSize: '14px',
  color: 'var(--ifm-color-emphasis-600)',
  marginBottom: '4px',
});

const CtaLink = styled(Link, {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--mcoe-brand-primary)',
  textDecoration: 'none',
});

export function FooterCta() {
  return (
    <Wrapper>
      <Text>Can't find what you're looking for?</Text>
      <CtaLink
        to="https://support.bitrise.io"
        data-analytics-surface="home.footer_cta"
        data-analytics-label="Reach out to the MCoE team"
        data-analytics-type="cta"
      >
        Reach out to the MCoE team →
      </CtaLink>
    </Wrapper>
  );
}
