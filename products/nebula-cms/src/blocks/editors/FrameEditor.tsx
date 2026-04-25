import { Box, Stack } from '@mui/material';
import type { FrameBlock } from '@mcoe/schemas';
import type { BlockEditorProps } from './registry';
import { EditableText } from '../primitives/EditableText';
import { BlockChrome } from '../primitives/BlockChrome';
import { BlockChildSlot } from '../primitives/BlockChildSlot';

export function FrameEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: BlockEditorProps<FrameBlock>) {
  return (
    <BlockChrome
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      isFirst={isFirst}
      isLast={isLast}
    >
      <Box
        component="figure"
        sx={{
          margin: '16px 0',
          padding: 0,
        }}
      >
        <Stack
          spacing={1.5}
          sx={{
            borderRadius: '12px',
            border: '1px solid var(--mcoe-border-default)',
            overflow: 'hidden',
            background: 'var(--ifm-color-emphasis-100)',
            padding: '16px',
          }}
        >
          <BlockChildSlot
            blocks={block.children}
            onChange={(children) => onChange({ ...block, children })}
            emptyHint="Add an image, video, or other block here"
          />
          <EditableText
            value={block.props.caption ?? ''}
            onChange={(caption) =>
              onChange({
                ...block,
                props: { caption: caption || undefined },
              })
            }
            placeholder="Caption (optional)"
            singleLine
            style={{
              fontSize: '13px',
              color: 'var(--ifm-color-emphasis-600)',
              textAlign: 'center',
            }}
          />
        </Stack>
      </Box>
    </BlockChrome>
  );
}
