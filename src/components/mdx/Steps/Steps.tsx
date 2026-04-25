import React, { Children, type ReactNode, type ReactElement } from 'react';
import { styled } from '@site/src/lib/styled';

const StepsContainer = styled('div', {
  margin: '40px 0 24px 14px',
  position: 'relative',
});

const StepLayout = styled('div', {
  display: 'flex',
  alignItems: 'flex-start',
});

const StepIndicator = styled('div', {
  flexShrink: 0,
  position: 'relative',
  zIndex: 1,
});

const StepCircle = styled('div', {
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

const StepContentArea = styled('div', {
  paddingLeft: '16px',
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
});

const StepBody = styled('div', {
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

interface StepProps {
  title: string;
  titleSize?: 'p' | 'h2' | 'h3' | 'h4';
  icon?: ReactNode;
  stepNumber?: number;
  children?: ReactNode;
}

export function Step({ title, titleSize = 'h3', icon, stepNumber, children }: StepProps) {
  const TitleTag = titleSize === 'p' ? 'p' : titleSize;
  const hasContent = Children.count(children) > 0;

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

interface StepsProps {
  titleSize?: 'p' | 'h2' | 'h3' | 'h4';
  children: ReactNode;
}

export function Steps({ titleSize, children }: StepsProps) {
  const steps = Children.toArray(children).filter(
    (child): child is ReactElement => React.isValidElement(child),
  );

  return (
    <StepsContainer>
      {steps.map((child, i) => {
        const isLast = i === steps.length - 1;
        const hasContent = Children.count(child.props.children) > 0;
        const showConnector = !isLast || (isLast && hasContent);
        const fade = isLast && hasContent;

        return (
          <div key={i} style={{ position: 'relative', paddingBottom: isLast ? 0 : '20px' }}>
            {showConnector && (
              <div
                style={{
                  position: 'absolute',
                  top: '32px',
                  left: '13px',
                  width: '1px',
                  height: 'calc(100% - 32px)',
                  background: fade
                    ? 'linear-gradient(to bottom, var(--ifm-color-emphasis-200) 0%, var(--ifm-color-emphasis-200) 80%, transparent 100%)'
                    : 'var(--mcoe-border-default)',
                }}
              />
            )}
            {React.cloneElement(child, {
              stepNumber: child.props.stepNumber ?? i + 1,
              titleSize: child.props.titleSize ?? titleSize,
            })}
          </div>
        );
      })}
    </StepsContainer>
  );
}
