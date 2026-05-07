import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { EllipsisVertical } from 'lucide-react';
import { useRef, useState } from 'react';
import { Profile } from '@nebula-docs/components';
import { AttributesForm } from '@/components/AttributesForm';
import { AttributesPopover } from '@/components/AttributesPopover';
import { profileSchema } from '@/lib/blockSchemas/profile';
import { cn } from '@/lib/utils';

/**
 * Atomic block node for `<Profile>`. The node view renders the runtime
 * `Profile` component directly so the editor preview is pixel-identical
 * to the published page.
 */
export const MdxProfile = Node.create({
  name: 'mdxProfile',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      name: { default: 'New profile' },
      title: { default: null },
      photo: { default: null },
      href: { default: null },
      initials: { default: null },
      accent: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-profile]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-profile': '' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxProfileView);
  },
});

interface ProfileAttrs {
  name: string;
  title: string | null;
  photo: string | null;
  href: string | null;
  initials: string | null;
  accent: string | null;
}

function MdxProfileView({
  node,
  selected,
  editor,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as ProfileAttrs;
  const [attrOpen, setAttrOpen] = useState(false);
  const kebabRef = useRef<HTMLButtonElement>(null);

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper
      data-mdx-profile=""
      className="my-4 flex justify-center"
    >
      <div
        className={cn(
          'group/profile relative inline-flex',
          selected && 'rounded-2xl outline outline-2 outline-primary/60',
        )}
      >
        <Profile
          name={attrs.name || 'New profile'}
          title={attrs.title ?? undefined}
          photo={attrs.photo ?? undefined}
          initials={attrs.initials ?? undefined}
          accent={attrs.accent ?? undefined}
          // Suppress the link wrapper inside the editor — clicking the
          // photo to navigate would yank the user out of the page mid-edit.
          // The `href` round-trips through the source unchanged.
        />
        {editor.isEditable ? (
          <div
            contentEditable={false}
            className={cn(
              'pointer-events-none absolute -right-2 -top-2 transition-opacity',
              attrOpen ? 'opacity-100' : 'opacity-0 group-hover/profile:opacity-100',
            )}
          >
            <button
              ref={kebabRef}
              type="button"
              aria-label="Profile options"
              onMouseDown={stopPm}
              onClick={(e) => {
                stopPm(e);
                setAttrOpen(true);
              }}
              className="pointer-events-auto flex size-7 items-center justify-center rounded-full bg-black/70 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/85"
            >
              <EllipsisVertical className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>
      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={kebabRef.current}
        title={profileSchema.title}
        titleIcon={profileSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={profileSchema}
          values={node.attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
