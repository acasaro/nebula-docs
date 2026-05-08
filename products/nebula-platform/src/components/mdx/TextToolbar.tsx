import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Bold as BoldIcon,
  Check,
  ChevronDown,
  Code as CodeIcon,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  HelpCircle,
  Italic as ItalicIcon,
  Link as LinkIcon,
  List as ListUnorderedIcon,
  ListOrdered as ListOrderedIcon,
  MoreHorizontal,
  Strikethrough as StrikeIcon,
  Type as TypeIcon,
  Underline as UnderlineIcon,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const GAP_PX = 10;
// Used to decide whether to flip the toolbar below the selection when the
// caret is near the top of the viewport. The exact rendered height depends on
// font metrics, so this is intentionally a generous estimate.
const ESTIMATED_HEIGHT = 36;

interface BubbleCoords {
  top: number;
  left: number;
  flipBelow: boolean;
}

interface SelectionRect {
  top: number;
  bottom: number;
  centerX: number;
}

/**
 * Resolves the on-screen rect of the editor's current text selection. Prefers
 * the live DOM selection (accurate for multi-line / wrapped text), and falls
 * back to ProseMirror's `coordsAtPos` while the editor is blurred — e.g.
 * while a Radix dropdown trigger has focus, the DOM selection clears but the
 * editor selection persists.
 */
function getSelectionRect(editor: Editor): SelectionRect | null {
  const sel = typeof window !== 'undefined' ? window.getSelection() : null;
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    const rects = sel.getRangeAt(0).getClientRects();
    if (rects.length > 0) {
      const first = rects[0];
      const last = rects[rects.length - 1];
      return {
        top: first.top,
        bottom: last.bottom,
        centerX: first.left + first.width / 2,
      };
    }
  }
  try {
    const { from, to } = editor.state.selection;
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    return {
      top: Math.min(start.top, end.top),
      bottom: Math.max(start.bottom, end.bottom),
      centerX: (start.left + end.right) / 2,
    };
  } catch {
    return null;
  }
}

interface TextToolbarProps {
  editor: Editor | null;
}

export function TextToolbar({ editor }: TextToolbarProps) {
  const [coords, setCoords] = useState<BubbleCoords | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      // Pin the toolbar in place while a child dropdown is open. Radix marks
      // its trigger with data-state="open" — the menu content itself portals
      // outside the container, but the trigger lives inside it.
      if (containerRef.current?.querySelector('[data-state="open"]')) return;

      const { from, to, empty } = editor.state.selection;
      // `empty` is `from === to`, which catches a TextSelection caret but
      // NOT a NodeSelection (whose `empty` is false even though no text
      // is highlighted). ProseMirror sometimes lands on a NodeSelection
      // at init or after a node replace, so also require that the
      // selected range actually contains text — without this guard the
      // toolbar centers on whatever node is selected and floats in the
      // middle of the page on first navigation.
      if (empty) {
        setCoords(null);
        return;
      }
      const selectedText = editor.state.doc.textBetween(from, to, '\n').trim();
      if (!selectedText) {
        setCoords(null);
        return;
      }
      // Hide inside code blocks — text marks don't apply there.
      if (editor.isActive('codeBlock')) {
        setCoords(null);
        return;
      }

      const rect = getSelectionRect(editor);
      if (!rect || rect.bottom <= rect.top) {
        setCoords(null);
        return;
      }

      const flipBelow = rect.top - ESTIMATED_HEIGHT - GAP_PX < 0;
      setCoords({
        top: flipBelow ? rect.bottom : rect.top,
        left: rect.centerX,
        flipBelow,
      });
    };

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    editor.on('blur', update);

    const onScroll = () => update();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);

    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
      editor.off('blur', update);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [editor]);

  if (!editor || !coords) return null;

  return createPortal(
    <div
      ref={containerRef}
      role="toolbar"
      aria-label="Text formatting"
      className={cn(
        'fixed z-50 flex items-center gap-0.5 rounded-lg p-1 shadow-md',
        'bg-background text-muted-foreground ring-1 ring-border',
      )}
      style={{
        top: coords.top,
        left: coords.left,
        transform: coords.flipBelow
          ? `translate(-50%, ${GAP_PX}px)`
          : `translate(-50%, calc(-100% - ${GAP_PX}px))`,
      }}
      // Prevent the editor losing its selection when the user mouses down
      // on a button — without this, the click target steals focus before
      // the chain command can re-focus and apply the change.
      onMouseDown={(event) => event.preventDefault()}
    >
      <TextTypeMenu editor={editor} />
      <Divider />
      <InlineMarks editor={editor} />
      <Divider />
      <OverflowMenu editor={editor} />
    </div>,
    document.body,
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />;
}

