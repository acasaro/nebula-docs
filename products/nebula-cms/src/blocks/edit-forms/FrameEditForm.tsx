import { TextField } from '@mui/material';
import type { FrameBlock } from '@mcoe/schemas';

export interface FrameEditFormProps {
  block: FrameBlock;
  onChange: (block: FrameBlock) => void;
}

export function FrameEditForm({ block, onChange }: FrameEditFormProps) {
  return (
    <TextField
      label="Caption (optional)"
      fullWidth
      size="small"
      value={block.props.caption ?? ''}
      onChange={(e) =>
        onChange({
          ...block,
          props: { caption: e.target.value || undefined },
        })
      }
      helperText="Frame wraps an image (or any block) — drop an image block as a child."
    />
  );
}
