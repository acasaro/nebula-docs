import { useState } from 'react';
import { useNavigate } from 'react-router';
import { createPage, useSubscribeToPagesInSpace } from '@mcoe/firebase';
import type { SpaceId } from '@mcoe/schemas';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

const SPACE_ID: SpaceId = 'developers';

export function PageList() {
  const navigate = useNavigate();
  const state = useSubscribeToPagesInSpace(SPACE_ID);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title || !slug) return;
    setError(null);
    setCreating(true);
    try {
      const page = await createPage({ spaceId: SPACE_ID, title, slug });
      navigate(`/page/${page.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page');
      setCreating(false);
    }
  };

  return (
    <>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
      >
        <Typography variant="h4">Pages — {SPACE_ID}</Typography>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          New page
        </Button>
      </Stack>

      {state.status === 'loading' ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : state.status === 'error' ? (
        <Typography color="error">{state.error.message}</Typography>
      ) : state.pages.length === 0 ? (
        <Typography color="text.secondary">
          No pages yet — click "New page" to create one.
        </Typography>
      ) : (
        <List>
          {state.pages.map((page) => (
            <ListItem
              key={page.id}
              disablePadding
              secondaryAction={
                <Chip
                  label={page.status}
                  size="small"
                  color={page.status === 'published' ? 'success' : 'default'}
                />
              }
            >
              <ListItemButton onClick={() => navigate(`/page/${page.id}`)}>
                <ListItemText
                  primary={page.title}
                  secondary={`/${page.spaceId}/${page.slug}`}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>New page</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error ? <Typography color="error">{error}</Typography> : null}
            <TextField
              label="Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <TextField
              label="Slug"
              fullWidth
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              helperText={`URL path under /${SPACE_ID}/`}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={creating || !title || !slug}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
