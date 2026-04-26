import type { CalloutBlock } from '@nebula/schemas';
import type { BlockComponentProps } from '../registry';
import { Callout } from './Callout';

export function CalloutRender({
  block,
  children,
}: BlockComponentProps<CalloutBlock>) {
  return (
    <Callout
      variant={block.props.variant}
      title={block.props.title}
      icon={block.props.icon}
      iconLibrary={block.props.iconLibrary}
      color={block.props.color}
    >
      {children}
    </Callout>
  );
}
