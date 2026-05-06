import { useRef, useState } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { ParamField, ResponseField } from '@nebula-docs/components';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { paramFieldSchema } from '@/lib/blockSchemas/paramField';
import { responseFieldSchema } from '@/lib/blockSchemas/responseField';
import { requestExampleSchema } from '@/lib/blockSchemas/requestExample';
import { responseExampleSchema } from '@/lib/blockSchemas/responseExample';
import { cn } from '@/lib/utils';

const FIELD_ATTRS = [
  'path',
  'query',
  'header',
  'body',
  'cookie',
  'name',
  'type',
  'location',
  'required',
  'deprecated',
  'default',
  'hidden',
] as const;

const EXAMPLE_ATTRS = ['title'] as const;

export const MdxParamField = Node.create({
  name: 'mdxParamField',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      FIELD_ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-param-field]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-param-field': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxParamFieldView);
  },
});

export const MdxResponseField = Node.create({
  name: 'mdxResponseField',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      FIELD_ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-response-field]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-response-field': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxResponseFieldView);
  },
});

export const MdxRequestExample = Node.create({
  name: 'mdxRequestExample',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      EXAMPLE_ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-request-example]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-request-example': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(makeExampleView('request'));
  },
});

export const MdxResponseExample = Node.create({
  name: 'mdxResponseExample',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      EXAMPLE_ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-response-example]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-response-example': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(makeExampleView('response'));
  },
});

interface FieldAttrs {
  path?: string | null;
  query?: string | null;
  header?: string | null;
  body?: string | null;
  cookie?: string | null;
  name?: string | null;
  type?: string | null;
  location?: string | null;
  required?: boolean | null;
  deprecated?: boolean | null;
  default?: string | null;
  hidden?: boolean | null;
}

function paramFieldName(attrs: FieldAttrs): string {
  // Mintlify uses any of `path` / `query` / `header` / `body` / `cookie`
  // as the parameter declaration; the attribute name doubles as the
  // parameter location. First non-empty one wins.
  return (
    attrs.path ?? attrs.query ?? attrs.header ?? attrs.body ?? attrs.cookie ??
    attrs.name ?? ''
  );
}

function MdxParamFieldView(props: NodeViewProps) {
  return (
    <FieldView
      {...props}
      tagName="ParamField"
      schema={paramFieldSchema}
      headerName={paramFieldName}
      Renderer={ParamField as unknown as React.ComponentType<Record<string, unknown> & { children?: React.ReactNode }>}
      rendererName={paramFieldName}
    />
  );
}

function MdxResponseFieldView(props: NodeViewProps) {
  return (
    <FieldView
      {...props}
      tagName="ResponseField"
      schema={responseFieldSchema}
      headerName={(attrs) => attrs.name ?? attrs.path ?? ''}
      Renderer={ResponseField as unknown as React.ComponentType<Record<string, unknown> & { children?: React.ReactNode }>}
      rendererName={(attrs) => attrs.name ?? attrs.path ?? ''}
    />
  );
}

interface FieldViewProps extends NodeViewProps {
  tagName: 'ParamField' | 'ResponseField';
  schema: typeof paramFieldSchema;
  headerName: (attrs: FieldAttrs) => string;
  Renderer: React.ComponentType<
    Record<string, unknown> & { children?: React.ReactNode }
  >;
  rendererName: (attrs: FieldAttrs) => string;
}

