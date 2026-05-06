import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatBytes, type UploadHandle } from '@/lib/assets';

interface AssetUploadProgressProps {
  handles: UploadHandle[];
  onDismiss: (id: string) => void;
  onClear: () => void;
}

export function AssetUploadProgress({
  handles,
  onDismiss,
  onClear,
}: AssetUploadProgressProps) {
  if (handles.length === 0) return null;

  const inFlight = handles.filter(
    (h) =>
      h.status.kind === 'queued' ||
      h.status.kind === 'uploading',
  ).length;

  return (
    <div className='fixed bottom-6 right-6 z-40 flex w-[360px] flex-col overflow-hidden rounded-xl border bg-background shadow-xl'>
      <div className='flex items-center justify-between border-b px-3 py-2'>
        <div className='text-sm font-semibold'>
          {inFlight > 0
            ? `Uploading ${inFlight} file${inFlight === 1 ? '' : 's'}`
            : 'Uploads'}
        </div>
        <Button variant='ghost' size='xs' onClick={onClear}>
          Clear done
        </Button>
      </div>
      <div className='max-h-72 overflow-auto'>
        {handles.map((h) => (
          <div key={h.id} className='border-b px-3 py-2 last:border-b-0'>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0 flex-1'>
                <div className='line-clamp-1 text-xs font-medium'>
                  {h.file.name}
                </div>
                <div className='text-[11px] text-muted-foreground'>
                  {formatBytes(h.file.size)}
                  {h.status.kind === 'uploading'
                    ? ` · ${Math.round(h.status.progress)}%`
                    : null}
                  {h.status.kind === 'success' ? ' · Uploaded' : null}
                  {h.status.kind === 'canceled' ? ' · Canceled' : null}
                  {h.status.kind === 'error' ? ` · ${h.status.message}` : null}
                </div>
              </div>
              {h.status.kind === 'success' ? (
                <div className='flex size-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'>
                  <Check className='size-3.5' />
                </div>
              ) : (
                <Button
                  variant='ghost'
                  size='icon-xs'
                  onClick={() => {
                    if (
                      h.status.kind === 'uploading' ||
                      h.status.kind === 'queued'
                    ) {
                      h.cancel();
                    } else {
                      onDismiss(h.id);
                    }
                  }}>
                  <X className='size-3.5' />
                </Button>
              )}
            </div>
            {h.status.kind === 'uploading' ? (
              <Progress className='mt-2' value={h.status.progress} />
            ) : null}
            {h.status.kind === 'queued' ? (
              <Progress className='mt-2' value={0} />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
