import { useRef, useState } from 'react';
import { EllipsisVertical, Plus } from 'lucide-react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Icon, type IconLibrary, type IconType } from '@nebula/components';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { stepSchema } from '@/lib/blockSchemas/step';
import { cn } from '@/lib/utils';

type StepTitleSize = 'p' | 'h2' | 'h3' | 'h4';

export const MdxSteps = Node.create({
  name: 'mdxSteps',
  group: 'block',
  content: 'mdxStep+',
  defining: true,

  addAttributes() {
    return {
      titleSize: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-steps]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-steps': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxStepsView);
  },
});

export const MdxStep = Node.create({
  name: 'mdxStep',
  group: 'mdxStepItem',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      title: { default: null },
      titleSize: { default: null },
      icon: { default: null },
      iconLibrary: { default: null },
      iconType: { default: null },
      stepNumber: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-step]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-step': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxStepView);
  },
});

function MdxStepsView({ node, selected, editor, getPos }: NodeViewProps) {
  const titleSize = (node.attrs.titleSize as string | null) ?? undefined;

  const appendStep = () => {
    if (typeof getPos !== 'function' || !editor.isEditable) return;
    const pos = getPos();
    if (pos == null) return;
    const insertAt = pos + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: 'mdxStep',
        content: [{ type: 'paragraph' }],
      })
      .setTextSelection(insertAt + 2)
      .run();
  };

  return (
    <NodeViewWrapper
      data-mdx-steps=""
      data-title-size={titleSize ?? undefined}
      className={cn(
        'my-4',
        selected && 'rounded-md ring-2 ring-primary/40',
      )}
    >
      <div
        role="list"
        className="mt-10 mb-6 ml-3.5"
        data-component-part="steps"
      >
        <NodeViewContent />
      </div>
      {editor.isEditable ? (
        <div
          contentEditable={false}
          className="relative -mt-3 ml-3.5 flex items-center"
          data-component-part="steps-append"
        >
          <button
            type="button"
            aria-label="Add step"
            onClick={appendStep}
            className={cn(
              'group/append flex items-center gap-2',
              'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100',
            )}
          >
            <span
              className={cn(
                '-ml-3 flex size-7 shrink-0 items-center justify-center rounded-full',
                'border border-dashed border-stone-300 bg-stone-50',
                'dark:border-white/15 dark:bg-white/5',
                'group-hover/append:border-stone-400 group-hover/append:bg-stone-100',
                'dark:group-hover/append:border-white/30 dark:group-hover/append:bg-white/10',
              )}
            >
              <Plus className="size-4" />
            </span>
            <span className="pl-5 text-sm opacity-0 transition-opacity group-hover/append:opacity-100">
              Add step
            </span>
          </button>
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}

function MdxStepView({
  node,
  selected,
  editor,
  getPos,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const titleAttr = (node.attrs.title as string | null) ?? '';
  const iconName = (node.attrs.icon as string | null) ?? undefined;
  const iconLibrary = (node.attrs.iconLibrary as IconLibrary | null) ?? undefined;
  const iconType = (node.attrs.iconType as IconType | null) ?? undefined;
  const stepNumberOverride = node.attrs.stepNumber as string | number | null | undefined;

  const [attrOpen, setAttrOpen] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  let autoStepNumber = 1;
  let isLast = true;
  let parentTitleSize: StepTitleSize | undefined;
  if (typeof getPos === 'function') {
    const pos = getPos();
    if (pos != null) {
      const $pos = editor.state.doc.resolve(pos);
      const indexInParent = $pos.index();
      autoStepNumber = indexInParent + 1;
      const isLastInParent = indexInParent === $pos.parent.childCount - 1;
      isLast = isLastInParent && !editor.isEditable;
      const parentTitleSizeAttr = $pos.parent.attrs.titleSize;
      if (
        parentTitleSizeAttr === 'p' ||
        parentTitleSizeAttr === 'h2' ||
        parentTitleSizeAttr === 'h3' ||
        parentTitleSizeAttr === 'h4'
      ) {
        parentTitleSize = parentTitleSizeAttr;
      }
    }
  }

  const ownTitleSize = node.attrs.titleSize as StepTitleSize | null;
  const titleSize: StepTitleSize = ownTitleSize ?? parentTitleSize ?? 'p';

  let stepNumber = autoStepNumber;
  if (stepNumberOverride != null && stepNumberOverride !== '') {
    const parsed = Number(stepNumberOverride);
    if (Number.isFinite(parsed)) stepNumber = parsed;
  }

  const stopPm = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const iconNode = iconName ? (
    <Icon
      icon={iconName}
      iconLibrary={iconLibrary}
      iconType={iconType}
      size={12}
    />
  ) : null;

  const titleClass = cn(
    'not-prose mt-2 w-full border-0 bg-transparent p-0 outline-none placeholder:text-muted-foreground/55',
    titleSize === 'p' &&
      'font-semibold text-base text-stone-900 dark:text-stone-200',
    titleSize === 'h2' &&
      'text-2xl font-bold text-stone-900 dark:text-stone-200',
    titleSize === 'h3' &&
      'text-xl font-bold text-stone-900 dark:text-stone-200',
    titleSize === 'h4' &&
      'text-lg font-bold text-stone-900 dark:text-stone-200',
  );

  return (
    <NodeViewWrapper
      data-mdx-step=""
      className={cn(
        'relative group/step-edit',
        selected && 'rounded ring-2 ring-primary/40',
      )}
    >
      <div
        ref={stepRef}
        role="listitem"
        className="group/step relative flex items-start pb-5"
        data-component-part="step-item"
      >
        <div
          aria-hidden="true"
          contentEditable={false}
          className={cn(
            'absolute top-11 h-[calc(100%-2.75rem)] w-px',
            isLast
              ? 'bg-linear-to-b from-stone-200 via-80% via-stone-200 to-transparent dark:from-white/10 dark:via-white/10'
              : 'bg-stone-200/70 dark:bg-white/10',
          )}
          data-component-part="step-line"
        />
        <div
          aria-hidden="true"
          contentEditable={false}
          className="absolute -ml-3 py-2"
          data-component-part="step-number"
        >
          <div className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-50 font-semibold text-stone-900 text-xs dark:bg-white/10 dark:text-stone-50">
            {iconNode ?? stepNumber}
          </div>
        </div>
        <div className="w-full overflow-hidden pr-10 pl-8">
          <input
            value={titleAttr}
            placeholder={`Step ${stepNumber}`}
            onChange={(e) =>
              updateAttributes({ title: e.target.value || null })
            }
            onClick={stopPm}
            onMouseDown={stopPm}
            className={titleClass}
          />
          <div
            className="mt-2 text-stone-700 dark:text-stone-300"
            data-component-part="step-content"
          >
            <NodeViewContent />
          </div>
        </div>
      </div>

      <div
        contentEditable={false}
        className="absolute top-2 right-2 z-10"
      >
        <button
          type="button"
          aria-label="Edit step attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/step-edit:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
      </div>

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={stepRef.current}
        title={stepSchema.title}
        titleIcon={stepSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={stepSchema}
          values={node.attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
