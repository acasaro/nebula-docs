import { useRef, useState } from 'react';
import { Box } from '@mui/material';
import type { TextBlock } from '@mcoe/schemas';
import type { BlockEditorProps } from './registry';
import { EditableText } from '../primitives/EditableText';
import { BlockChrome } from '../primitives/BlockChrome';
import { SlashMenu } from '../primitives/SlashMenu';

export function TextEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onTypeChange,
  onInsertAfter,
}: BlockEditorProps<TextBlock>) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [slash, setSlash] = useState<{ open: boolean; query: string }>({
    open: false,
    query: '',
  });

  return (
    <BlockChrome
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      isFirst={isFirst}
      isLast={isLast}
    >
      <Box ref={anchorRef}>
        <EditableText
          value={block.props.markdown}
          onChange={(markdown) =>
            onChange({ ...block, props: { markdown } })
          }
          onEnter={onInsertAfter}
          onEmptyBackspace={onDelete}
          onSlashCommand={(query) => setSlash({ open: true, query })}
          placeholder="Start typing or press '/' for commands"
          style={{
            fontSize: '16px',
            lineHeight: 1.625,
            color: 'var(--mcoe-text-primary)',
          }}
          ariaLabel="Paragraph text"
        />
      </Box>
      {slash.open && onTypeChange ? (
        <SlashMenu
          anchorEl={anchorRef.current}
          query={slash.query}
          onSelect={(type) => {
            setSlash({ open: false, query: '' });
            onTypeChange(type);
          }}
          onClose={() => setSlash({ open: false, query: '' })}
        />
      ) : null}
    </BlockChrome>
  );
}
