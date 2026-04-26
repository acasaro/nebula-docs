import styled from '@emotion/styled';
import type { ReactNode } from 'react';

export const StepLayout = styled.div({
  display: 'flex',
  alignItems: 'flex-start',
});

export const StepIndicator = styled.div({
  flexShrink: 0,
  position: 'relative',
  zIndex: 1,
});

export const StepCircle = styled.div({
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: 'var(--ifm-color-emphasis-200)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--ifm-font-color-base)',
  '[data-theme="dark"] &': { background: 'rgba(255, 255, 255, 0.1)' },
});

export const StepContentArea = styled.div({
  paddingLeft: '16px',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
});

export const StepBody = styled.div({
  marginTop: '8px',
  fontSize: '14px',
  lineHeight: 1.7,
  color: 'var(--ifm-color-emphasis-700)',
  '& > *:last-child': { marginBottom: 0 },
  '& img': { maxWidth: '680px', margin: '12px 0' },
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    marginTop: 0,
    paddingTop: 0,
    borderTop: 'none',
  },
});

export type StepTitleSize = 'p' | 'h2' | 'h3' | 'h4';

export interface StepNaturalProps {
  title: string;
  titleSize?: StepTitleSize;
  icon?: ReactNode;
  stepNumber?: number;
  children?: ReactNode;
}

export function Step({
  title,
  titleSize = 'h3',
  icon,
  stepNumber,
  children,
}: StepNaturalProps) {
  const TitleTag = titleSize === 'p' ? 'p' : titleSize;
  const hasContent = children !== null && children !== undefined && children !== false;

  return (
    <StepLayout>
      <StepIndicator>
        <StepCircle>{icon ?? stepNumber}</StepCircle>
      </StepIndicator>
      <StepContentArea>
        <TitleTag
          style={{
            marginTop: 0,
            marginBottom: 0,
            paddingTop: 0,
            paddingBottom: 0,
            fontSize: titleSize === 'p' ? '15px' : '16px',
            fontWeight: 600,
            lineHeight: 1.5,
            color: 'var(--ifm-font-color-base)',
            borderTop: 'none',
          }}
        >
          {title}
        </TitleTag>
        {hasContent && <StepBody>{children}</StepBody>}
      </StepContentArea>
    </StepLayout>
  );
}