interface ToolbarButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-6 items-center justify-center rounded text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground',
        active && 'bg-accent text-foreground',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground',
      )}
    >
      {children}
    </button>
  );
}

interface TypeOption {
  id: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  isActive: () => boolean;
  apply: () => void;
}

/**
 * Per-slot dropdown options. When the cursor is inside a fixed-purpose slot
 * (e.g. a FeatureCard title) the schema won't accept conversions to
 * paragraph/list, so we surface a slot-specific menu instead — for the
 * title that's the four heading levels, applied via `updateAttributes` so
 * the change stays scoped to the title node and never touches the
 * description blocks below.
 */
const HEADING_ICONS: Record<number, ComponentType<{ className?: string }>> = {
  1: Heading1,
  2: Heading2,
  3: Heading3,
  4: Heading4,
};

function buildSlotOptions(
  editor: Editor,
  slotName: string,
): TypeOption[] | null {
  if (slotName === 'mdxFeatureCardTitle') {
    return [1, 2, 3, 4].map((level) => ({
      id: `title-h${level}`,
      label: `Heading ${level}`,
      Icon: HEADING_ICONS[level],
      isActive: () => editor.isActive('mdxFeatureCardTitle', { level }),
      apply: () =>
        editor
          .chain()
          .focus()
          .updateAttributes('mdxFeatureCardTitle', { level })
          .run(),
    }));
  }
  return null;
}

const SLOT_NAMES = ['mdxFeatureCardTitle'] as const;

