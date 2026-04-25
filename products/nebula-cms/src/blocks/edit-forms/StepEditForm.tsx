import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { StepBlock, StepProps } from '@mcoe/schemas';

const TITLE_SIZES: NonNullable<StepProps['titleSize']>[] = ['p', 'h2', 'h3', 'h4'];

export interface StepEditFormProps {
  block: StepBlock;
  onChange: (block: StepBlock) => void;
}

export function StepEditForm({ block, onChange }: StepEditFormProps) {
  const update = (patch: Partial<StepProps>) =>
    onChange({ ...block, props: { ...block.props, ...patch } });

  return (
    <Stack spacing={2}>
      <TextField
        label="Title"
        fullWidth
        size="small"
        value={block.props.title}
        onChange={(e) => update({ title: e.target.value })}
        required
      />
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Title size</InputLabel>
        <Select
          label="Title size"
          value={block.props.titleSize ?? 'h3'}
          onChange={(e) =>
            update({
              titleSize: e.target.value as StepProps['titleSize'],
            })
          }
        >
          {TITLE_SIZES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Icon (optional)"
        fullWidth
        size="small"
        value={block.props.icon ?? ''}
        onChange={(e) => update({ icon: e.target.value || undefined })}
        helperText="Material symbol name; replaces the step number in the indicator"
      />
    </Stack>
  );
}
