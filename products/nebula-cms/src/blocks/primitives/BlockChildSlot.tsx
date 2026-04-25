import type { ReactNode } from 'react';
import { Box, Stack } from '@mui/material';
import type { Block, BlockType } from '@mcoe/schemas';
import { BlockNode } from './BlockNode';
import { newBlockOfType } from '../edit-forms/registry';

export interface ChildSlotHandlers {
  onChange: (block: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  onTypeChange: (type: BlockType) => void;
  onInsertAfter: () => void;
}

export interface BlockChildSlotProps {
  blocks: Block[] | undefined;
  onChange: (blocks: Block[]) => void;
  /**
   * Restrict which block types can be created in this slot. Default: all.
   */
  allowedTypes?: BlockType[];
  emptyHint?: string;
  /**
   * Custom render for each child block. If omitted, the default `<BlockNode>`
   * is used (which dispatches to the editor registry by block type).
   */
  renderBlock?: (
    block: Block,
    idx: number,
    handlers: ChildSlotHandlers
  ) => ReactNode;
}

/**
 * Mintlify-style child slot. No prominent "Add block" button. When empty,
 * shows a clickable placeholder that creates an empty text block on click —
 * the user immediately starts typing or hits `/` for the slash menu. Adding
 * subsequent blocks is via Enter (creates next paragraph) or `/` (slash
 * command in any text block).
 *
 * For container slots that only accept specific types (e.g., Steps → Step),
 * the empty placeholder creates a block of the first allowed type.
 */
export function BlockChildSlot({
  blocks = [],
  onChange,
  allowedTypes,
  emptyHint = "Start typing or press '/' for commands",
  renderBlock,
}: BlockChildSlotProps) {
  const updateAt = (idx: number, block: Block) => {
    const next = blocks.slice();
    next[idx] = block;
    onChange(next);
  };
  const deleteAt = (idx: number) =>
    onChange(blocks.filter((_, i) => i !== idx));
  const moveBy = (idx: number, delta: -1 | 1) => {
    const target = idx + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = blocks.slice();
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    onChange(next);
  };
  const replaceAt = (idx: number, type: BlockType) => {
    const next = blocks.slice();
    next[idx] = newBlockOfType(type);
    onChange(next);
  };
  const defaultSeedType = (): BlockType =>
    allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes('text')
      ? allowedTypes[0]!
      : 'text';
  const insertAfter = (idx: number) => {
    const next = blocks.slice();
    next.splice(idx + 1, 0, newBlockOfType(defaultSeedType()));
    onChange(next);
  };
  const seedEmpty = () => {
    onChange([newBlockOfType(defaultSeedType())]);
  };

  if (blocks.length === 0) {
    return <EmptyPlaceholder hint={emptyHint} onClick={seedEmpty} />;
  }

  return (
    <Stack spacing={0}>
      {blocks.map((block, idx) => {
        const handlers: ChildSlotHandlers = {
          onChange: (b) => updateAt(idx, b),
          onDelete: () => deleteAt(idx),
          onMoveUp: () => moveBy(idx, -1),
          onMoveDown: () => moveBy(idx, 1),
          isFirst: idx === 0,
          isLast: idx === blocks.length - 1,
          onTypeChange: (newType) => replaceAt(idx, newType),
          onInsertAfter: () => insertAfter(idx),
        };
        return (
          <Box key={block.id}>
            {renderBlock ? (
              renderBlock(block, idx, handlers)
            ) : (
              <BlockNode block={block} {...handlers} />
            )}
          </Box>
        );
      })}
    </Stack>
  );
}

function EmptyPlaceholder({
  hint,
  onClick,
}: {
  hint: string;
  onClick: () => void;
}) {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        py: 0.75,
        color: 'text.secondary',
        opacity: 0.4,
        fontSize: '16px',
        lineHeight: 1.625,
        cursor: 'text',
        userSelect: 'none',
        '&:hover': { opacity: 0.65 },
      }}
    >
      {hint}
    </Box>
  );
}
