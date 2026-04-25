import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import type { StepsBlock, StepsProps } from '@mcoe/schemas';

const TITLE_SIZES: NonNullable<StepsProps['titleSize']>[] = ['p', 'h2', 'h3', 'h4'];

export interface StepsEditFormProps {
  block: StepsBlock;
  onChange: (block: StepsBlock) => void;
}

export function StepsEditForm({ block, onChange }: StepsEditFormProps) {
  return (
    <FormControl size="small" sx={{ minWidth: 180 }}>
      <InputLabel>Default title size</InputLabel>
      <Select
        label="Default title size"
        value={block.props.titleSize ?? 'h3'}
        onChange={(e) =>
          onChange({
            ...block,
            props: { titleSize: e.target.value as StepsProps['titleSize'] },
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
  );
}
