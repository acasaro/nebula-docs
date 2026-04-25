import { useState, type MouseEvent } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import type { BlockType } from '@mcoe/schemas';
import { Iconify } from 'src/components/iconify';

const ALL_BLOCK_TYPES: BlockType[] = [
  'heading',
  'text',
  'callout',
  'icon',
  'frame',
  'video',
  'steps',
  'step',
];

export interface BlockPaletteProps {
  onAdd: (type: BlockType) => void;
  allowedTypes?: BlockType[];
}

export function BlockPalette({ onAdd, allowedTypes }: BlockPaletteProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const types = allowedTypes ?? ALL_BLOCK_TYPES;

  const open = (e: MouseEvent<HTMLButtonElement>) => setAnchor(e.currentTarget);
  const close = () => setAnchor(null);

  return (
    <>
      <Button
        size="small"
        variant="text"
        onClick={open}
        startIcon={<Iconify icon="solar:add-circle-bold" />}
        sx={{ color: 'text.secondary' }}
      >
        Add block
      </Button>
      <Menu open={!!anchor} anchorEl={anchor} onClose={close}>
        {types.map((type) => (
          <MenuItem
            key={type}
            onClick={() => {
              onAdd(type);
              close();
            }}
          >
            {type}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
