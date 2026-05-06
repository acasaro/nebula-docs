import { ImagePlus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AssetEmptyStateProps {
  filtered: boolean;
  onUploadClick?: () => void;
}

export function AssetEmptyState({ filtered, onUploadClick }: AssetEmptyStateProps) {
  if (filtered) {
    return (
      <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-8 py-16 text-center'>
        <h3 className='text-base font-semibold text-foreground'>No matches</h3>
        <p className='mt-1 max-w-md text-sm text-muted-foreground'>
          Try clearing the search or selecting a different category.
        </p>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-8 py-16 text-center'>
      <div className='flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
        <ImagePlus className='size-6' />
      </div>
      <h3 className='mt-4 text-base font-semibold text-foreground'>
        No assets yet
      </h3>
      <p className='mt-1 max-w-md text-sm text-muted-foreground'>
        Drag and drop images, videos, or files anywhere on this page to upload
        them. Or click the button to pick from your device.
      </p>
      {onUploadClick ? (
        <Button className='mt-6' onClick={onUploadClick}>
          <Upload className='size-4' />
          Upload files
        </Button>
      ) : null}
    </div>
  );
}
