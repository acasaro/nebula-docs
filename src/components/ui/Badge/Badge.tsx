import type { ReactNode } from 'react';
import { styled } from '@site/src/lib/styled';
import { resolveColor } from '@site/src/lib/tokens';

const BadgeBase = styled('span', {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '11px',
  fontWeight: 600,
  padding: '3px 10px',
  borderRadius: '100px',
  color: '#fff',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

type BadgeVariant = 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = 'primary' }: BadgeProps) {
  return <BadgeBase style={{ background: resolveColor(variant) }}>{children}</BadgeBase>;
}
