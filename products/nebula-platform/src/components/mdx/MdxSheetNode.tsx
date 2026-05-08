import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  Sheet,
  Icon,
  SHEET_COLORS,
  type SheetColor,
  type IconLibrary,
  type IconType,
} from '@nebula-docs/components';
import { cn } from '@/lib/utils';

const SHEET_COLOR_SET: ReadonlySet<string> = new Set(SHEET_COLORS);

function isSheetColor(value: unknown): value is SheetColor {
  return typeof value === 'string' && SHEET_COLOR_SET.has(value);
}

const ATTRS = ['color', 'label', 'icon', 'iconLibrary', 'iconType'] as const;

export const MdxSheet = Node.create({
  name: 'mdxSheet',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-sheet]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-sheet': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxSheetView);
  },
});

function MdxSheetView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as {
    color?: string | null;
    label?: string | null;
    icon?: string | null;
    iconLibrary?: IconLibrary | null;
    iconType?: IconType | null;
  };

  const color: SheetColor = isSheetColor(attrs.color) ? attrs.color : 'blue';
  const label = attrs.label ?? undefined;

  const iconElement = attrs.icon ? (
    <Icon
      icon={attrs.icon}
      iconLibrary={attrs.iconLibrary ?? undefined}
      iconType={attrs.iconType ?? undefined}
      size={30}
    />
  ) : undefined;

  return (
    <NodeViewWrapper
      data-mdx-sheet=""
      className={cn(
        'my-4',
        selected && 'rounded-lg ring-2 ring-primary/40',
      )}
    >
      <Sheet color={color} icon={iconElement} label={label} className="my-0">
        <NodeViewContent />
      </Sheet>
    </NodeViewWrapper>
  );
}
