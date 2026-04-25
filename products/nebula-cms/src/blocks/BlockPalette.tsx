import { useState, type MouseEvent } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import type { BlockType } from '@mcoe/schemas';
import { Iconify } from 'src/components/iconify';

const BLOCK_TYPES: BlockType[] = [
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
}

export function BlockPalette({ onAdd }: BlockPaletteProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const open = (e: MouseEvent<HTMLButtonElement>) => setAnchor(e.currentTarget);
  const close = () => setAnchor(null);

  return (
    <>
      <Button
        variant="outlined"
        onClick={open}
        startIcon={<Iconify icon="solar:add-circle-bold" />}
      >
        Add block
      </Button>
      <Menu open={!!anchor} anchorEl={anchor} onClose={close}>
        {BLOCK_TYPES.map((type) => (
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
