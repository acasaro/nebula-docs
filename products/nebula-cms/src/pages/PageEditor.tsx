import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  publishPage,
  savePageDraft,
  useSubscribeToPageById,
} from '@mcoe/firebase';
import type { Block, BlockType, Page, SpaceId } from '@mcoe/schemas';
import { BlockEditor } from 'src/blocks/BlockEditor';
import { BlockPalette } from 'src/blocks/BlockPalette';
import { newBlockOfType } from 'src/blocks/edit-forms/registry';

const SPACE_ID: SpaceId = 'developers';

export function PageEditor() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const state = useSubscribeToPageById(SPACE_ID, pageId ?? '');
  const [draft, setDraft] = useState<Page | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Hydrate draft once when the page loads. After that, our local edits are
  // authoritative — incoming snapshots could overwrite in-flight edits.
  useEffect(() => {
    if (state.status === 'success' && state.page && !draft) {
      setDraft(state.page);
    }
  }, [state, draft]);

  if (!pageId) return <Typography color="error">Missing page id</Typography>;
  if (state.status === 'loading' || !draft) return <CircularProgress />;
  if (state.status === 'error')
    return <Typography color="error">{state.error.message}</Typography>;
  if (state.page === null && !draft)
    return <Typography color="error">Page not found</Typography>;

  const updateDraft = (patch: Partial<Page>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d));

  const updateBlockAt = (idx: number, block: Block) => {
    if (!draft) return;
    const blocks = draft.blocks.slice();
    blocks[idx] = block;
    updateDraft({ blocks });
  };

  const deleteBlockAt = (idx: number) => {
    if (!draft) return;
    updateDraft({ blocks: draft.blocks.filter((_, i) => i !== idx) });
  };

  const moveBlockBy = (idx: number, delta: -1 | 1) => {
    if (!draft) return;
    const target = idx + delta;
    if (target < 0 || target >= draft.blocks.length) return;
    const blocks = draft.blocks.slice();
    [blocks[idx], blocks[target]] = [blocks[target]!, blocks[idx]!];
    updateDraft({ blocks });
  };

  const addBlock = (type: BlockType) => {
    if (!draft) return;
    updateDraft({ blocks: [...draft.blocks, newBlockOfType(type)] });
  };

  const handleSaveDraft = async () => {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      await savePageDraft({
        spaceId: draft.spaceId,
        pageId: draft.id,
        title: draft.title,
        blocks: draft.blocks,
      });
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      await savePageDraft({
        spaceId: draft.spaceId,
        pageId: draft.id,
        title: draft.title,
        blocks: draft.blocks,
      });
      await publishPage(draft.spaceId, draft.id);
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Button onClick={() => navigate('/')} size="small">
            ← Pages
          </Button>
          <Chip
            label={draft.status}
            size="small"
            color={draft.status === 'published' ? 'success' : 'default'}
          />
          {savedAt ? (
            <Typography variant="caption" color="text.secondary">
              Saved {new Date(savedAt).toLocaleTimeString()}
            </Typography>
          ) : null}
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button onClick={handleSaveDraft} disabled={busy}>
            Save draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={busy}
            variant="contained"
          >
            Publish
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      <TextField
        label="Title"
        value={draft.title}
        onChange={(e) => updateDraft({ title: e.target.value })}
        fullWidth
      />
      <TextField
        label="Slug"
        value={draft.slug}
        onChange={(e) => updateDraft({ slug: e.target.value })}
        fullWidth
        helperText={`URL: /${draft.spaceId}/${draft.slug}`}
      />

      <Box>
        {draft.blocks.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No blocks yet — add one below.
          </Typography>
        ) : (
          draft.blocks.map((block, idx) => (
            <BlockEditor
              key={block.id}
              block={block}
              isFirst={idx === 0}
              isLast={idx === draft.blocks.length - 1}
              onChange={(b) => updateBlockAt(idx, b)}
              onDelete={() => deleteBlockAt(idx)}
              onMoveUp={() => moveBlockBy(idx, -1)}
              onMoveDown={() => moveBlockBy(idx, 1)}
            />
          ))
        )}
      </Box>

      <BlockPalette onAdd={addBlock} />
    </Stack>
  );
}
