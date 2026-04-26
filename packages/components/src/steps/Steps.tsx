import {
  Children,
  cloneElement,
  isValidElement,
  type ReactNode,
} from 'react';
import { cn } from '../utils/cn';
import type { StepProps, StepTitleSize } from '../step/Step';

export interface StepsProps {
  titleSize?: StepTitleSize;
  className?: string;
  children?: ReactNode;
}

/**
 * Mintlify-style Steps container. Iterates children, injecting `stepNumber`
 * and `isLast` into each via `cloneElement`. Children are expected to be
 * `<Step>` elements (or anything that accepts those props).
 */
export function Steps({ titleSize, className, children }: StepsProps) {
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <div
      role="list"
      className={cn('mt-10 mb-6 ml-3.5', className)}
      data-component-part="steps"
    >
      {items.map((child, i) => {
        const props = (child.props ?? {}) as StepProps;
        return cloneElement(child as React.ReactElement<StepProps>, {
          key: child.key ?? i,
          stepNumber: props.stepNumber ?? i + 1,
          isLast: i === items.length - 1,
          titleSize: props.titleSize ?? titleSize,
        });
      })}
    </div>
  );
}
