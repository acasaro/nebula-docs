import React, { type ReactNode } from 'react';
import Logo from '@theme-original/Logo';
import type { WrapperProps } from '@docusaurus/types';
import { styled } from '../../lib/styled';

type Props = WrapperProps<typeof Logo>;

const LogoWrap = styled("div", {
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

const Version = styled("span", {
  fontSize: "10px",
  fontWeight: 600,
  padding: "1px 6px",
  borderRadius: "4px",
  background: "var(--ifm-color-emphasis-100)",
  color: "var(--ifm-color-emphasis-600)",
  letterSpacing: "0.3px",
});

export default function LogoWrapper(props: Props): ReactNode {
  return (
    <LogoWrap>
      <Logo {...props} />
      <Version>v0.1</Version>
    </LogoWrap>
  );
}
