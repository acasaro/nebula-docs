import React, { Children, type ReactNode, type ReactElement } from 'react';
import styled from '@emotion/styled';
import type { StepTitleSize } from '../step/Step';

export const StepsContainer = styled.div({
  margin: '40px 0 24px 14px',
  position: 'relative',
});

export interface StepsNaturalProps {
  titleSize?: StepTitleSize;
  children: ReactNode;
}

/**
 * Natural-API Steps for MDX use. Auto-numbers child <Step> elements and draws
 * a connector line between them. Children must be Step elements.
 */
export function Steps({ titleSize, children }: StepsNaturalProps) {
  const steps = Children.toArray(children).filter(
    (child): child is ReactElement => React.isValidElement(child)
  );

  return (
    <StepsContainer>
      {steps.map((child, i) => {
        const isLast = i === steps.length - 1;
        const props = child.props as { children?: ReactNode; stepNumber?: number; titleSize?: StepTitleSize };
        const hasContent = Children.count(props.children) > 0;
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
              stepNumber: props.stepNumber ?? i + 1,
              titleSize: props.titleSize ?? titleSize,
            } as Partial<typeof props>)}
          </div>
        );
      })}
    </StepsContainer>
  );
}
