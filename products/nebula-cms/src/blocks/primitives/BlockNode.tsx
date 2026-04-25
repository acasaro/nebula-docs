import type { ComponentType } from 'react';
import type { Block } from '@mcoe/schemas';
import { editorRegistry, type BlockEditorProps } from '../editors/registry';

export interface BlockNodeProps {
  block: Block;
  onChange: (block: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

/**
 * Generic block-tree node: looks up the right Editor in the registry and
 * renders it with the chrome controls passed through. The Editor itself owns
 * its inline-edit experience and decides whether to show a settings popover,
 * child-block slot, etc.
 */
export function BlockNode(props: BlockNodeProps) {
  const Editor = editorRegistry[props.block.type] as ComponentType<
    BlockEditorProps<typeof props.block>
  >;
  return <Editor {...props} block={props.block as never} />;
}
