import { useRef, useState } from 'react';
import { ChevronDown, EllipsisVertical, Plus } from 'lucide-react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Icon, type IconLibrary, type IconType } from '@nebula/components';
import { IconPickerPopover, type IconValue } from '@/components/IconField';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import {
  accordionGroupSchema,
  accordionSchema,
} from '@/lib/blockSchemas/accordion';
import { cn } from '@/lib/utils';

const ACCORDION_ATTRS = [
  'title',
  'description',
  'defaultOpen',
  'icon',
  'iconLibrary',
  'iconType',
] as const;

export const MdxAccordionGroup = Node.create({
  name: 'mdxAccordionGroup',
  group: 'block',
  content: 'mdxAccordion+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-mdx-accordion-group]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-accordion-group': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxAccordionGroupView);
  },
});

export const MdxAccordion = Node.create({
  name: 'mdxAccordion',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      ACCORDION_ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-accordion]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-accordion': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxAccordionView);
  },
});

function MdxAccordionGroupView({
  node,
  selected,
  editor,
  getPos,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const [attrOpen, setAttrOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const appendAccordion = () => {
    if (typeof getPos !== 'function' || !editor.isEditable) return;
    const pos = getPos();
    if (pos == null) return;
    const insertAt = pos + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: 'mdxAccordion',
        content: [{ type: 'paragraph' }],
      })
      .setTextSelection(insertAt + 2)
      .run();
  };

  return (
    <NodeViewWrapper
      data-mdx-accordion-group=""
      className={cn(
        'group/agroup relative my-4 overflow-hidden rounded-2xl border border-stone-200/70 dark:border-white/10',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      <div ref={wrapperRef}>
        <NodeViewContent />
      </div>
      {editor.isEditable ? (
        <div
          contentEditable={false}
          className="border-t border-stone-200/70 px-4 py-2 dark:border-white/10"
        >
          <button
            type="button"
            onClick={appendAccordion}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            <Plus className="size-4" />
            Add accordion
          </button>
        </div>
      ) : null}

      <div contentEditable={false} className="absolute right-2 top-2 z-10">
        <button
          type="button"
          aria-label="Edit accordion group attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/agroup:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
      </div>

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={wrapperRef.current}
        title={accordionGroupSchema.title}
        titleIcon={accordionGroupSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={accordionGroupSchema}
          values={node.attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}

function MdxAccordionView({
  node,
  selected,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as {
    title?: string | null;
    description?: string | null;
    defaultOpen?: boolean | null;
    icon?: string | null;
    iconLibrary?: IconLibrary | null;
    iconType?: IconType | null;
  };

  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [attrOpen, setAttrOpen] = useState(false);
  const accordionRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const iconValue: IconValue = {
    icon: attrs.icon ?? undefined,
    iconLibrary: attrs.iconLibrary ?? undefined,
    iconType: attrs.iconType ?? undefined,
  };

  return (
    <NodeViewWrapper
      data-mdx-accordion=""
      className={cn(
        'group/accordion relative my-3 overflow-hidden rounded-2xl border border-stone-200/70 bg-white dark:border-white/10 dark:bg-stone-900/40',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      <div
        ref={accordionRef}
        className="flex items-start gap-3 border-b border-stone-100 px-6 py-4 dark:border-white/5"
      >
        <ChevronDown
          aria-hidden="true"
          className="mt-1 size-4 shrink-0 text-stone-400 dark:text-stone-500"
        />

        <IconPickerPopover
          open={iconPickerOpen}
          onOpenChange={setIconPickerOpen}
          value={iconValue}
          onChange={(next) =>
            updateAttributes({
              icon: next.icon ?? null,
              iconLibrary: next.iconLibrary ?? null,
              iconType: next.iconType ?? null,
            })
          }
        >
          <div contentEditable={false}>
            <button
              type="button"
              aria-expanded={iconPickerOpen}
              aria-label={attrs.icon ? 'Change icon' : 'Add icon'}
              onMouseDown={stopPm}
              className={cn(
                'relative mt-0.5 flex size-5 items-center justify-center text-stone-700 dark:text-stone-200',
                'after:absolute after:inset-[-3px] after:rounded after:bg-stone-100 after:opacity-0 hover:after:opacity-100 aria-expanded:after:opacity-100 dark:after:bg-stone-800',
              )}
            >
              {attrs.icon ? (
                <span className="relative z-10">
                  <Icon
                    icon={attrs.icon}
                    iconLibrary={attrs.iconLibrary ?? undefined}
                    iconType={attrs.iconType ?? undefined}
                    size={16}
                  />
                </span>
              ) : null}
            </button>
          </div>
        </IconPickerPopover>

        <div className="min-w-0 flex-1">
          <input
            value={attrs.title ?? ''}
            placeholder="Accordion title"
            onChange={(e) =>
              updateAttributes({ title: e.target.value || null })
            }
            onClick={stopPm}
            onMouseDown={stopPm}
            className="not-prose w-full border-0 bg-transparent p-0 text-sm font-semibold text-stone-900 outline-none placeholder:text-muted-foreground/55 dark:text-stone-100"
          />
          {attrs.description != null && attrs.description !== '' ? (
            <input
              value={attrs.description}
              placeholder="Description"
              onChange={(e) =>
                updateAttributes({ description: e.target.value || null })
              }
              onClick={stopPm}
              onMouseDown={stopPm}
              className="not-prose mt-0.5 w-full border-0 bg-transparent p-0 text-xs text-stone-500 outline-none placeholder:text-muted-foreground/55 dark:text-stone-400"
            />
          ) : null}
        </div>
      </div>

      <div className="px-6 py-3 text-stone-700 dark:text-stone-300">
        <NodeViewContent />
      </div>

      <div contentEditable={false} className="absolute right-3 top-3 z-10">
        <button
          type="button"
          aria-label="Edit accordion attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/accordion:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
      </div>

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={accordionRef.current}
        title={accordionSchema.title}
        titleIcon={accordionSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={accordionSchema}
          values={attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
