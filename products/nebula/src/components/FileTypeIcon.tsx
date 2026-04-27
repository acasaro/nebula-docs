import { fileIconUrl } from '@/lib/fileIcons';
import { cn } from '@/lib/utils';

const BINARY_EXTS = new Set<string>([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp',
  'ico',
  'pdf',
  'zip',
  'gz',
  'tar',
  'mp3',
  'mp4',
  'mov',
  'wav',
  'woff',
  'woff2',
  'ttf',
  'otf',
]);

export function isBinaryFile(name: string): boolean {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return BINARY_EXTS.has(ext);
}

interface FileTypeIconProps {
  name: string;
  className?: string;
}

export function FileTypeIcon({ name, className }: FileTypeIconProps) {
  return (
    <img
      src={fileIconUrl(name)}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn('size-3.5 shrink-0 select-none', className)}
    />
  );
}
