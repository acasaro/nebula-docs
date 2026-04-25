import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { IconBlock, IconProps } from '@mcoe/schemas';

export interface IconEditFormProps {
  block: IconBlock;
  onChange: (block: IconBlock) => void;
}

export function IconEditForm({ block, onChange }: IconEditFormProps) {
  const update = (patch: Partial<IconProps>) =>
    onChange({ ...block, props: { ...block.props, ...patch } });

  return (
    <Stack spacing={2}>
      <TextField
        label="Icon"
        fullWidth
        size="small"
        value={block.props.icon}
        onChange={(e) => update({ icon: e.target.value })}
        helperText="Material symbol name (e.g. info, check_circle), URL, or path"
      />
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Library</InputLabel>
        <Select
          label="Library"
          value={block.props.iconLibrary ?? 'material-symbol'}
          onChange={(e) =>
            update({
              iconLibrary: e.target.value as IconProps['iconLibrary'],
            })
          }
        >
          <MenuItem value="material-symbol">Material Symbol</MenuItem>
          <MenuItem value="material">Material (classic)</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label="Color"
        fullWidth
        size="small"
        value={block.props.color ?? ''}
        onChange={(e) => update({ color: e.target.value || undefined })}
        helperText="Token name (info, primary, success...) or any CSS color"
      />
      <TextField
        label="Size (px)"
        type="number"
        fullWidth
        size="small"
        value={block.props.size ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          update({ size: v === '' ? undefined : Number(v) });
        }}
      />
    </Stack>
  );
}
