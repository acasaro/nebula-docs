import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { HeadingBlock, HeadingProps } from '@mcoe/schemas';

export interface HeadingEditFormProps {
  block: HeadingBlock;
  onChange: (block: HeadingBlock) => void;
}

export function HeadingEditForm({ block, onChange }: HeadingEditFormProps) {
  const update = (patch: Partial<HeadingProps>) =>
    onChange({ ...block, props: { ...block.props, ...patch } });

  return (
    <Stack spacing={2}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Level</InputLabel>
        <Select
          label="Level"
          value={block.props.level}
          onChange={(e) =>
            update({ level: Number(e.target.value) as HeadingProps['level'] })
          }
        >
          {([1, 2, 3, 4, 5, 6] as const).map((n) => (
            <MenuItem key={n} value={n}>
              H{n}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Text"
        fullWidth
        value={block.props.text}
        onChange={(e) => update({ text: e.target.value })}
      />
      <TextField
        label="Anchor (optional)"
        fullWidth
        size="small"
        value={block.props.anchor ?? ''}
        onChange={(e) => update({ anchor: e.target.value || undefined })}
        helperText="URL fragment (e.g. installation)"
      />
    </Stack>
  );
}
