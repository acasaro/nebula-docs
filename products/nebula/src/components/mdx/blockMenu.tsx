import { type ComponentType, type ReactNode } from 'react';
import {
  CircleAlert,
  CircleCheck,
  Copy,
  Info as InfoIcon,
  Lightbulb,
  OctagonAlert,
  Pencil,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { CalloutVariant } from '@nebula/components';
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

interface MenuContext {
  editor: Editor;
  node: ProseMirrorNode;
  pos: number;
}

export interface MenuActionItem {
  kind: 'item';
  label: string;
  Icon?: ComponentType<{ className?: string }>;
  onSelect: (ctx: MenuContext) => void;
  active?: boolean;
}

export interface MenuSubmenu {
  kind: 'submenu';
  label: string;
  Icon?: ComponentType<{ className?: string }>;
  items: MenuActionItem[];
}

export interface MenuSeparator {
  kind: 'separator';
}

export interface MenuLabel {
  kind: 'label';
  label: string;
}

export type MenuEntry =
  | MenuActionItem
  | MenuSubmenu
  | MenuSeparator
  | MenuLabel;

type MenuContributor = (ctx: MenuContext) => MenuEntry[];

const CALLOUT_VARIANTS: ReadonlyArray<{
  value: CalloutVariant;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { value: 'info', label: 'Info', Icon: InfoIcon },
  { value: 'check', label: 'Check', Icon: CircleCheck },
  { value: 'note', label: 'Note', Icon: CircleAlert },
  { value: 'tip', label: 'Tip', Icon: Lightbulb },
  { value: 'warning', label: 'Warning', Icon: TriangleAlert },
  { value: 'danger', label: 'Danger', Icon: OctagonAlert },
  { value: 'custom', label: 'Custom', Icon: Pencil },
];

const NODE_CONTRIBUTORS: Record<string, MenuContributor> = {
  mdxCallout: ({ node }) => {
    const currentVariant = node.attrs.variant as CalloutVariant;
    return [
      {
        kind: 'submenu',
        label: 'Change to',
        Icon: CALLOUT_VARIANTS.find((v) => v.value === currentVariant)?.Icon,
        items: CALLOUT_VARIANTS.map<MenuActionItem>(({ value, label, Icon }) => ({
          kind: 'item',
          label,
          Icon,
          active: value === currentVariant,
          onSelect: ({ editor, pos }) => {
            editor
              .chain()
              .focus()
              .setNodeSelection(pos)
              .updateAttributes('mdxCallout', { variant: value })
              .run();
          },
        })),
      },
    ];
  },
};

export function buildMenuEntries(ctx: MenuContext): MenuEntry[] {
  const contributor = NODE_CONTRIBUTORS[ctx.node.type.name];
  const contributed = contributor ? contributor(ctx) : [];
  const defaultActions: MenuEntry[] = [
    {
      kind: 'item',
      label: 'Duplicate',
      Icon: Copy,
      onSelect: ({ editor, node, pos }) => {
        editor
          .chain()
          .focus()
          .insertContentAt(pos + node.nodeSize, node.toJSON())
          .run();
      },
    },
    {
      kind: 'item',
      label: 'Delete',
      Icon: Trash2,
      onSelect: ({ editor, node, pos }) => {
        editor
          .chain()
          .focus()
          .deleteRange({ from: pos, to: pos + node.nodeSize })
          .run();
      },
    },
  ];
  if (contributed.length === 0) return defaultActions;
  return [...contributed, { kind: 'separator' }, ...defaultActions];
}

export function MenuEntries({
  entries,
  ctx,
}: {
  entries: MenuEntry[];
  ctx: MenuContext;
}): ReactNode {
  return entries.map((entry, i) => {
    switch (entry.kind) {
      case 'separator':
        return <DropdownMenuSeparator key={i} />;
      case 'label':
        return (
          <DropdownMenuLabel key={i} className="text-xs">
            {entry.label}
          </DropdownMenuLabel>
        );
      case 'submenu': {
        const Icon = entry.Icon;
        return (
          <DropdownMenuSub key={i}>
            <DropdownMenuSubTrigger className="gap-2">
              {Icon ? <Icon className="size-4" /> : null}
              {entry.label}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {entry.items.map((item, j) => {
                const ItemIcon = item.Icon;
                return (
                  <DropdownMenuItem
                    key={j}
                    onSelect={() => item.onSelect(ctx)}
                    className={item.active ? 'bg-accent' : undefined}
                  >
                    {ItemIcon ? <ItemIcon className="size-4" /> : null}
                    {item.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        );
      }
      case 'item': {
        const Icon = entry.Icon;
        return (
          <DropdownMenuItem
            key={i}
            onSelect={() => entry.onSelect(ctx)}
            className={entry.active ? 'bg-accent' : undefined}
          >
            {Icon ? <Icon className="size-4" /> : null}
            {entry.label}
          </DropdownMenuItem>
        );
      }
    }
  });
}
