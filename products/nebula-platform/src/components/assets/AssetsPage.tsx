import { useCallback, useMemo, useRef, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageLoader } from '@/components/ui/PageLoader';
import {
  formatBytes,
  useAssetDelete,
  useAssetUpload,
  useAssets,
  type Asset,
} from '@/lib/assets';
import { AssetDetailDrawer } from './AssetDetailDrawer';
import { AssetEmptyState } from './AssetEmptyState';
import { AssetGrid } from './AssetGrid';
import {
  AssetToolbar,
  type AssetCategoryFilter,
  type AssetSort,
} from './AssetToolbar';
import { AssetUploadOverlay } from './AssetUploadOverlay';
import { AssetUploadProgress } from './AssetUploadProgress';

function buildMdx(asset: Asset): string {
  if (asset.category === 'image') {
    return `<Frame${asset.alt ? ` caption="${escapeAttr(asset.alt)}"` : ''}>\n  <img src="${asset.downloadUrl}" alt="${escapeAttr(asset.alt || asset.displayName)}" />\n</Frame>`;
  }
  if (asset.category === 'video') {
    return `<video src="${asset.downloadUrl}" controls />`;
  }
  return `[${asset.displayName}](${asset.downloadUrl})`;
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}

function applyFilter(
  assets: Asset[],
  filter: AssetCategoryFilter,
  search: string,
): Asset[] {
  const q = search.trim().toLowerCase();
  return assets.filter((a) => {
    if (filter !== 'all' && a.category !== filter) return false;
    if (q && !a.displayName.toLowerCase().includes(q) && !a.filename.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });
}

function applySort(assets: Asset[], sort: AssetSort): Asset[] {
  const copy = [...assets];
  if (sort === 'name') {
    copy.sort((a, b) => a.displayName.localeCompare(b.displayName));
  } else if (sort === 'size') {
    copy.sort((a, b) => b.size - a.size);
  } else if (sort === 'oldest') {
    copy.sort((a, b) => seconds(a.uploadedAt) - seconds(b.uploadedAt));
  } else {
    copy.sort((a, b) => seconds(b.uploadedAt) - seconds(a.uploadedAt));
  }
  return copy;
}

function seconds(ts: Asset['uploadedAt']): number {
  // Server-set Timestamp has `seconds`; optimistic local has it too.
  return (ts as unknown as { seconds?: number })?.seconds ?? 0;
}

export function AssetsPage() {
  const state = useAssets();
  const upload = useAssetUpload();
  const del = useAssetDelete();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<AssetCategoryFilter>('all');
  const [sort, setSort] = useState<AssetSort>('recent');
  const [active, setActive] = useState<Asset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFiles = useCallback(
    (files: File[]) => {
      void upload.uploadFiles(files);
    },
    [upload],
  );

  const onCopyUrl = useCallback(async (asset: Asset) => {
    try {
      await navigator.clipboard.writeText(asset.downloadUrl);
    } catch {
      /* ignored */
    }
  }, []);

  const onCopyMdx = useCallback(async (asset: Asset) => {
    try {
      await navigator.clipboard.writeText(buildMdx(asset));
    } catch {
      /* ignored */
    }
  }, []);

  const onRename = useCallback((asset: Asset) => {
    setActive(asset);
    // Drawer auto-focuses the name input via prop change.
  }, []);

  const onDelete = useCallback(
    async (asset: Asset) => {
      if (!confirm(`Delete "${asset.displayName}"? This can't be undone.`)) return;
      try {
        await del.deleteAsset(asset);
        if (active?.id === asset.id) setActive(null);
      } catch (err) {
        alert(`Couldn't delete: ${err instanceof Error ? err.message : err}`);
      }
    },
    [active, del],
  );

  if (state.status === 'loading') {
    return (
      <div className='mx-auto flex max-w-6xl justify-center py-16'>
        <PageLoader />
      </div>
    );
  }

  if (state.status === 'no-repo') {
    return (
      <div className='mx-auto flex max-w-3xl flex-col gap-6'>
        <header>
          <h1 className='text-2xl font-semibold tracking-tight'>Assets</h1>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Connect a repo first</CardTitle>
            <CardDescription>
              Assets are scoped to a docs repo. Connect one to start uploading.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to='/settings/git'>
                Configure repo
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className='mx-auto flex max-w-3xl flex-col gap-6'>
        <header>
          <h1 className='text-2xl font-semibold tracking-tight'>Assets</h1>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Couldn't load assets</CardTitle>
            <CardDescription>{state.error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant='outline' onClick={() => window.location.reload()}>
              <RefreshCw />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filtered = applySort(applyFilter(state.assets, filter, search), sort);
  const totalBytes = state.assets.reduce((acc, a) => acc + a.size, 0);
  const isFiltered = filter !== 'all' || search.trim().length > 0;

  return (
    <div className='mx-auto flex max-w-6xl flex-col gap-6'>
      <header className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Assets</h1>
          <p className='text-sm text-muted-foreground'>
            {state.assets.length} file{state.assets.length === 1 ? '' : 's'} ·{' '}
            {formatBytes(totalBytes)} stored
          </p>
        </div>
      </header>

      <AssetToolbar
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
        onUploadClick={triggerFilePicker}
        total={state.assets.length}
      />

      <input
        ref={fileInputRef}
        type='file'
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.currentTarget.files ?? []);
          if (files.length) onFiles(files);
          e.currentTarget.value = '';
        }}
      />

      {filtered.length === 0 ? (
        <AssetEmptyState filtered={isFiltered} onUploadClick={triggerFilePicker} />
      ) : (
        <AssetGrid
          assets={filtered}
          onOpen={setActive}
          onCopyUrl={onCopyUrl}
          onCopyMdx={onCopyMdx}
          onRename={onRename}
          onDelete={onDelete}
        />
      )}

      <AssetUploadOverlay onFiles={onFiles} />
      <AssetUploadProgress
        handles={upload.handles}
        onDismiss={upload.dismiss}
        onClear={upload.dismissCompleted}
      />
      <AssetDetailDrawer
        asset={active}
        onClose={() => setActive(null)}
        onDelete={onDelete}
        onCopyUrl={onCopyUrl}
        onCopyMdx={onCopyMdx}
      />
    </div>
  );
}
