import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, List, ListItemButton, ListItemText, Paper } from '@mui/material';
import type { BlockType } from '@mcoe/schemas';

interface SlashOption {
  type: BlockType;
  label: string;
  description: string;
  keywords: string[];
}

const ALL_OPTIONS: SlashOption[] = [
  { type: 'heading', label: 'Heading', description: 'Section title — H1 through H6', keywords: ['heading', 'h1', 'h2', 'h3', 'title'] },
  { type: 'text', label: 'Text', description: 'Plain paragraph (markdown supported)', keywords: ['text', 'paragraph', 'p'] },
  { type: 'callout', label: 'Callout', description: 'Note, tip, warning, danger', keywords: ['callout', 'note', 'tip', 'warning', 'danger', 'admonition', 'alert'] },
  { type: 'icon', label: 'Icon', description: 'Inline icon', keywords: ['icon', 'symbol'] },
  { type: 'frame', label: 'Frame', description: 'Image/video wrapper with caption', keywords: ['frame', 'image', 'figure', 'picture'] },
  { type: 'video', label: 'Video', description: 'Looping video', keywords: ['video', 'movie', 'clip'] },
  { type: 'steps', label: 'Steps', description: 'Numbered step list', keywords: ['steps', 'tutorial', 'instructions', 'walkthrough'] },
  { type: 'step', label: 'Step', description: 'A single step (use inside Steps)', keywords: ['step'] },
];

export interface SlashMenuProps {
  /** Anchor element. The menu floats just below it. */
  anchorEl: HTMLElement | null;
  /** Filter query (the text after the slash). */
  query: string;
  /** Restrict to specific types. */
  allowedTypes?: BlockType[];
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

/**
 * Floating block-type picker. Rendered via a portal at document.body so
 * z-index and positioning work regardless of where the editor lives in
 * the React tree. Position-fixed; tracks anchor on each open via
 * getBoundingClientRect.
 */
export function SlashMenu({ anchorEl, query, allowedTypes, onSelect, onClose }: SlashMenuProps) {
  const [hover, setHover] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const base = allowedTypes
      ? ALL_OPTIONS.filter((o) => allowedTypes.includes(o.type))
      : ALL_OPTIONS;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((o) =>
      o.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [query, allowedTypes]);

  // Reset hover whenever the filter changes
  useEffect(() => {
    setHover(0);
  }, [query]);

  // Keyboard nav — capture-phase so we beat the editor's onKeyDown
  useEffect(() => {
    if (!anchorEl) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setHover((i) => (i + 1) % Math.max(filtered.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setHover(
          (i) => (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1)
        );
      } else if (e.key === 'Enter') {
        const choice = filtered[hover];
        if (choice) {
          e.preventDefault();
          e.stopPropagation();
          onSelect(choice.type);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [anchorEl, filtered, hover, onSelect, onClose]);

  // Close on outside click
  useEffect(() => {
    if (!anchorEl) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !anchorEl.contains(target)
      ) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [anchorEl, onClose]);

  if (!anchorEl) return null;

  const rect = anchorEl.getBoundingClientRect();

  return createPortal(
    <Box
      ref={containerRef}
      sx={{
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        zIndex: 1500,
      }}
    >
      <Paper
        elevation={6}
        sx={{ minWidth: 280, maxHeight: 320, overflow: 'auto' }}
      >
        {filtered.length === 0 ? (
          <Box sx={{ p: 2, color: 'text.secondary', fontSize: 14 }}>
            No matches for "{query}"
          </Box>
        ) : (
          <List dense disablePadding>
            {filtered.map((opt, i) => (
              <ListItemButton
                key={opt.type}
                selected={i === hover}
                onMouseEnter={() => setHover(i)}
                onClick={() => onSelect(opt.type)}
              >
                <ListItemText
                  primary={opt.label}
                  secondary={opt.description}
                  slotProps={{
                    primary: { sx: { fontWeight: 600 } },
                    secondary: { sx: { fontSize: 12 } },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>
    </Box>,
    document.body
  );
}
