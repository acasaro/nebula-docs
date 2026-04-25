import type { ReactNode } from 'react';
import type { Block } from '@mcoe/schemas';
import { getBlockComponent } from '@mcoe/blocks';

export interface BlockRendererProps {
  blocks: Block[] | undefined;
}

function renderChildren(blocks: Block[] | undefined): ReactNode {
  if (!blocks || blocks.length === 0) return null;
  return blocks.map((block) => <BlockNode key={block.id} block={block} />);
}

function BlockNode({ block }: { block: Block }) {
  const Component = getBlockComponent(block);
  const childrenNodes =
    'children' in block && block.children ? renderChildren(block.children) : null;
  return (
    <Component block={block} renderChildren={renderChildren}>
      {childrenNodes}
    </Component>
  );
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  return <>{renderChildren(blocks)}</>;
}
