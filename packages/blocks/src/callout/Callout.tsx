import styled from '@emotion/styled';
import type { ReactNode } from 'react';
import type { CalloutBlock } from '@mcoe/schemas';

type Variant = CalloutBlock['props']['variant'];

const PALETTE: Record<Variant, { bg: string; border: string; text: string }> = {
  info: { bg: '#e3f2fd', border: '#2196f3', text: '#0d47a1' },
  check: { bg: '#e8f5e9', border: '#4caf50', text: '#1b5e20' },
  tip: { bg: '#f3e5f5', border: '#9c27b0', text: '#4a148c' },
  warning: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
  danger: { bg: '#ffebee', border: '#f44336', text: '#b71c1c' },
};

const CalloutBox = styled('aside')<{ variant: Variant }>`
  border-left: 4px solid ${(p) => PALETTE[p.variant].border};
  background: ${(p) => PALETTE[p.variant].bg};
  color: ${(p) => PALETTE[p.variant].text};
  padding: 16px 20px;
  border-radius: 4px;
  margin: 16px 0;

  & > :first-of-type {
    margin-top: 0;
  }
  & > :last-child {
    margin-bottom: 0;
  }
`;

const CalloutTitle = styled('div')`
  font-weight: 600;
  margin-bottom: 8px;
`;

export interface CalloutProps {
  block: CalloutBlock;
  children?: ReactNode;
}

export function Callout({ block, children }: CalloutProps) {
  return (
    <CalloutBox variant={block.props.variant}>
      {block.props.title ? <CalloutTitle>{block.props.title}</CalloutTitle> : null}
      {children}
    </CalloutBox>
  );
}
