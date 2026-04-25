import { Alert, Box, Stack, Typography } from '@mui/material';
import type { VideoBlock } from '@mcoe/schemas';
import { Video } from '@mcoe/blocks';
import type { BlockEditorProps } from './registry';
import { EditableText } from '../primitives/EditableText';
import { BlockChrome } from '../primitives/BlockChrome';
import { VideoEditForm } from '../edit-forms/VideoEditForm';

export function VideoEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: BlockEditorProps<VideoBlock>) {
  const update = (patch: Partial<VideoBlock['props']>) =>
    onChange({ ...block, props: { ...block.props, ...patch } });

  return (
    <BlockChrome
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      isFirst={isFirst}
      isLast={isLast}
      settings={<VideoEditForm block={block} onChange={onChange} />}
    >
      <Stack spacing={1}>
        {block.props.src ? (
          <Video
            src={block.props.src}
            caption={block.props.caption}
            loop={block.props.loop}
            maxLoops={block.props.maxLoops}
          />
        ) : (
          <Alert severity="info">
            <Typography variant="body2">
              Video source URL not set — open settings (✏︎) to configure.
            </Typography>
          </Alert>
        )}
        <Box sx={{ px: 0.5 }}>
          <EditableText
            value={block.props.caption ?? ''}
            onChange={(caption) => update({ caption: caption || undefined })}
            placeholder="Caption (optional)"
            singleLine
            style={{
              fontSize: '13px',
              color: 'var(--mcoe-text-secondary)',
              textAlign: 'center',
            }}
          />
        </Box>
      </Stack>
    </BlockChrome>
  );
}
