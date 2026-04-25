import styled from '@emotion/styled';
import type { ReactNode } from 'react';

const Figure = styled.figure({
  margin: '16px 0',
  padding: 0,
});

const ImageWrapper = styled.div({
  borderRadius: '12px',
  border: '1px solid var(--mcoe-border-default)',
  overflow: 'hidden',
  background: 'var(--ifm-color-emphasis-100)',
  padding: '16px',
  '& img': {
    display: 'block',
    width: '100%',
    height: 'auto',
    objectFit: 'contain',
    borderRadius: '6px',
    margin: 0,
  },
});

const Caption = styled.figcaption({
  marginTop: '12px',
  marginBottom: '-4px',
  padding: '0 4px',
  fontSize: '13px',
  color: 'var(--ifm-color-emphasis-600)',
  textAlign: 'center',
});

export interface FrameNaturalProps {
  children: ReactNode;
  caption?: string;
}

export function Frame({ children, caption }: FrameNaturalProps) {
  return (
    <Figure>
      <ImageWrapper>
        {children}
        {caption && <Caption>{caption}</Caption>}
      </ImageWrapper>
    </Figure>
  );
}
