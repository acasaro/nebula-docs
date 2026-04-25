import {
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
} from '@mui/material';
import type { VideoBlock, VideoProps } from '@mcoe/schemas';

export interface VideoEditFormProps {
  block: VideoBlock;
  onChange: (block: VideoBlock) => void;
}

export function VideoEditForm({ block, onChange }: VideoEditFormProps) {
  const update = (patch: Partial<VideoProps>) =>
    onChange({ ...block, props: { ...block.props, ...patch } });

  return (
    <Stack spacing={2}>
      <TextField
        label="Source URL"
        fullWidth
        size="small"
        value={block.props.src}
        onChange={(e) => update({ src: e.target.value })}
        required
      />
      <TextField
        label="Caption (optional)"
        fullWidth
        size="small"
        value={block.props.caption ?? ''}
        onChange={(e) => update({ caption: e.target.value || undefined })}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={block.props.loop ?? false}
            onChange={(e) => update({ loop: e.target.checked })}
          />
        }
        label="Loop"
      />
      <TextField
        label="Max loops"
        type="number"
        fullWidth
        size="small"
        value={block.props.maxLoops ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          update({ maxLoops: v === '' ? undefined : Number(v) });
        }}
        helperText="How many times to replay before stopping (default 4)"
        disabled={!block.props.loop}
      />
    </Stack>
  );
}
