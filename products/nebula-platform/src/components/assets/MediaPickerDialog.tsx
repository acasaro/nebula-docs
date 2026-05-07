import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileVideo, ImagePlus, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  formatBytes,
  useAssetUpload,
  useAssets,
  type Asset,
  type AssetCategory,
} from '@/lib/assets';
import { cn } from '@/lib/utils';
import { VideoThumbnail } from './VideoThumbnail';

export interface PickedMedia {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
  asset: Asset;
}

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (media: PickedMedia) => void;
  /** Asset category to surface. Drives the filter, the upload accept hint,
   *  the dialog title, and whether tiles render with image vs video preview. */
  category?: AssetCategory;
}

const COPY: Record<
  AssetCategory,
  { title: string; empty: string; search: string; drop: string; emptyIcon: typeof Upload }
> = {
  image: {
    title: 'Insert image',
    empty: 'No images uploaded yet',
    search: 'Search images',
    drop: 'Drop images here',
    emptyIcon: ImagePlus,
  },
  video: {
    title: 'Insert video',
    empty: 'No videos uploaded yet',
    search: 'Search videos',
    drop: 'Drop videos here',
    emptyIcon: FileVideo,
  },
  file: {
    title: 'Insert file',
    empty: 'No files uploaded yet',
    search: 'Search files',
    drop: 'Drop files here',
    emptyIcon: Upload,
  },
};

export function MediaPickerDialog({
  open,
  onOpenChange,
  onPick,
  category = 'image',
}: MediaPickerDialogProps) {
  const state = useAssets();
  const upload = useAssetUpload();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'library' | 'upload'>('library');
  const [dropActive, setDropActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const copy = COPY[category];

  useEffect(() => {
    if (!open) {
      setSearch('');
      setTab('library');
    }
  }, [open]);

  const items = useMemo(() => {
    if (state.status !== 'ready') return [];
    const q = search.trim().toLowerCase();
    return state.assets.filter((a) => {
      if (a.category !== category) return false;
      if (q && !a.displayName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [category, search, state]);

  const choose = useCallback(
    (asset: Asset) => {
      onPick({
        src: asset.downloadUrl,
        alt: asset.alt || asset.displayName,
        width: asset.width,
        height: asset.height,
        asset,
      });
      onOpenChange(false);
    },
    [onPick, onOpenChange],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      // Browsers report MIME type per the file's binary signature, so the
      // category match here is the same one the upload pipeline applies on
      // the server side via `categoryFromMime`.
      const mimePrefix =
        category === 'image' ? 'image/' : category === 'video' ? 'video/' : '';
      const filtered = mimePrefix
        ? files.filter((f) => f.type.startsWith(mimePrefix))
        : files;
      if (filtered.length === 0) return;
      const results = await upload.uploadFiles(filtered);
      const first = results.find((r) => r.asset);
      if (first?.asset) choose(first.asset);
    },
    [category, choose, upload],
  );

  const accept =
    category === 'image' ? 'image/*' : category === 'video' ? 'video/*' : undefined;
  const EmptyIcon = copy.emptyIcon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl p-0'>
        <DialogHeader className='px-6 pb-3 pt-6'>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <div className='border-b px-6'>
            <TabsList variant='line'>
              <TabsTrigger value='library'>Library</TabsTrigger>
              <TabsTrigger value='upload'>Upload</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='library' className='m-0'>
            <div className='border-b px-6 py-3'>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  placeholder={copy.search}
                  className='pl-8'
                />
              </div>
            </div>

            <div className='max-h-[420px] overflow-auto px-6 py-4'>
              {state.status !== 'ready' ? (
                <div className='py-12 text-center text-sm text-muted-foreground'>
                  Loading library…
                </div>
              ) : items.length === 0 ? (
                <div className='flex flex-col items-center gap-3 py-12 text-center'>
                  <div className='flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground'>
                    <EmptyIcon className='size-5' />
                  </div>
                  <div className='text-sm font-medium'>
                    {search ? 'No matches' : copy.empty}
                  </div>
                  {!search ? (
                    <Button size='sm' onClick={() => setTab('upload')}>
                      <Upload className='size-4' />
                      Upload
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className='grid grid-cols-3 gap-3 sm:grid-cols-4'>
                  {items.map((asset) => (
                    <PickerTile
                      key={asset.id}
                      asset={asset}
                      onClick={() => choose(asset)}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value='upload' className='m-0'>
            <div
              className={cn(
                'm-6 flex h-72 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors',
                dropActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/20',
              )}
              onDragEnter={(e) => {
                e.preventDefault();
                setDropActive(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDragLeave={() => setDropActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDropActive(false);
                const files = Array.from(e.dataTransfer.files ?? []);
                void handleFiles(files);
              }}>
              <div className='flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
                <Upload className='size-6' />
              </div>
              <div className='text-sm font-medium'>{copy.drop}</div>
              <div className='text-xs text-muted-foreground'>
                or click below to browse
              </div>
              <input
                ref={inputRef}
                hidden
                type='file'
                multiple
                accept={accept}
                onChange={(e) => {
                  const files = Array.from(e.currentTarget.files ?? []);
                  void handleFiles(files);
                  e.currentTarget.value = '';
                }}
              />
              <Button
                variant='outline'
                size='sm'
                onClick={() => inputRef.current?.click()}>
                Browse files
              </Button>
            </div>
            {upload.handles.length > 0 ? (
              <div className='mb-6 mx-6 max-h-40 overflow-auto rounded-lg border bg-card'>
                {upload.handles.map((h) => (
                  <div
                    key={h.id}
                    className='flex items-center justify-between gap-2 border-b px-3 py-2 text-xs last:border-b-0'>
                    <span className='line-clamp-1'>{h.file.name}</span>
                    <span className='text-muted-foreground'>
                      {h.status.kind === 'uploading'
                        ? `${Math.round(h.status.progress)}%`
                        : h.status.kind === 'success'
                          ? 'Done'
                          : h.status.kind === 'error'
                            ? 'Failed'
                            : h.status.kind === 'canceled'
                              ? 'Canceled'
                              : 'Queued'}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface PickerTileProps {
  asset: Asset;
  onClick: () => void;
}

function PickerTile({ asset, onClick }: PickerTileProps) {
  const [broken, setBroken] = useState(false);
  return (
    <button
      type='button'
      onClick={onClick}
      className='group flex flex-col overflow-hidden rounded-lg border bg-card text-left text-card-foreground transition-all hover:border-primary hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'>
      <div className='relative flex aspect-square w-full items-center justify-center overflow-hidden bg-muted/40'>
        {broken ? (
          <div className='text-xs text-muted-foreground'>Unavailable</div>
        ) : asset.category === 'video' ? (
          <VideoThumbnail src={asset.downloadUrl} hoverPreview={false} />
        ) : (
          <img
            src={asset.downloadUrl}
            alt={asset.alt || asset.displayName}
            loading='lazy'
            className='size-full object-cover transition-transform group-hover:scale-[1.03]'
            onError={() => setBroken(true)}
          />
        )}
      </div>
      <div className='px-2 py-1.5'>
        <div
          className='line-clamp-1 text-[11px] font-medium'
          title={asset.displayName}>
          {asset.displayName}
        </div>
        <div className='text-[10px] text-muted-foreground'>
          {formatBytes(asset.size)}
        </div>
      </div>
    </button>
  );
}
