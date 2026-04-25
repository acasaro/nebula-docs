import {
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import type { Block } from '@mcoe/schemas';
import { Iconify } from 'src/components/iconify';
import { getEditForm } from './edit-forms/registry';

export interface BlockEditorProps {
  block: Block;
  onChange: (block: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function BlockEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: BlockEditorProps) {
  const Form = getEditForm(block);

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardHeader
        title={block.type}
        titleTypographyProps={{ variant: 'overline', color: 'text.secondary' }}
        action={
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Move up">
              <span>
                <IconButton size="small" disabled={isFirst} onClick={onMoveUp}>
                  <Iconify icon="solar:double-alt-arrow-up-bold-duotone" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton size="small" disabled={isLast} onClick={onMoveDown}>
                  <Iconify icon="solar:double-alt-arrow-down-bold-duotone" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Delete block">
              <IconButton size="small" color="error" onClick={onDelete}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </Stack>
        }
        sx={{ pb: 1 }}
      />
      <CardContent>
        <Form block={block} onChange={onChange} />
      </CardContent>
    </Card>
  );
}
