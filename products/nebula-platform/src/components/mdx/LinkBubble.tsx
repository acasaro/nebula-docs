import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Copy,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Trash2,
} from 'lucide-react';
import { getMarkRange } from '@tiptap/core';
import type { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import {
  filterPageSuggestions,
  usePageSuggestions,
  type PageSuggestion,
} from '@/lib/pageSuggestions';

const GAP_PX = 10;
const ESTIMATED_HEIGHT = 36;

interface BubbleCoords {
  top: number;
  left: number;
  flipAbove: boolean;
}

interface LinkBubbleProps {
  editor: Editor | null;
}

/**
 * Walks up from a ProseMirror position to the rendered <a> element so the
 * bubble can anchor to the link's actual on-screen rect (not the cursor).
 */
function findLinkElement(editor: Editor, pos: number): HTMLElement | null {
  try {
    const { node } = editor.view.domAtPos(pos);
    let el: Node | null =
      node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
    while (el && el !== editor.view.dom) {
      if (el instanceof HTMLElement && el.tagName === 'A') return el;
      el = el.parentNode;
    }
  } catch {
    // domAtPos can throw on stale positions during tear-down
  }
  return null;
}

export function LinkBubble({ editor }: LinkBubbleProps) {
  const [coords, setCoords] = useState<BubbleCoords | null>(null);
  const [url, setUrl] = useState('');
  const [range, setRange] = useState<{ from: number; to: number } | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Track whether we've focused the input for the current link instance, so
  // re-renders from `setUrl` don't keep stealing focus mid-typing.
  const focusedForRangeRef = useRef<string | null>(null);

  const pageSuggestions = usePageSuggestions();
  const matches = useMemo(
    () => filterPageSuggestions(pageSuggestions, url),
    [pageSuggestions, url],
  );
  const showSuggestions =
    suggestionsOpen && pageSuggestions.length > 0 && matches.length > 0;
  // Clamp the active index whenever the matches list shrinks so an out-of-
  // range highlight doesn't desync the keyboard handler.
  useEffect(() => {
    if (activeSuggestion >= matches.length) setActiveSuggestion(0);
  }, [activeSuggestion, matches.length]);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      // Don't re-position while the user is typing in the input — a
      // transaction triggered by setLink (or any sibling editor activity)
      // would otherwise yank the field. We only guard on the input itself,
      // not all bubble buttons, so trash etc. cleanly close the bubble.
      if (inputRef.current && document.activeElement === inputRef.current) {
        return;
      }

      if (!editor.isActive('link')) {
        setCoords(null);
        setRange(null);
        return;
      }

      const { from } = editor.state.selection;
      const $pos = editor.state.doc.resolve(from);
      const markType = editor.schema.marks.link;
      if (!markType) {
        setCoords(null);
        return;
      }
      const markRange = getMarkRange($pos, markType);
      if (!markRange) {
        setCoords(null);
        return;
      }
      const linkMark = $pos
        .marks()
        .find((m) => m.type.name === 'link');
      const href = (linkMark?.attrs.href as string | undefined) ?? '';

      // Bias one position to the right of the start so we land inside the
      // linked text node — `domAtPos` at a mark boundary returns the parent
      // block element, which has no <a> ancestor to walk up from.
      const insidePos = Math.min(markRange.from + 1, markRange.to);
      const linkEl = findLinkElement(editor, insidePos);
      if (!linkEl) {
        setCoords(null);
        return;
      }
      const rect = linkEl.getBoundingClientRect();
      const flipAbove =
        rect.bottom + ESTIMATED_HEIGHT + GAP_PX > window.innerHeight;

      setRange(markRange);
      setUrl(href);
      setCoords({
        top: flipAbove ? rect.top : rect.bottom,
        left: rect.left + rect.width / 2,
        flipAbove,
      });
    };

    editor.on('selectionUpdate', update);
    editor.on('transaction', update);

    const onScroll = () => update();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);

    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [editor]);

  // Auto-focus the URL input the first time a fresh (empty-href) link bubble
  // mounts. Keyed off range start so re-renders for the same link don't
  // re-steal focus.
  useLayoutEffect(() => {
    if (!coords || !range) return;
    const key = `${range.from}-${range.to}`;
    if (focusedForRangeRef.current === key) return;
    if (!url) {
      inputRef.current?.focus();
      inputRef.current?.select();
      focusedForRangeRef.current = key;
    }
  }, [coords, range, url]);

  // Save the typed URL via the validated setLink command. An empty value is
  // a no-op so dismissing the bubble (blur, Escape) leaves the link as a
  // placeholder rather than silently destroying it — only the trash button
  // unlinks.
  const commit = useCallback(
    (next: string) => {
      if (!editor || !range) return;
      const trimmed = next.trim();
      if (!trimmed) return;
      editor
        .chain()
        .focus()
        .setTextSelection(range)
        .setLink({ href: trimmed })
        .setTextSelection(range.to)
        .run();
    },
    [editor, range],
  );

  const selectSuggestion = useCallback(
    (suggestion: PageSuggestion) => {
      setUrl(suggestion.url);
      setSuggestionsOpen(false);
      commit(suggestion.url);
    },
    [commit],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (showSuggestions && matches[activeSuggestion]) {
      selectSuggestion(matches[activeSuggestion]);
      return;
    }
    commit(url);
  };

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (showSuggestions) {
        setSuggestionsOpen(false);
        return;
      }
      // Restore stored href, refocus editor at end of link.
      if (editor && range) {
        editor.chain().focus().setTextSelection(range.to).run();
      }
      return;
    }
    if (!showSuggestions) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestion((i) => (i + 1) % matches.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion((i) => (i - 1 + matches.length) % matches.length);
    }
  };

  const onOpen = () => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const onCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore — clipboard may be unavailable in some contexts
    }
  };

  const onUnlink = () => {
    if (!editor || !range) return;
    editor
      .chain()
      .focus()
      .setTextSelection(range)
      .unsetLink()
      .setTextSelection(range.to)
      .run();
  };

  if (!editor || !coords) return null;

  return createPortal(
    <div
      ref={containerRef}
      role="dialog"
      aria-label="Link"
      className={cn(
        'fixed z-50 flex items-center gap-1 rounded-lg p-1 shadow-md',
        'bg-background text-muted-foreground ring-1 ring-border',
      )}
      style={{
        top: coords.top,
        left: coords.left,
        transform: coords.flipAbove
          ? `translate(-50%, calc(-100% - ${GAP_PX}px))`
          : `translate(-50%, ${GAP_PX}px)`,
      }}
      onMouseDown={(event) => {
        // Keep the editor's selection alive when clicking icon buttons; the
        // <input> handles its own focus.
        if (event.target === event.currentTarget) event.preventDefault();
      }}
    >
      <span
        className="flex size-6 items-center justify-center text-muted-foreground"
        aria-hidden
      >
        <LinkIcon className="size-3.5" />
      </span>
      <form onSubmit={onSubmit} className="flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={url}
          placeholder="Paste a link or search pages…"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          onChange={(event) => {
            setUrl(event.target.value);
            setSuggestionsOpen(true);
            setActiveSuggestion(0);
          }}
          onFocus={() => {
            if (pageSuggestions.length > 0) setSuggestionsOpen(true);
          }}
          onKeyDown={onInputKeyDown}
          onBlur={() => {
            // Defer commit a tick so a mousedown on a suggestion row can
            // intercept and pick the page first. Without the delay the input
            // blur fires before the click, committing the typed text.
            window.setTimeout(() => {
              setSuggestionsOpen(false);
              commit(url);
            }, 120);
          }}
          className={cn(
            'h-6 w-64 rounded bg-transparent px-1 text-xs text-foreground outline-none',
            'placeholder:text-muted-foreground/60',
          )}
        />
      </form>
      <Divider />
      <IconButton label="Open in new tab" disabled={!url} onClick={onOpen}>
        <ExternalLink className="size-3.5" />
      </IconButton>
      <IconButton label="Copy link" disabled={!url} onClick={onCopy}>
        <Copy className="size-3.5" />
      </IconButton>
      <IconButton label="Remove link" onClick={onUnlink}>
        <Trash2 className="size-3.5" />
      </IconButton>
      {showSuggestions ? (
        <div
          role="listbox"
          aria-label="Page suggestions"
          className={cn(
            'absolute left-0 right-0 z-50 overflow-hidden rounded-lg shadow-md',
            'bg-background ring-1 ring-border',
            coords.flipAbove ? 'bottom-full mb-1' : 'top-full mt-1',
          )}
          onMouseDown={(event) => {
            // Prevent the input from blurring (which would dismiss the bubble
            // and skip the click that follows on the row).
            event.preventDefault();
          }}
        >
          {matches.map((m, i) => (
            <button
              key={m.url}
              type="button"
              role="option"
              aria-selected={i === activeSuggestion}
              onMouseEnter={() => setActiveSuggestion(i)}
              onClick={() => selectSuggestion(m)}
              className={cn(
                'flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs',
                i === activeSuggestion
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/60',
              )}
            >
              <FileText className="size-3.5 shrink-0 opacity-70" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-foreground">{m.title}</span>
                <span className="truncate font-mono text-[10px] opacity-70">
                  {m.url}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />;
}

interface IconButtonProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function IconButton({ label, disabled, onClick, children }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      className={cn(
        'flex size-6 items-center justify-center rounded text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-muted-foreground',
      )}
    >
      {children}
    </button>
  );
}
