import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { CalloutBlock, CalloutProps } from '@mcoe/schemas';

const VARIANTS: NonNullable<CalloutProps['variant']>[] = [
  'info',
  'note',
  'tip',
  'check',
  'warning',
  'danger',
  'custom',
];

export interface CalloutEditFormProps {
  block: CalloutBlock;
  onChange: (block: CalloutBlock) => void;
}

export function CalloutEditForm({ block, onChange }: CalloutEditFormProps) {
  const update = (patch: Partial<CalloutProps>) =>
    onChange({ ...block, props: { ...block.props, ...patch } });

  const isCustom = block.props.variant === 'custom';

  return (
    <Stack spacing={2}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Variant</InputLabel>
        <Select
          label="Variant"
          value={block.props.variant ?? 'note'}
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
        helperText="Defaults to the variant's preset label"
      />
      <TextField
        label="Icon (optional)"
        fullWidth
        size="small"
        value={block.props.icon ?? ''}
        onChange={(e) => update({ icon: e.target.value || undefined })}
        helperText="Material symbol name; defaults to the variant's preset icon"
      />
      {isCustom && (
        <TextField
          label="Color"
          fullWidth
          size="small"
          value={block.props.color ?? ''}
          onChange={(e) => update({ color: e.target.value || undefined })}
          helperText="Required for custom variant — token name or any CSS color"
        />
      )}
    </Stack>
  );
}
