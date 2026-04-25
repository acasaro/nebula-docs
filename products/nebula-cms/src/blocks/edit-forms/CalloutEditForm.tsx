import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { CalloutBlock, CalloutProps } from '@mcoe/schemas';

const VARIANTS: CalloutProps['variant'][] = [
  'info',
  'check',
  'tip',
  'warning',
  'danger',
];

export interface CalloutEditFormProps {
  block: CalloutBlock;
  onChange: (block: CalloutBlock) => void;
}

export function CalloutEditForm({ block, onChange }: CalloutEditFormProps) {
  const update = (patch: Partial<CalloutProps>) =>
    onChange({ ...block, props: { ...block.props, ...patch } });

  return (
    <Stack spacing={2}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Variant</InputLabel>
        <Select
          label="Variant"
          value={block.props.variant}
          onChange={(e) =>
            update({ variant: e.target.value as CalloutProps['variant'] })
          }
        >
          {VARIANTS.map((v) => (
            <MenuItem key={v} value={v}>
              {v}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label="Title (optional)"
        fullWidth
        size="small"
        value={block.props.title ?? ''}
        onChange={(e) => update({ title: e.target.value || undefined })}
      />
    </Stack>
  );
}
