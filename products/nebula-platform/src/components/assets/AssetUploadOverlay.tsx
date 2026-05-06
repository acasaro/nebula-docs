import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';

interface AssetUploadOverlayProps {
  onFiles: (files: File[]) => void;
  /** When true, the overlay is rendered as long as a drag is in progress. */
  enabled?: boolean;
}

/**
 * Document-level drag-and-drop overlay. Activates as soon as the user drags
 * files over the page. Captures the drop and forwards the files to the parent.
 */
export function AssetUploadOverlay({
  onFiles,
  enabled = true,
}: AssetUploadOverlayProps) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let depth = 0;

    const hasFiles = (e: DragEvent) =>
      e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');

    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth += 1;
      setActive(true);
    };
    const onOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setActive(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setActive(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length > 0) onFiles(files);
    };

    window.addEventListener('dragenter', onEnter);
    window.addEventListener('dragover', onOver);
    window.addEventListener('dragleave', onLeave);
    window.addEventListener('drop', onDrop);

    return () => {
      window.removeEventListener('dragenter', onEnter);
      window.removeEventListener('dragover', onOver);
      window.removeEventListener('dragleave', onLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [enabled, onFiles]);

  if (!active) return null;

  return (
    <div className='pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
      <div className='flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/60 bg-card px-12 py-10 text-center shadow-xl'>
        <div className='flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
          <Upload className='size-6' />
        </div>
        <div>
          <div className='text-base font-semibold'>Drop to upload</div>
          <div className='text-sm text-muted-foreground'>
            Files will be added to your asset library
          </div>
        </div>
      </div>
    </div>
  );
}
