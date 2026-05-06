import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * First-class image node for the editor. Atomic (no inner content) so the
 * caret skips over it cleanly. Round-trips with mdast `image` nodes — see
 * mdastToTiptap.ts and tiptapToMdx.ts.
 */
export const MdxImage = Node.create({
  name: 'mdxImage',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      title: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxImageView);
  },
});

function MdxImageView({ node, selected }: NodeViewProps) {
  const src = (node.attrs.src as string | null) ?? '';
  const alt = (node.attrs.alt as string | null) ?? '';
  const width = node.attrs.width as number | string | null;
  const height = node.attrs.height as number | string | null;
  const [broken, setBroken] = useState(false);

  return (
    <NodeViewWrapper
      data-mdx-image=''
      className={cn(
        'my-4 flex justify-center',
        selected && 'rounded-lg outline outline-2 outline-primary/60',
      )}>
      {!src ? (
        <div className='flex w-full items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 px-6 py-8 text-sm text-muted-foreground'>
          Image source is empty
        </div>
      ) : broken ? (
        <div className='flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 px-6 py-8 text-sm text-destructive'>
          <ImageOff className='size-4' />
          Image failed to load
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          width={width ?? undefined}
          height={height ?? undefined}
          onError={() => setBroken(true)}
          className='block h-auto max-w-full rounded-md'
          draggable={false}
        />
      )}
    </NodeViewWrapper>
  );
}
