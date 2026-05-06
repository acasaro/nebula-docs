import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Frame } from '@nebula-docs/components';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export const MdxFrame = Node.create({
  name: 'mdxFrame',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      caption: { default: null },
      title: { default: null },
      src: { default: null },
      alt: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-frame]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-frame': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxFrameView);
  },
});

function MdxFrameView({ node, selected }: NodeViewProps) {
  const caption = (node.attrs.caption as string | null) ?? undefined;
  const title = (node.attrs.title as string | null) ?? undefined;
  const src = (node.attrs.src as string | null) ?? undefined;
  const alt = (node.attrs.alt as string | null) ?? undefined;
  const width = node.attrs.width as number | string | null;
  const height = node.attrs.height as number | string | null;
  const [broken, setBroken] = useState(false);

  return (
    <NodeViewWrapper
      data-mdx-frame=''
      className={cn(
        'my-4',
        selected && 'rounded-2xl ring-2 ring-primary/40',
      )}>
      <Frame caption={caption} title={title}>
        {src ? (
          broken ? (
            <div className='flex items-center gap-2 px-6 py-8 text-sm text-muted-foreground'>
              <ImageOff className='size-4' />
              Image failed to load
            </div>
          ) : (
            <img
              src={src}
              alt={alt ?? caption ?? title ?? ''}
              width={width ?? undefined}
              height={height ?? undefined}
              onError={() => setBroken(true)}
              className='block h-auto max-w-full'
              draggable={false}
            />
          )
        ) : null}
        <NodeViewContent
          // Hide the inner editable surface when src is set — the caption goes
          // on the Frame's `caption` attr, not the children. Empty paragraph
          // children would otherwise stack a blank editable line under the
          // image.
          className={cn(src && 'hidden')}
        />
      </Frame>
    </NodeViewWrapper>
  );
}
