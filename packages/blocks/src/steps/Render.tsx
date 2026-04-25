import type { Block, StepBlock, StepsBlock } from '@mcoe/schemas';
import type { BlockComponentProps } from '../registry';
import { Step } from '../step/Step';
import { Icon } from '../icon/Icon';
import { StepsContainer } from './Steps';

/**
 * Block-API renderer for `steps`. Walks `block.children` directly (not the
 * pre-rendered `children` prop) so it can inject step numbers and the
 * connector line at the right indices. Uses `renderChildren` from the
 * registry to recursively render each step's body.
 */
export function StepsRender({
  block,
  renderChildren,
}: BlockComponentProps<StepsBlock>) {
  const steps = (block.children ?? []).filter(
    (b): b is StepBlock => b.type === 'step'
  );

  return (
    <StepsContainer>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const stepBody: Block[] = step.children ?? [];
        const hasContent = stepBody.length > 0;
        const showConnector = !isLast || (isLast && hasContent);
        const fade = isLast && hasContent;

        const iconElement = step.props.icon ? (
          <Icon
            icon={step.props.icon}
            iconLibrary={step.props.iconLibrary}
            size={14}
          />
        ) : undefined;

        return (
          <div
            key={step.id}
            style={{ position: 'relative', paddingBottom: isLast ? 0 : '20px' }}
          >
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
            <Step
              title={step.props.title}
              titleSize={step.props.titleSize ?? block.props.titleSize}
              icon={iconElement}
              stepNumber={i + 1}
            >
              {renderChildren?.(step.children)}
            </Step>
          </div>
        );
      })}
    </StepsContainer>
  );
}