function TextTypeMenu({ editor }: { editor: Editor }) {
  const slotName = SLOT_NAMES.find((name) => editor.isActive(name));
  const slotOptions = slotName ? buildSlotOptions(editor, slotName) : null;

  const defaultOptions: TypeOption[] = [
    {
      id: 'paragraph',
      label: 'Text',
      Icon: TypeIcon,
      isActive: () =>
        editor.isActive('paragraph') &&
        !editor.isActive('bulletList') &&
        !editor.isActive('orderedList'),
      apply: () => editor.chain().focus().setNode('paragraph').run(),
    },
    {
      id: 'h1',
      label: 'Heading 1',
      Icon: Heading1,
      isActive: () => editor.isActive('heading', { level: 1 }),
      apply: () =>
        editor.chain().focus().setNode('heading', { level: 1 }).run(),
    },
    {
      id: 'h2',
      label: 'Heading 2',
      Icon: Heading2,
      isActive: () => editor.isActive('heading', { level: 2 }),
      apply: () =>
        editor.chain().focus().setNode('heading', { level: 2 }).run(),
    },
    {
      id: 'h3',
      label: 'Heading 3',
      Icon: Heading3,
      isActive: () => editor.isActive('heading', { level: 3 }),
      apply: () =>
        editor.chain().focus().setNode('heading', { level: 3 }).run(),
    },
    {
      id: 'h4',
      label: 'Heading 4',
      Icon: Heading4,
      isActive: () => editor.isActive('heading', { level: 4 }),
      apply: () =>
        editor.chain().focus().setNode('heading', { level: 4 }).run(),
    },
    {
      id: 'bullet-list',
      label: 'Bullet list',
      Icon: ListUnorderedIcon,
      isActive: () => editor.isActive('bulletList'),
      apply: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      id: 'ordered-list',
      label: 'Ordered list',
      Icon: ListOrderedIcon,
      isActive: () => editor.isActive('orderedList'),
      apply: () => editor.chain().focus().toggleOrderedList().run(),
    },
  ];

  const options = slotOptions ?? defaultOptions;
  const current = options.find((o) => o.isActive()) ?? options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-6 items-center gap-1 rounded px-1.5 text-xs text-muted-foreground transition-colors',
            'hover:bg-accent hover:text-foreground',
            'data-[state=open]:bg-accent data-[state=open]:text-foreground',
          )}
        >
          <span>{current.label}</span>
          <ChevronDown className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="min-w-[180px] bg-background text-muted-foreground"
      >
        <DropdownMenuLabel className="px-2 py-1 text-[11px] font-normal uppercase tracking-wide text-muted-foreground/70">
          Change to
        </DropdownMenuLabel>
        {options.map((opt) => {
          const Icon = opt.Icon;
          const active = opt.isActive();
          return (
            <DropdownMenuItem
              key={opt.id}
              onSelect={() => opt.apply()}
              className="gap-2 rounded-sm pr-2 text-xs text-muted-foreground focus:text-foreground"
            >
              <Icon className="size-3.5" />
              <span className="flex-1">{opt.label}</span>
              {active ? <Check className="size-3.5" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InlineMarks({ editor }: { editor: Editor }) {
  // Apply an empty-href link mark to the selection and collapse the cursor
  // inside it — the LinkBubble takes over for URL entry. If the selection is
  // already a link, just collapse so the bubble can edit it. setLink() rejects
  // empty hrefs through its validator, so we add the mark manually here; the
  // bubble's `commit` uses the validated setLink to write the real URL.
  // Apply an empty-href link mark to the current selection and collapse the
  // cursor to its end so the LinkBubble takes over for URL entry. The
  // selection is read inside the command (not from a render-time closure)
  // because the chain runs after React's render and we want the live state.
  // setLink rejects empty hrefs through its validator; we add the mark
  // manually here, and the bubble's commit uses validated setLink for real
  // URLs.
  const onLink = () => {
    if (editor.isActive('link')) {
      editor.commands.setTextSelection(editor.state.selection.to);
      return;
    }
    const { from, to } = editor.state.selection;
    if (from === to) return;
    editor
      .chain()
      .focus()
      .command(({ tr, state, dispatch }) => {
        const linkType = state.schema.marks.link;
        if (!linkType) return false;
        if (dispatch) tr.addMark(from, to, linkType.create({ href: '' }));
        return true;
      })
      .setTextSelection(to)
      .run();
  };

  return (
    <>
      <ToolbarButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <BoldIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <ItalicIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <StrikeIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Inline code"
        active={editor.isActive('code')}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <CodeIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive('link')} onClick={onLink}>
        <LinkIcon className="size-3.5" />
      </ToolbarButton>
    </>
  );
}

function OverflowMenu({ editor }: { editor: Editor }) {
  const onWrapTooltip = () => {
    const { from, to, empty } = editor.state.selection;
    if (empty) return;
    const text = editor.state.doc.textBetween(from, to, ' ').trim();
    if (!text) return;
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent({
        type: 'mdxTooltip',
        attrs: {
          text,
          title: 'Tooltip title',
          description: '',
          cta: null,
          href: null,
          side: 'top',
          align: 'center',
        },
      })
      .run();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="More options"
          title="More"
          className={cn(
            'flex size-6 items-center justify-center rounded text-muted-foreground transition-colors',
            'hover:bg-accent hover:text-foreground',
            'data-[state=open]:bg-accent data-[state=open]:text-foreground',
          )}
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="min-w-[180px] bg-background text-muted-foreground"
      >
        <DropdownMenuLabel className="px-2 py-1 text-[11px] font-normal uppercase tracking-wide text-muted-foreground/70">
          Change to
        </DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={onWrapTooltip}
          className="gap-2 rounded-sm pr-2 text-xs text-muted-foreground focus:text-foreground"
        >
          <HelpCircle className="size-3.5" />
          <span>Tooltip</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
