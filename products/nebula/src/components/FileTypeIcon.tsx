import {
  Atom,
  Braces,
  File as FileIcon,
  FileCode,
  FileImage,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconSpec {
  Icon: LucideIcon;
  className: string;
}

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']);
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

function spec(name: string): IconSpec {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (IMAGE_EXTS.has(ext)) return { Icon: FileImage, className: 'text-emerald-500' };
  if (ext === 'json') return { Icon: Braces, className: 'text-orange-500' };
  if (ext === 'mdx') return { Icon: FileText, className: 'text-amber-500' };
  if (ext === 'md') return { Icon: FileText, className: 'text-sky-400' };
  if (ext === 'jsx' || ext === 'tsx')
    return { Icon: Atom, className: 'text-sky-500' };
  if (ext === 'js' || ext === 'ts')
    return { Icon: FileCode, className: 'text-yellow-500' };
  if (ext === 'yaml' || ext === 'yml')
    return { Icon: FileText, className: 'text-rose-400' };
  if (ext === 'css' || ext === 'scss')
    return { Icon: FileCode, className: 'text-purple-400' };
  if (ext === 'html') return { Icon: FileCode, className: 'text-orange-400' };
  return { Icon: FileIcon, className: 'text-muted-foreground' };
}

interface FileTypeIconProps {
  name: string;
  className?: string;
}

export function FileTypeIcon({ name, className }: FileTypeIconProps) {
  const { Icon, className: tone } = spec(name);
  return <Icon className={cn('size-3.5 shrink-0', tone, className)} />;
}
