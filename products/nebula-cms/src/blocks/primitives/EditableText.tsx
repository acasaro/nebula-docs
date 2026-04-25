import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { styled } from '@mui/material/styles';

export interface EditableTextHandle {
  focus: () => void;
  /** Get the bounding rect of the contenteditable element. */
  getRect: () => DOMRect | null;
}

export interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  /** Pressed Enter (no Shift). Returning `false` lets default Enter behavior run. */
  onEnter?: () => void;
  /** Pressed Backspace at start of empty content — used to remove the block. */
  onEmptyBackspace?: () => void;
  /** Fired when the user types `/` at the start of an otherwise empty editor. */
  onSlashCommand?: (query: string) => void;
  placeholder?: string;
  /**
   * If true, behave as single-line: Enter is intercepted (no newline inserted).
   * Used for headings and titles.
   */
  singleLine?: boolean;
  /** Inline styles applied directly to the contenteditable element. */
  style?: CSSProperties;
  ariaLabel?: string;
}

/**
 * Mintlify-style inline editor: a contenteditable surface that LOOKS like
 * rendered text. No MUI form chrome, no input borders, no hover backgrounds.
 * The placeholder is rendered via `:empty::before` only when the element is
 * truly empty. Plain-text only — no rich formatting; markdown syntax is typed
 * literally and rendered on save.
 */
const Editable = styled('div')({
  outline: 'none',
  cursor: 'text',
  minHeight: '1.4em',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  '&:empty::before': {
    content: 'attr(data-placeholder)',
    color: 'var(--mcoe-text-secondary, #697386)',
    opacity: 0.5,
    pointerEvents: 'none',
  },
});

export const EditableText = forwardRef<EditableTextHandle, EditableTextProps>(
  function EditableText(
    {
      value,
      onChange,
      onEnter,
      onEmptyBackspace,
      onSlashCommand,
      placeholder,
      singleLine,
      style,
      ariaLabel,
    },
    ref
  ) {
    const elRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          const el = elRef.current;
          if (!el) return;
          el.focus();
          // place caret at end
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        },
        getRect: () => elRef.current?.getBoundingClientRect() ?? null,
      }),
      []
    );

    // Keep DOM in sync with external value when it diverges from typed content.
    useEffect(() => {
      const el = elRef.current;
      if (!el) return;
      if (el.textContent !== value) {
        el.textContent = value;
      }
    }, [value]);

    const handleInput = useCallback(
      (e: React.FormEvent<HTMLDivElement>) => {
        const text = e.currentTarget.textContent ?? '';
        // Slash command: only fires when text starts with '/' AND there's
        // no other content beyond the slash query (no spaces / newlines).
        if (onSlashCommand && text.startsWith('/') && !text.includes(' ') && !text.includes('\n')) {
          onSlashCommand(text.slice(1));
          // Don't bubble the slash text to onChange — caller decides what to do.
          return;
        }
        onChange(text);
      },
      [onChange, onSlashCommand]
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        // Enter (no Shift) behavior
        if (e.key === 'Enter' && !e.shiftKey) {
          if (singleLine) {
            e.preventDefault();
            onEnter?.();
            return;
          }
          if (onEnter) {
            e.preventDefault();
            onEnter();
            return;
          }
        }
        // Backspace at start of empty content → emit
        if (e.key === 'Backspace' && onEmptyBackspace) {
          const text = e.currentTarget.textContent ?? '';
          if (text === '') {
            e.preventDefault();
            onEmptyBackspace();
          }
        }
      },
      [onEnter, onEmptyBackspace, singleLine]
    );

    // Strip HTML formatting on paste — keep things plain-text only.
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
    }, []);

    return (
      <Editable
        ref={elRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        role="textbox"
        aria-multiline={!singleLine}
        aria-label={ariaLabel}
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        style={style}
      />
    );
  }
);
