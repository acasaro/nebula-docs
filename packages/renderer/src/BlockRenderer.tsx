import type { Block } from '@mcoe/schemas';
import { getBlockComponent } from '@mcoe/blocks';

export interface BlockRendererProps {
  blocks: Block[] | undefined;
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <>
      {blocks.map((block) => (
        <BlockNode key={block.id} block={block} />
      ))}
    </>
  );
}

function BlockNode({ block }: { block: Block }) {
  const Component = getBlockComponent(block);
  const children =
    'children' in block && block.children && block.children.length > 0 ? (
      <BlockRenderer blocks={block.children} />
    ) : null;
  return <Component block={block}>{children}</Component>;
}
