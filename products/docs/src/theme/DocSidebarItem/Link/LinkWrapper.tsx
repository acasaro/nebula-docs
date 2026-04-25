import React, { type ReactNode } from 'react';
import Link from '@theme-original/DocSidebarItem/Link';
import type { WrapperProps } from '@docusaurus/types';
import emotionStyled from '@emotion/styled';

type Props = WrapperProps<typeof Link>;

const badgeBase = {
  position: 'absolute' as const,
  right: '8px',
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: '9px',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  padding: '2px 6px',
  borderRadius: '4px',
  color: '#fff',
  pointerEvents: 'none' as const,
};

const badgeColors: Record<string, string> = {
  new: 'var(--mcoe-brand-accent)',
  beta: 'var(--mcoe-info)',
  deprecated: 'var(--mcoe-error)',
  default: 'var(--ifm-color-emphasis-600)',
};

const SidebarBadge = emotionStyled.span<{ variant: string }>(({ variant }) => ({
  ...badgeBase,
  background: badgeColors[variant] || badgeColors.default,
}));

export default function LinkWrapper(props: Props): ReactNode {
  const { item } = props;
  const customProps = item.customProps as Record<string, unknown> | undefined;

  if (customProps?.isHidden) {
    return null;
  }

  const badge = customProps?.badge as string | undefined;
  const badgeType = badge === 'new' ? 'new'
    : badge === 'beta' ? 'beta'
    : badge === 'deprecated' ? 'deprecated'
    : 'default';

  const label = typeof item.label === 'string' ? item.label : undefined;

  if (!badge) {
    return (
      <span
        data-analytics-surface="docs.sidebar"
        data-analytics-label={label}
        data-analytics-type="sidebar"
      >
        <Link {...props} />
      </span>
    );
  }

  return (
    <div
      style={{ position: 'relative' }}
      data-analytics-surface="docs.sidebar"
      data-analytics-label={label}
      data-analytics-type="sidebar"
    >
      <Link {...props} />
      <SidebarBadge variant={badgeType}>{badge}</SidebarBadge>
    </div>
  );
}
