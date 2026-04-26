import type { StepBlock } from '@nebula/schemas';
import type { BlockComponentProps } from '../registry';
import { Step } from './Step';
import { Icon } from '../icon/Icon';

export function StepRender({ block, children }: BlockComponentProps<StepBlock>) {
  const iconElement = block.props.icon ? (
    <Icon
      icon={block.props.icon}
      iconLibrary={block.props.iconLibrary}
      size={14}
    />
  ) : undefined;

  return (
    <Step
      title={block.props.title}
      titleSize={block.props.titleSize}
      icon={iconElement}
    >
      {children}
    </Step>
  );
}
