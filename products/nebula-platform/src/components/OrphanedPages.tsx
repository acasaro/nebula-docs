import { FileTypeIcon } from '@/components/FileTypeIcon';
import { DragRow } from '@/components/NavDnd';
import { cn } from '@/lib/utils';

export const ORPHAN_ID_PREFIX = 'orphan:';

interface OrphanedPagesProps {
  paths: readonly string[];
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
  /**
   * Repo paths to strip from the visible label. The full path is what we
   * pass to onSelectPath; the displayed label drops `<docsSubdirectory>/`
   * and the leading `content/` so the row reads like a NavTree page.
   */
  docsSubdirectory?: string;
}

function displayLabel(path: string, docsSubdirectory: string): string {
  const sub = docsSubdirectory.replace(/\/+$/, '');
  let p = sub && path.startsWith(sub + '/') ? path.slice(sub.length + 1) : path;
  if (p.startsWith('content/')) p = p.slice('content/'.length);
  return p.replace(/\.(mdx|md)$/, '');
}

export function OrphanedPages({
  paths,
  selectedPath,
  onSelectPath,
  docsSubdirectory = '',
}: OrphanedPagesProps) {
  if (paths.length === 0) return null;
  return (
    <div className='mt-4 flex flex-col gap-1 px-2 pb-2'>
      <div
        className='flex items-center justify-between px-2 pt-1 pb-1 text-xs text-muted-foreground/70'
        title='MDX files on disk that aren’t referenced in docs.json. Drag into Navigation or delete to clean up.'>
        <span>Orphaned pages · {paths.length}</span>
      </div>
      <div className='flex flex-col gap-0.5'>
        {paths.map((path) => {
          const isSelected = selectedPath === path;
          return (
            <DragRow key={path} id={`${ORPHAN_ID_PREFIX}${path}`} droppable={false}>
              <button
                type='button'
                onClick={() => onSelectPath(path)}
                className={cn(
                  'flex h-8 w-full items-center gap-1.5 rounded-xl px-2 text-left text-sm font-medium transition-colors',
                  isSelected
                    ? 'bg-accent text-accent-foreground'
                    : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground',
                )}
                style={{ marginLeft: 8 }}
                title={path}>
                <FileTypeIcon name={path} />
                <span className='truncate'>{displayLabel(path, docsSubdirectory)}</span>
              </button>
            </DragRow>
          );
        })}
      </div>
    </div>
  );
}
