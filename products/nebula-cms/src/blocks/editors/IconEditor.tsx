import type { IconBlock } from '@mcoe/schemas';
import { Icon } from '@mcoe/blocks';
import { Box } from '@mui/material';
import type { BlockEditorProps } from './registry';
import { BlockChrome } from '../primitives/BlockChrome';
import { IconEditForm } from '../edit-forms/IconEditForm';

/**
 * Icon is config-only — no inline-editable surface makes sense here.
 * Renders the icon with chrome that opens the full edit form in a popover.
 */
export function IconEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: BlockEditorProps<IconBlock>) {
  return (
    <BlockChrome
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      isFirst={isFirst}
      isLast={isLast}
      settings={<IconEditForm block={block} onChange={onChange} />}
    >
      <Box sx={{ display: 'inline-flex', p: 1 }}>
        <Icon
          icon={block.props.icon}
          color={block.props.color}
          size={block.props.size ?? 24}
          iconLibrary={block.props.iconLibrary}
        />
      </Box>
    </BlockChrome>
  );
}
