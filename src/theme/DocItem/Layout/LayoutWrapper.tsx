import React, { type ReactNode, useEffect } from 'react';
import Layout from '@theme-original/DocItem/Layout';
import type { WrapperProps } from '@docusaurus/types';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { styled } from '../../../lib/styled';

type Props = WrapperProps<typeof Layout>;

const DocWrapper = styled("div", {
  position: "relative", padding: "16px",
});

const bannerBase = {
  padding: "12px 20px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 500,
  marginBottom: "16px",
  color: "var(--ifm-font-color-base)",
} as const;

const DraftBanner = styled("div", {
  ...bannerBase,
  background: "color-mix(in srgb, var(--mcoe-warning) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--mcoe-warning) 30%, transparent)",
});

const DeprecatedBanner = styled("div", {
  ...bannerBase,
  background: "color-mix(in srgb, var(--mcoe-error) 12%, transparent)",
  border: "1px solid color-mix(in srgb, var(--mcoe-error) 30%, transparent)",
});

const DocMeta = styled("div", {
  display: "flex",
  justifyContent: "flex-end",
  paddingTop: "16px",
  marginTop: "24px",
  borderTop: "1px solid var(--ifm-color-emphasis-200)",
});

const EditLink = styled("a", {
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--mcoe-text-link)",
  textDecoration: "none",
  '&:hover': { textDecoration: "underline" },
});

export default function LayoutWrapper(props: Props): ReactNode {
  const { metadata, frontMatter } = useDoc();
  const isDraft = frontMatter.draft === true;
  const isDeprecated = (frontMatter as Record<string, unknown>).deprecated === true;
  const isLandingPage = (frontMatter as Record<string, unknown>).className === 'landing-page';

  useEffect(() => {
    if (!isLandingPage) return;
    const container = document.querySelector('main .container.padding-top--md');
    if (container) {
      container.classList.remove('padding-top--md', 'padding-bottom--lg');
    }
    return () => {
      if (container) {
        container.classList.add('padding-top--md', 'padding-bottom--lg');
      }
    };
  }, [isLandingPage]);

  return (
    <DocWrapper data-landing={isLandingPage || undefined} style={isLandingPage ? { padding: 0 } : undefined}>
      {isDraft && <DraftBanner>This document is a draft and may be incomplete.</DraftBanner>}
      {isDeprecated && <DeprecatedBanner>This document is deprecated and may no longer be accurate.</DeprecatedBanner>}
      <Layout {...props} />
      {!isLandingPage && metadata.editUrl && (
        <DocMeta>
          <EditLink href={metadata.editUrl} target="_blank" rel="noopener noreferrer">
            Edit this page
          </EditLink>
        </DocMeta>
      )}
    </DocWrapper>
  );
}
