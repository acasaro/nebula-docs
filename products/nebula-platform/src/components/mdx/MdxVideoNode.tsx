import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { EllipsisVertical, FileVideo } from 'lucide-react';
import { useRef, useState } from 'react';
import { AttributesForm } from '@/components/AttributesForm';
import { AttributesPopover } from '@/components/AttributesPopover';
import { videoSchema } from '@/lib/blockSchemas/video';
import { cn } from '@/lib/utils';

/**
 * First-class video node for the editor. Atomic so the caret skips past it
 * cleanly. Round-trips with `<Video>` / `<VideoLoop>` JSX nodes via the
 * mdast↔tiptap translator. Editor preview shows native browser controls so
 * the author can scrub without committing to a runtime autoplay loop on
 * every keystroke.
 *
 * Attrs:
 *   - src       — required when the video is meant to render at build time
 *   - caption   — optional figcaption text
 *   - loop      — replay after playback completes
 *   - maxLoops  — bound on the loop count (the runtime treats `loop=true`
 *                 with no bound as a no-op, so this defaults to 4 on insert)
 */
export const MdxVideo = Node.create({
  name: 'mdxVideo',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: '' },
      caption: { default: null },
      loop: { default: false },
      maxLoops: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-video]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-video': '' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxVideoView);
  },
});

interface VideoAttrs {
  src: string;
  caption: string | null;
  loop: boolean;
  maxLoops: number | null;
}

function MdxVideoView({
  node,
  selected,
  editor,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as VideoAttrs;
  const [attrOpen, setAttrOpen] = useState(false);
  const kebabRef = useRef<HTMLButtonElement>(null);

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper
      data-mdx-video=""
      className="group/video my-4 flex justify-center"
    >
      {!attrs.src ? (
        <div
          className={cn(
            'flex w-full max-w-[40rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-sm text-muted-foreground',
            selected && 'outline outline-2 outline-primary/60',
          )}
        >
          <FileVideo className="size-5" />
          <span>Video source is empty</span>
          {editor.isEditable ? (
            <button
              type="button"
              ref={kebabRef}
              onMouseDown={stopPm}
              onClick={(e) => {
                stopPm(e);
                setAttrOpen(true);
              }}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              Choose a video
            </button>
          ) : null}
        </div>
      ) : (
        <figure
          className={cn(
            // max-w-[40rem] mirrors the CLI's <Video> render so the editor
            // preview matches the published page footprint. `inline-flex`
            // would size to content width without the cap.
            'not-prose relative inline-flex w-full max-w-[40rem] flex-col gap-2 leading-none',
            selected && 'rounded-lg outline outline-2 outline-primary/60',
          )}
          style={{ margin: 0 }}
        >
          <div className="overflow-hidden rounded-md border border-border/60 bg-muted/20 p-2">
            <video
              src={attrs.src}
              controls
              muted
              playsInline
              preload="metadata"
              className="block h-auto w-full max-w-full rounded-sm"
              draggable={false}
            />
          </div>
          {attrs.caption ? (
            <figcaption className="px-1 text-center text-xs text-muted-foreground">
              {attrs.caption}
            </figcaption>
          ) : null}
          <VideoHoverToolbar
            kebabRef={kebabRef}
            attrOpen={attrOpen}
            onOpenAttrs={(e) => {
              stopPm(e);
              setAttrOpen(true);
            }}
          />
        </figure>
      )}
      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={kebabRef.current}
        title={videoSchema.title}
        titleIcon={videoSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={videoSchema}
          values={node.attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}

interface VideoHoverToolbarProps {
  kebabRef: React.RefObject<HTMLButtonElement | null>;
  attrOpen: boolean;
  onOpenAttrs: (e: React.MouseEvent) => void;
}

function VideoHoverToolbar({
  kebabRef,
  attrOpen,
  onOpenAttrs,
}: VideoHoverToolbarProps) {
  return (
    <div
      contentEditable={false}
      className={cn(
        'pointer-events-none absolute right-3 top-3 flex items-center gap-1 transition-opacity',
        attrOpen ? 'opacity-100' : 'opacity-0 group-hover/video:opacity-100',
      )}
    >
      <button
        ref={kebabRef}
        type="button"
        aria-label="Video options"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={onOpenAttrs}
        className="pointer-events-auto flex size-7 items-center justify-center rounded-md bg-black/70 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/85"
      >
        <EllipsisVertical className="size-3.5" />
      </button>
    </div>
  );
}
