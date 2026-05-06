import { useEffect, useState } from 'react';
import { Check, Copy, FileVideo, File as FileIcon, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  formatBytes,
  updateAssetDoc,
  type Asset,
} from '@/lib/assets';
import { cn } from '@/lib/utils';

interface AssetDetailDrawerProps {
  asset: Asset | null;
  onClose: () => void;
  onDelete: (asset: Asset) => void;
  onCopyMdx: (asset: Asset) => void;
  onCopyUrl: (asset: Asset) => void;
}

export function AssetDetailDrawer({
  asset,
  onClose,
  onDelete,
  onCopyMdx,
  onCopyUrl,
}: AssetDetailDrawerProps) {
  const [displayName, setDisplayName] = useState('');
  const [alt, setAlt] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDisplayName(asset?.displayName ?? '');
    setAlt(asset?.alt ?? '');
    setSavedFlash(false);
  }, [asset]);

  useEffect(() => {
    if (!asset) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [asset, onClose]);

  if (!asset) return null;

  const dirty = displayName !== asset.displayName || alt !== asset.alt;

  const onSave = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      await updateAssetDoc(asset.id, { displayName, alt });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className='fixed inset-0 z-40 bg-black/30 backdrop-blur-sm'
        onClick={onClose}
        aria-hidden
      />
      <aside className='fixed right-0 top-0 z-50 flex h-full w-[420px] max-w-full flex-col border-l bg-background shadow-2xl'>
        <header className='flex items-center justify-between border-b px-4 py-3'>
          <div className='min-w-0'>
            <div className='line-clamp-1 text-sm font-semibold'>
              {asset.displayName}
            </div>
            <div className='text-xs text-muted-foreground'>{asset.mime}</div>
          </div>
          <Button variant='ghost' size='icon-sm' onClick={onClose}>
            <X className='size-4' />
            <span className='sr-only'>Close</span>
          </Button>
        </header>

        <div className='flex-1 overflow-auto'>
          <div className='flex aspect-video w-full items-center justify-center overflow-hidden bg-muted/40'>
            {asset.category === 'image' ? (
              <img
                src={asset.downloadUrl}
                alt={asset.alt || asset.displayName}
                className='max-h-full max-w-full object-contain'
              />
            ) : asset.category === 'video' ? (
              <video
                src={asset.downloadUrl}
                controls
                className='max-h-full max-w-full'
              />
            ) : (
              <div className='flex flex-col items-center gap-2 text-muted-foreground'>
                <FileIcon className='size-12' />
                <a
                  href={asset.downloadUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-xs underline'>
                  Open file
                </a>
              </div>
            )}
          </div>

          <div className='space-y-5 px-4 py-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='asset-name'>Name</Label>
              <Input
                id='asset-name'
                value={displayName}
                onChange={(e) => setDisplayName(e.currentTarget.value)}
                onBlur={onSave}
              />
            </div>

            {asset.category === 'image' ? (
              <div className='space-y-1.5'>
                <Label htmlFor='asset-alt'>Alt text</Label>
                <Input
                  id='asset-alt'
                  placeholder='Describe the image for screen readers'
                  value={alt}
                  onChange={(e) => setAlt(e.currentTarget.value)}
                  onBlur={onSave}
                />
              </div>
            ) : null}

            <div className='flex flex-wrap items-center gap-2 text-xs'>
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-muted-foreground transition-opacity',
                  saving ? 'opacity-100' : 'opacity-0',
                )}>
                Saving…
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-emerald-600 transition-opacity',
                  savedFlash ? 'opacity-100' : 'opacity-0',
                )}>
                <Check className='size-3' />
                Saved
              </span>
            </div>

            <div className='grid grid-cols-2 gap-2'>
              <Button variant='outline' onClick={() => onCopyUrl(asset)}>
                <Copy className='size-4' />
                Copy URL
              </Button>
              <Button variant='outline' onClick={() => onCopyMdx(asset)}>
                <Copy className='size-4' />
                Copy MDX
              </Button>
            </div>

            <div className='rounded-lg border bg-muted/30 p-3'>
              <h4 className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
                Details
              </h4>
              <dl className='grid grid-cols-[100px_1fr] gap-y-1.5 text-xs'>
                <dt className='text-muted-foreground'>Type</dt>
                <dd className='flex items-center gap-1'>
                  <Badge variant='outline' className='text-[10px]'>
                    {asset.category}
                  </Badge>
                  {asset.mime}
                </dd>
                <dt className='text-muted-foreground'>Size</dt>
                <dd>{formatBytes(asset.size)}</dd>
                {asset.width && asset.height ? (
                  <>
                    <dt className='text-muted-foreground'>Dimensions</dt>
                    <dd>
                      {asset.width} × {asset.height}
                    </dd>
                  </>
                ) : null}
                <dt className='text-muted-foreground'>Filename</dt>
                <dd className='truncate' title={asset.filename}>
                  {asset.filename}
                </dd>
                <dt className='text-muted-foreground'>Uploaded by</dt>
                <dd className='truncate'>
                  {asset.uploadedByName ?? asset.uploadedBy}
                </dd>
                <dt className='text-muted-foreground'>Env</dt>
                <dd>{asset.env}</dd>
              </dl>
            </div>
          </div>
        </div>

        <footer className='flex items-center gap-2 border-t bg-card px-4 py-3'>
          <Button
            variant='destructive'
            size='sm'
            className='ml-auto'
            onClick={() => onDelete(asset)}>
            <Trash2 className='size-4' />
            Delete
          </Button>
        </footer>
      </aside>
    </>
  );
}
