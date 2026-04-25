import type { CSSProperties } from 'react';
import type { HeadingBlock, HeadingProps } from '@mcoe/schemas';
import type { BlockEditorProps } from './registry';
import { EditableText } from '../primitives/EditableText';
import { BlockChrome } from '../primitives/BlockChrome';
import { HeadingEditForm } from '../edit-forms/HeadingEditForm';

const HEADING_STYLES: Record<HeadingProps['level'], CSSProperties> = {
  1: { fontSize: '32px', fontWeight: 700, lineHeight: 1.3, color: 'var(--mcoe-text-heading)', letterSpacing: '0.3px' },
  2: { fontSize: '1.375rem', fontWeight: 700, lineHeight: 1.3, color: 'var(--mcoe-text-heading)' },
  3: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.3, color: 'var(--mcoe-text-heading)' },
  4: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.3, color: 'var(--mcoe-text-heading)' },
  5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.3, color: 'var(--mcoe-text-heading)' },
  6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.3, color: 'var(--mcoe-text-heading)' },
};

export function HeadingEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  onInsertAfter,
}: BlockEditorProps<HeadingBlock>) {
  return (
    <BlockChrome
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      isFirst={isFirst}
      isLast={isLast}
      settings={<HeadingEditForm block={block} onChange={onChange} />}
    >
      <EditableText
        value={block.props.text}
        onChange={(text) =>
          onChange({ ...block, props: { ...block.props, text } })
        }
        onEnter={onInsertAfter}
        placeholder={`Heading ${block.props.level}`}
        singleLine
        style={HEADING_STYLES[block.props.level]}
        ariaLabel={`Heading ${block.props.level} text`}
      />
    </BlockChrome>
  );
}
