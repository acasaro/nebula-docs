import type { IconBlock } from '@mcoe/schemas';
import type { BlockComponentProps } from '../registry';
import { Icon } from './Icon';

export function IconRender({ block }: BlockComponentProps<IconBlock>) {
  return (
    <Icon
      icon={block.props.icon}
      color={block.props.color}
      size={block.props.size}
      iconLibrary={block.props.iconLibrary}
    />
  );
}
