import { useState, type MouseEvent, type ReactNode } from 'react';
import {
  Box,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Tooltip,
} from '@mui/material';
import { Iconify } from 'src/components/iconify';

export interface BlockChromeProps {
  children: ReactNode;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  /**
   * Optional secondary settings shown in a popover when the user picks the
   * "Settings" item from the dropdown menu.
   */
  settings?: ReactNode;
}

/**
 * Mintlify-style block chrome: a single ⋮ button on the right margin, faded
 * by default, fading in on hover. Click to open a dropdown with
 * Move up / Move down / Settings / Delete. No multi-icon toolbar.
 */
export function BlockChrome({
  children,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  settings,
}: BlockChromeProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);

  const openMenu = (e: MouseEvent<HTMLButtonElement>) =>
    setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const openSettings = () => {
    setSettingsAnchor(menuAnchor);
    setMenuAnchor(null);
  };
  const closeSettings = () => setSettingsAnchor(null);

  return (
    <Box
      sx={{
        position: 'relative',
        '&:hover .nebula-chrome, &:focus-within .nebula-chrome': {
          opacity: 1,
        },
      }}
    >
      <Box
        className="nebula-chrome"
        sx={{
          position: 'absolute',
          top: 4,
          right: -32,
          opacity: 0,
          transition: 'opacity 0.15s ease',
          zIndex: 2,
        }}
      >
        <Tooltip title="Block menu">
          <IconButton size="small" onClick={openMenu}>
            <Iconify icon="solar:menu-dots-bold-duotone" width={16} />
          </IconButton>
        </Tooltip>
      </Box>

      {children}

      <Menu open={!!menuAnchor} anchorEl={menuAnchor} onClose={closeMenu}>
        {onMoveUp ? (
          <MenuItem
            disabled={isFirst}
            onClick={() => {
              onMoveUp();
              closeMenu();
            }}
          >
            Move up
          </MenuItem>
        ) : null}
        {onMoveDown ? (
          <MenuItem
            disabled={isLast}
            onClick={() => {
              onMoveDown();
              closeMenu();
            }}
          >
            Move down
          </MenuItem>
        ) : null}
        {settings ? <MenuItem onClick={openSettings}>Settings…</MenuItem> : null}
        <Divider />
        <MenuItem
          onClick={() => {
            onDelete();
            closeMenu();
          }}
          sx={{ color: 'error.main' }}
        >
          Delete
        </MenuItem>
      </Menu>

      {settings ? (
        <Popover
          open={!!settingsAnchor}
          anchorEl={settingsAnchor}
          onClose={closeSettings}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ p: 2, minWidth: 320, maxWidth: 480 }}>{settings}</Box>
        </Popover>
      ) : null}
    </Box>
  );
}