function FieldView({
  node,
  selected,
  updateAttributes,
  deleteNode,
  schema,
  headerName,
  Renderer,
  rendererName,
}: FieldViewProps) {
  const attrs = node.attrs as FieldAttrs;
  const [attrOpen, setAttrOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  const rendererProps: Record<string, unknown> = {
    name: rendererName(attrs),
    type: attrs.type ?? undefined,
    location: attrs.location ?? undefined,
    required: attrs.required ?? false,
    deprecated: attrs.deprecated ?? false,
    default: attrs.default ?? undefined,
  };

  return (
    <NodeViewWrapper
      data-mdx-field=""
      className={cn(
        'group/field relative my-2',
        selected && 'rounded-md ring-2 ring-primary/40',
      )}
    >
      <div ref={containerRef}>
        <div contentEditable={false} className="not-prose">
          <Renderer {...rendererProps}>
            {/* No description in the rendered preview — the editable body is
                rendered separately below so users can type into it. */}
          </Renderer>
        </div>
        <div
          className="not-prose -mt-3 border-b border-stone-200/70 pb-5 dark:border-stone-800/70"
        >
          <input
            value={headerName(attrs)}
            placeholder={`${schema.title.replace('Edit ', '')} name`}
            onMouseDown={stopPm}
            onClick={stopPm}
            onChange={(e) => {
              const next = e.target.value;
              if (schema.blockType === 'mdxParamField') {
                updateAttributes({ path: next || null });
              } else {
                updateAttributes({ name: next || null });
              }
            }}
            className="not-prose mb-1 w-full border-0 bg-transparent p-0 font-mono text-xs text-stone-500 outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600"
          />
          <div className="prose prose-sm prose-stone dark:prose-invert">
            <NodeViewContent />
          </div>
        </div>
      </div>
      <div
        contentEditable={false}
        className="absolute right-0 top-1.5 z-10"
      >
        <button
          type="button"
          aria-label={schema.title}
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/field:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
      </div>
      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={containerRef.current}
        title={schema.title}
        titleIcon={schema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={schema}
          values={node.attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}

function makeExampleView(variant: 'request' | 'response') {
  function ExampleView({
    node,
    selected,
    updateAttributes,
    deleteNode,
  }: NodeViewProps) {
    const attrs = node.attrs as { title?: string | null };
    const [attrOpen, setAttrOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

    const cfg =
      variant === 'request'
        ? {
            schema: requestExampleSchema,
            earBg: 'bg-emerald-600',
            earLabel: 'Request example',
            tabUnderline: 'bg-emerald-500 dark:bg-emerald-400',
            tabText: 'text-emerald-600 dark:text-emerald-400',
            placeholder: 'Request',
          }
        : {
            schema: responseExampleSchema,
            earBg: 'bg-sky-600',
            earLabel: 'Response example',
            tabUnderline: 'bg-sky-500 dark:bg-sky-400',
            tabText: 'text-sky-600 dark:text-sky-400',
            placeholder: 'Response',
          };

    return (
      <NodeViewWrapper
        data-mdx-example=""
        className={cn(
          'group/example my-5',
          selected && 'rounded-2xl ring-2 ring-primary/40',
        )}
      >
        <div ref={containerRef}>
          <div
            contentEditable={false}
            className={cn(
              'flex w-fit items-center justify-center rounded-t-xl px-3 py-1.5 text-xs font-medium text-white',
              cfg.earBg,
            )}
          >
            {cfg.earLabel}
          </div>
          <div className="relative flex flex-col overflow-hidden rounded-2xl rounded-tl-none border border-stone-950/10 bg-stone-50 p-0.5 dark:border-white/10 dark:bg-white/5">
            <div className="relative flex items-center gap-2 px-2.5 pr-2.5">
              <div
                role="tablist"
                className="relative flex flex-1 gap-1 px-2.5 text-xs leading-6"
              >
                <input
                  value={attrs.title ?? ''}
                  placeholder={cfg.placeholder}
                  onMouseDown={stopPm}
                  onClick={stopPm}
                  onChange={(e) =>
                    updateAttributes({ title: e.target.value || null })
                  }
                  className={cn(
                    'not-prose relative my-1 mb-1.5 max-w-[20ch] border-0 bg-transparent p-0 px-1.5 text-xs font-medium outline-none',
                    cfg.tabText,
                    'placeholder:text-stone-400 dark:placeholder:text-stone-600',
                  )}
                />
                <div
                  className={cn(
                    'pointer-events-none absolute -bottom-[1px] left-2.5 h-0.5 rounded-full',
                    cfg.tabUnderline,
                  )}
                  style={{ width: 'min(20ch, calc(100% - 24px))' }}
                />
              </div>
              <button
                type="button"
                aria-label={cfg.schema.title}
                onMouseDown={stopPm}
                onClick={(e) => {
                  stopPm(e);
                  setAttrOpen(true);
                }}
                className="ml-auto flex size-8 items-center justify-center rounded-[10px] text-stone-500 hover:bg-stone-950/5 dark:text-stone-400 dark:hover:bg-white/5"
              >
                <EllipsisVertical className="size-3.5" />
              </button>
            </div>
            <div className="flex w-full flex-1 overflow-hidden">
              <div
                className={cn(
                  'w-full min-w-full overflow-x-auto rounded-[14px] bg-white px-4 py-3.5 dark:bg-stone-950',
                  '[&_pre]:my-0 [&_pre]:rounded-none [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:p-0',
                )}
              >
                <NodeViewContent />
              </div>
            </div>
          </div>
        </div>
        <AttributesPopover
          open={attrOpen}
          onOpenChange={setAttrOpen}
          anchorEl={containerRef.current}
          title={cfg.schema.title}
          titleIcon={cfg.schema.headerIcon}
          onDelete={deleteNode}
        >
          <AttributesForm
            schema={cfg.schema}
            values={node.attrs}
            onChange={updateAttributes}
          />
        </AttributesPopover>
      </NodeViewWrapper>
    );
  }
  return ExampleView;
}
