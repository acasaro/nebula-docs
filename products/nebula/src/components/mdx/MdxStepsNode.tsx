import { Plus } from 'lucide-react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Step } from '@nebula/components';
import { cn } from '@/lib/utils';

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

function MdxStepView({ node, selected, editor, getPos }: NodeViewProps) {
  const titleAttr = (node.attrs.title as string | null) ?? '';
  const titleSize = (node.attrs.titleSize as string | null) ?? undefined;
  const icon = (node.attrs.icon as string | null) ?? undefined;

  let stepNumber = 1;
  let isLast = true;
  if (typeof getPos === 'function') {
    const pos = getPos();
    if (pos != null) {
      const $pos = editor.state.doc.resolve(pos);
      const indexInParent = $pos.index();
      stepNumber = indexInParent + 1;
      const isLastInParent = indexInParent === $pos.parent.childCount - 1;
      // When editable, an append button visually continues below; keep the
      // connector line solid (don't taper) so the last step "connects" to it.
      isLast = isLastInParent && !editor.isEditable;
    }
  }

  const titleNode = titleAttr.trim() ? (
    titleAttr
  ) : (
    <span className="text-muted-foreground/55" data-placeholder-title>
      Step {stepNumber}
    </span>
  );

  return (
    <NodeViewWrapper
      data-mdx-step=""
      className={cn(selected && 'rounded ring-2 ring-primary/40')}
    >
      <Step
        title={titleNode}
        titleSize={titleSize as never}
        icon={icon}
        stepNumber={stepNumber}
        isLast={isLast}
      >
        <NodeViewContent />
      </Step>
    </NodeViewWrapper>
  );
}
