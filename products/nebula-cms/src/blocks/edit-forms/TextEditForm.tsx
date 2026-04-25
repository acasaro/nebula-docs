import { TextField } from '@mui/material';
import type { TextBlock } from '@mcoe/schemas';

export interface TextEditFormProps {
  block: TextBlock;
  onChange: (block: TextBlock) => void;
}

export function TextEditForm({ block, onChange }: TextEditFormProps) {
  return (
    <TextField
      label="Markdown"
      multiline
      minRows={3}
      maxRows={20}
      fullWidth
      value={block.props.markdown}
      onChange={(e) =>
        onChange({ ...block, props: { markdown: e.target.value } })
      }
      helperText="Inline marks: **bold**, *italic*, `code`, [link](url)"
    />
  );
}
