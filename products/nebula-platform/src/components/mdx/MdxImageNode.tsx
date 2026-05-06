import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  EllipsisVertical,
  Frame as FrameIcon,
  ImageOff,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { AttributesForm } from '@/components/AttributesForm';
import { AttributesPopover } from '@/components/AttributesPopover';
import { imageSchema } from '@/lib/blockSchemas/image';
import { cn } from '@/lib/utils';

/**
 * First-class image node for the editor. Atomic (no inner content) so the
 * caret skips over it cleanly. Round-trips with mdast `image` nodes plus
 * MDX `<img>` JSX (single tag, or the Mintlify light/dark pair pattern).
 *
 * Attrs:
 *   - src / alt              — light-mode variant (always present)
 *   - srcDark / altDark      — optional dark-mode variant; when set, the
 *                              renderer emits the Mintlify two-img pattern
 *                              with `block dark:hidden` / `hidden dark:block`
 *   - noZoom                 — opt-out from click-to-zoom; rendered as the
 *                              `noZoom` JSX attribute that the CLI's
 *                              Lightbox script honors
 *   - title / width / height — straight passthrough
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
      srcDark: { default: null },
      altDark: { default: null },
      noZoom: { default: false },
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

interface ImageAttrs {
  src: string;
  alt: string;
  srcDark: string | null;
  altDark: string | null;
  noZoom: boolean;
  title: string | null;
  width: number | string | null;
  height: number | string | null;
}

function MdxImageView({
  node,
  selected,
  editor,
  getPos,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as ImageAttrs;
  const [broken, setBroken] = useState(false);
  const [attrOpen, setAttrOpen] = useState(false);
  const kebabRef = useRef<HTMLButtonElement>(null);

  // Show the dark variant in the editor preview when the document root has
  // dark mode applied (matches what the rendered site does at build time).
  // Falls back to light when no dark variant is set.
  const isDocDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');
  const previewSrc =
    isDocDark && attrs.srcDark ? attrs.srcDark : attrs.src;
  const previewAlt =
    isDocDark && attrs.altDark ? attrs.altDark : attrs.alt;

  const isFramed = (() => {
    const pos = getPos?.();
    if (typeof pos !== 'number') return false;
    const $pos = editor.state.doc.resolve(pos);
    return $pos.parent?.type?.name === 'mdxFrame';
  })();

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  const toggleZoom = (e: React.MouseEvent) => {
    stopPm(e);
    updateAttributes({ noZoom: !attrs.noZoom });
  };

  // Wraps the bare image in an mdxFrame when standalone, or lifts the image
  // out of its mdxFrame parent when already framed. Preserves any sibling
  // content inside the Frame on lift.
  const toggleFrame = (e: React.MouseEvent) => {
    stopPm(e);
    const pos = getPos?.();
    if (typeof pos !== 'number') return;
    const { state, view } = editor;
    const frameType = state.schema.nodes.mdxFrame;
    if (!frameType) return;

    if (isFramed) {
      const $pos = state.doc.resolve(pos);
      const parent = $pos.parent;
      const parentPos = $pos.before($pos.depth);
      const parentEnd = parentPos + parent.nodeSize;
      const tr = state.tr.replaceWith(parentPos, parentEnd, parent.content);
      view.dispatch(tr);
      return;
    }
    const imageNode = state.doc.nodeAt(pos);
    if (!imageNode) return;
    const wrapped = frameType.create({}, imageNode);
    const tr = state.tr.replaceWith(pos, pos + imageNode.nodeSize, wrapped);
    view.dispatch(tr);
  };

  return (
    <NodeViewWrapper
      data-mdx-image=""
      className="group/image my-4 flex justify-center"
    >
      {!attrs.src && !attrs.srcDark ? (
        <div className="flex w-full items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 px-6 py-8 text-sm text-muted-foreground">
          Image source is empty
        </div>
      ) : broken ? (
        <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-destructive/40 bg-destructive/5 px-6 py-8 text-sm text-destructive">
          <ImageOff className="size-4" />
          Image failed to load
        </div>
      ) : (
        // `inline-flex` (not inline-block) so the wrapper sizes to the
        // image without picking up baseline line-box space — the toolbar's
        // `top-3` then anchors to the image's actual top edge whether or
        // not the image is wrapped in a Frame.
        <div
          className={cn(
            'relative inline-flex max-w-full',
            selected && 'rounded-lg outline outline-2 outline-primary/60',
          )}
        >
          <img
            src={previewSrc}
            alt={previewAlt}
            width={attrs.width ?? undefined}
            height={attrs.height ?? undefined}
            onError={() => setBroken(true)}
            className="block h-auto max-w-full rounded-md"
            draggable={false}
          />
          <ImageHoverToolbar
            kebabRef={kebabRef}
            noZoom={attrs.noZoom}
            isFramed={isFramed}
            onToggleZoom={toggleZoom}
            onToggleFrame={toggleFrame}
            onOpenAttrs={(e) => {
              stopPm(e);
              setAttrOpen(true);
            }}
            attrOpen={attrOpen}
          />
        </div>
      )}
      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={kebabRef.current}
        title={imageSchema.title}
        titleIcon={imageSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={imageSchema}
          values={node.attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}

interface ImageHoverToolbarProps {
  kebabRef: React.RefObject<HTMLButtonElement | null>;
  noZoom: boolean;
  isFramed: boolean;
  onToggleZoom: (e: React.MouseEvent) => void;
  onToggleFrame: (e: React.MouseEvent) => void;
  onOpenAttrs: (e: React.MouseEvent) => void;
  attrOpen: boolean;
}

function ImageHoverToolbar({
  kebabRef,
  noZoom,
  isFramed,
  onToggleZoom,
  onToggleFrame,
  onOpenAttrs,
  attrOpen,
}: ImageHoverToolbarProps) {
  return (
    <div
      contentEditable={false}
      className={cn(
        // Pinned inside the image's top-right corner with a uniform 12px
        // inset. Sits at this same offset whether or not the image is
        // wrapped in a Frame — the toolbar's coordinate space is the
        // image-fit wrapper directly above, not the outer Frame chrome.
        'pointer-events-none absolute right-3 top-3 flex items-center gap-1 transition-opacity',
        attrOpen ? 'opacity-100' : 'opacity-0 group-hover/image:opacity-100',
      )}
    >
      <ToolbarButton
        ariaLabel={noZoom ? 'Enable click-to-zoom' : 'Disable click-to-zoom'}
        onClick={onToggleZoom}
      >
        {noZoom ? <ZoomOut className="size-3.5" /> : <ZoomIn className="size-3.5" />}
      </ToolbarButton>
      <ToolbarButton
        ariaLabel={isFramed ? 'Remove frame' : 'Add frame'}
        onClick={onToggleFrame}
      >
        <FrameIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        ariaLabel="Image options"
        onClick={onOpenAttrs}
        ref={kebabRef}
      >
        <EllipsisVertical className="size-3.5" />
      </ToolbarButton>
    </div>
  );
}

interface ToolbarButtonProps {
  ariaLabel: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

function ToolbarButton({
  ariaLabel,
  onClick,
  children,
  ref,
}: ToolbarButtonProps) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onClick}
      // Solid dark pill with a white glyph — readable over arbitrary image
      // content without relying on per-theme tokens. The icon itself swaps
      // (ZoomIn ↔ ZoomOut, etc.) to convey state, so we don't need a
      // separate "active" treatment on the button background.
      className="pointer-events-auto flex size-7 items-center justify-center rounded-md bg-black/70 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/85"
    >
      {children}
    </button>
  );
}
