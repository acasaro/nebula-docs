import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  CircleAlert,
  CircleCheck,
  Info as InfoIcon,
  Lightbulb,
  OctagonAlert,
  Pencil,
  TriangleAlert,
} from 'lucide-react';
import { Callout, type CalloutVariant } from '@nebula/components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const VARIANTS: ReadonlyArray<{
  value: CalloutVariant;
  label: string;
  Icon: typeof InfoIcon;
}> = [
  { value: 'info', label: 'Info', Icon: InfoIcon },
  { value: 'check', label: 'Check', Icon: CircleCheck },
  { value: 'note', label: 'Note', Icon: CircleAlert },
  { value: 'tip', label: 'Tip', Icon: Lightbulb },
  { value: 'warning', label: 'Warning', Icon: TriangleAlert },
  { value: 'danger', label: 'Danger', Icon: OctagonAlert },
  { value: 'custom', label: 'Custom', Icon: Pencil },
];

function isCalloutVariant(value: unknown): value is CalloutVariant {
  return (
    typeof value === 'string' &&
    VARIANTS.some((v) => v.value === value)
  );
}

export const MdxCallout = Node.create({
  name: 'mdxCallout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'note' as CalloutVariant,
        parseHTML: (el: HTMLElement) => {
          const v = el.getAttribute('data-variant');
          return isCalloutVariant(v) ? v : 'note';
        },
        renderHTML: (attrs: { variant: CalloutVariant }) => ({
          'data-variant': attrs.variant,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-callout': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxCalloutView);
  },
});

const NOTE_VARIANT = VARIANTS.find((v) => v.value === 'note')!;

function MdxCalloutView({ node, updateAttributes, selected }: NodeViewProps) {
  const variant = isCalloutVariant(node.attrs.variant)
    ? node.attrs.variant
    : 'note';
  const current = VARIANTS.find((v) => v.value === variant) ?? NOTE_VARIANT;
  const CurrentIcon = current.Icon;

  return (
    <NodeViewWrapper
      data-mdx-callout=""
      className={cn(
        'group relative my-4',
        selected && 'rounded-2xl ring-2 ring-primary/40',
      )}
    >
      <Callout variant={variant} className="my-0">
        <NodeViewContent />
      </Callout>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2',
            'flex items-center gap-1 rounded-md border bg-background px-2 py-1',
            'text-xs text-muted-foreground shadow-sm',
            'transition-opacity',
            'opacity-0 group-hover:opacity-100 focus:opacity-100',
            selected && 'opacity-100',
          )}
          aria-label={`Change callout variant (currently ${current.label})`}
          contentEditable={false}
        >
          <CurrentIcon className="size-3" />
          <span>{current.label}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={4}>
          <DropdownMenuLabel className="text-xs">Change to</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {VARIANTS.map(({ value, label, Icon }) => (
            <DropdownMenuItem
              key={value}
              onSelect={() => updateAttributes({ variant: value })}
              className={cn(
                'gap-2 text-sm',
                value === variant && 'bg-accent text-accent-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </NodeViewWrapper>
  );
}
