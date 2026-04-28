import { useRef, useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  Icon,
  type IconLibrary,
  type IconType,
} from '@nebula-docs/components';
import { ArrowRight, ArrowUpRight, EllipsisVertical } from 'lucide-react';
import { IconPickerPopover, type IconValue } from '@/components/IconField';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { cardSchema } from '@/lib/blockSchemas/card';
import { cn } from '@/lib/utils';

const ATTRS = [
  'title',
  'icon',
  'iconLibrary',
  'iconType',
  'img',
  'href',
  'cta',
  'horizontal',
  'arrow',
] as const;

export const MdxCard = Node.create({
  name: 'mdxCard',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-card]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-card': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxCardView);
  },
});

function MdxCardView({ node, selected, updateAttributes, deleteNode }: NodeViewProps) {
  const attrs = node.attrs as {
    title?: string | null;
    icon?: string | null;
    iconLibrary?: IconLibrary | null;
    iconType?: IconType | null;
    img?: string | null;
    href?: string | null;
    cta?: string | null;
    horizontal?: boolean | null;
    arrow?: boolean | null;
  };

  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [attrOpen, setAttrOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const iconValue: IconValue = {
    icon: attrs.icon ?? undefined,
    iconLibrary: attrs.iconLibrary ?? undefined,
    iconType: attrs.iconType ?? undefined,
  };

  const isExternalHref = attrs.href
    ? /^[a-z]+:\/\//i.test(attrs.href) || attrs.href.startsWith('//')
    : false;
  const showArrow = (attrs.arrow ?? isExternalHref) && !!attrs.href;

  const imageAlt = attrs.img
    ? (attrs.img.match(/\/([^/]+)\.[^.]+$/)?.[1] ?? '')
    : '';

  return (
    <NodeViewWrapper
      data-mdx-card=""
      className="relative my-2 group/card"
    >
      {/* Card shell */}
      <div
        ref={cardRef}
        className={cn(
          'relative block w-full overflow-hidden rounded-2xl border border-stone-950/10 bg-white font-normal ring-2 dark:border-white/10 dark:bg-stone-900/40',
          selected ? 'ring-primary/40' : 'ring-transparent',
        )}
      >
        {attrs.img ? (
          <img
            alt={imageAlt}
            src={attrs.img}
            className="not-prose w-full object-cover object-center"
            data-component-part="card-image"
          />
        ) : null}

        <div
          className={cn(
            'relative px-6 py-5',
            attrs.horizontal && 'flex items-center gap-x-4',
          )}
          data-component-part="card-content-container"
        >
          {showArrow ? (
            <div
              aria-hidden="true"
              className="absolute right-5 top-5 text-stone-400 dark:text-stone-500"
              data-component-part="card-arrow"
            >
              <ArrowUpRight className="size-4" />
            </div>
          ) : null}

          {/* Editable icon */}
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
            <div data-component-part="editable-icon" contentEditable={false}>
              <span className="block">
                <button
                  type="button"
                  aria-expanded={iconPickerOpen}
                  aria-label={attrs.icon ? 'Change icon' : 'Add icon'}
                  onMouseDown={stopPm}
                  className={cn(
                    'relative block cursor-pointer',
                    'after:absolute after:inset-[-5px] after:rounded-md after:transition-opacity after:duration-150',
                    'after:bg-stone-100 after:opacity-0 hover:after:opacity-100 aria-expanded:after:opacity-100 dark:after:bg-stone-800',
                  )}
                >
                  <span className="relative z-10 block size-6">
                    {attrs.icon ? (
                      <Icon
                        icon={attrs.icon}
                        iconLibrary={attrs.iconLibrary ?? undefined}
                        iconType={attrs.iconType ?? undefined}
                        size={24}
                      />
                    ) : null}
                  </span>
                </button>
              </span>
            </div>
          </IconPickerPopover>

          <div className="min-w-0 flex-1">
            {/* Editable title — plain input, never wrapped in h3 */}
            <input
              value={attrs.title ?? ''}
              placeholder="Card title"
              onChange={(e) => updateAttributes({ title: e.target.value || null })}
              onClick={stopPm}
              onMouseDown={stopPm}
              className={cn(
                'not-prose w-full border-0 bg-transparent p-0 text-base font-semibold text-stone-800 outline-none placeholder:text-stone-400 dark:text-white dark:placeholder:text-stone-600',
                attrs.icon && !attrs.horizontal ? 'mt-4 block' : null,
              )}
            />

            {/* Body: NodeViewContent — no prose class to avoid paragraph margins */}
            <div
              className="mt-1 font-normal text-base leading-6 text-stone-600 dark:text-stone-400"
              data-component-part="card-content"
            >
              <NodeViewContent />
            </div>

            {attrs.cta ? (
              <div className="mt-4" data-component-part="card-cta">
                <span className="flex flex-row items-center gap-2 text-left font-medium text-sm text-stone-600 dark:text-stone-400">
                  {attrs.cta}
                  <ArrowRight className="size-4" />
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Edit icon — inside card, top-right, visible on hover */}
      <div contentEditable={false} className="absolute top-3 right-3 z-10">
        <button
          type="button"
          aria-label="Edit card attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/card:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
      </div>

      {/* Attributes popover */}
      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={cardRef.current}
        title={cardSchema.title}
        titleIcon={cardSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={cardSchema}
          values={attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
