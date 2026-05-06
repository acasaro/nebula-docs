import { useState } from 'react';
import { File, FileVideo, ImageOff, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { formatBytes, type Asset } from '@/lib/assets';
import { cn } from '@/lib/utils';

interface AssetCardProps {
  asset: Asset;
  selected?: boolean;
  onClick?: () => void;
  onCopyUrl: () => void;
  onCopyMdx: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function AssetCard({
  asset,
  selected,
  onClick,
  onCopyUrl,
  onCopyMdx,
  onRename,
  onDelete,
}: AssetCardProps) {
  const [broken, setBroken] = useState(false);

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-card text-left text-card-foreground shadow-sm transition-all',
        'hover:shadow-md hover:border-border',
        selected && 'ring-2 ring-primary',
      )}>
      <button
        type='button'
        className='flex aspect-video w-full items-center justify-center overflow-hidden bg-muted/40'
        onClick={onClick}>
        {asset.category === 'image' && !broken ? (
          <img
            src={asset.downloadUrl}
            alt={asset.alt || asset.displayName}
            loading='lazy'
            className='size-full object-cover transition-transform group-hover:scale-[1.02]'
            onError={() => setBroken(true)}
          />
        ) : asset.category === 'image' && broken ? (
          <div className='flex flex-col items-center gap-2 p-4 text-muted-foreground'>
            <ImageOff className='size-8' />
            <span className='text-xs'>Image unavailable</span>
          </div>
        ) : asset.category === 'video' ? (
          <div className='flex flex-col items-center gap-2 p-4 text-muted-foreground'>
            <FileVideo className='size-10' />
            <span className='text-xs uppercase tracking-wide'>Video</span>
          </div>
        ) : (
          <div className='flex flex-col items-center gap-2 p-4 text-muted-foreground'>
            <File className='size-10' />
            <span className='text-xs uppercase tracking-wide'>
              {asset.mime.split('/')[1]?.slice(0, 6) ?? 'File'}
            </span>
          </div>
        )}
      </button>

      <div className='flex items-center gap-2 border-t border-border/40 px-3 py-2'>
        <button
          type='button'
          onClick={onClick}
          className='flex flex-1 flex-col items-start text-left'>
          <div
            className='line-clamp-1 w-full text-xs font-medium text-foreground'
            title={asset.displayName}>
            {asset.displayName}
          </div>
          <div className='text-[11px] text-muted-foreground'>
            {formatBytes(asset.size)}
            {asset.width && asset.height
              ? ` · ${asset.width}×${asset.height}`
              : null}
          </div>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100'>
              <MoreHorizontal className='size-4' />
              <span className='sr-only'>Open actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={onCopyUrl}>Copy URL</DropdownMenuItem>
            <DropdownMenuItem onClick={onCopyMdx}>Copy MDX</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className='text-destructive focus:text-destructive'>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
