import {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { File as FileIcon, Folder, FolderOpen } from 'lucide-react';
import { cn } from '../utils/cn';

interface TreeLevelContextValue {
  level: number;
}

const TreeLevelContext = createContext<TreeLevelContextValue>({ level: 1 });

function calculatePaddingLeft(level: number): number {
  return 6 + (level - 1) * 22;
}

function TreeLevelProvider({
  children,
  level,
}: {
  children: ReactNode;
  level: number;
}) {
  const value = useMemo(() => ({ level }), [level]);
  return (
    <TreeLevelContext.Provider value={value}>
      {children}
    </TreeLevelContext.Provider>
  );
}

export interface TreeProps {
  className?: string;
  children?: ReactNode;
}

function TreeRoot({ className, children }: TreeProps) {
  return (
    <div
      role="tree"
      aria-label="File tree"
      className={cn('my-4', className)}
      data-component-part="tree-root"
    >
      <TreeLevelProvider level={1}>{children}</TreeLevelProvider>
    </div>
  );
}

export interface TreeFileProps {
  name: string;
}

function TreeFile({ name }: TreeFileProps) {
  const { level } = useContext(TreeLevelContext);
  return (
    <div
      role="treeitem"
      aria-level={level}
      aria-selected={false}
      tabIndex={-1}
      className="flex cursor-default items-center gap-1.5 rounded-lg py-1 pr-1.5 text-stone-700 -outline-offset-1 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900"
      style={
        {
          paddingLeft: `${calculatePaddingLeft(level)}px`,
        } as CSSProperties
      }
      data-component-part="tree-file"
    >
      <FileIcon
        aria-hidden="true"
        className="size-4 shrink-0 select-none"
        data-component-part="tree-file-icon"
      />
      <span
        className="truncate font-medium text-sm leading-5 -tracking-[0.1px]"
        title={name}
        data-component-part="tree-file-title"
      >
        {name}
      </span>
    </div>
  );
}

export interface TreeFolderProps {
  name: string;
  defaultOpen?: boolean;
  openable?: boolean;
  children?: ReactNode;
}

function TreeFolder({
  name,
  defaultOpen = false,
  openable = true,
  children,
}: TreeFolderProps) {
  const uniqueId = useId();
  const groupId = `tree-group-${uniqueId}`;
  const { level } = useContext(TreeLevelContext);
  const isOpenable = openable && !!children;
  const [open, setOpen] = useState(isOpenable && defaultOpen);
  const Icon = isOpenable && open ? FolderOpen : Folder;

  return (
    <div
      role="none"
      data-component-part="tree-folder"
      style={
        {
          paddingLeft: `${calculatePaddingLeft(level)}px`,
        } as CSSProperties
      }
    >
      <div
        role="treeitem"
        aria-expanded={isOpenable ? open : undefined}
        aria-level={level}
        aria-owns={isOpenable && open ? groupId : undefined}
        aria-selected={false}
        tabIndex={-1}
        onClick={isOpenable ? () => setOpen((p) => !p) : undefined}
        onKeyDown={
          isOpenable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpen((p) => !p);
                }
              }
            : undefined
        }
        className={cn(
          'flex items-center gap-1.5 rounded-lg py-1 pr-1.5 text-stone-700 -outline-offset-1 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900',
          isOpenable ? 'cursor-pointer' : 'cursor-default',
        )}
        style={{ paddingLeft: 0 }}
      >
        <Icon
          aria-hidden="true"
          className="size-4 shrink-0 select-none"
          data-component-part={
            isOpenable && open ? 'tree-folder-icon-open' : 'tree-folder-icon-closed'
          }
        />
        <span
          className="truncate font-medium text-sm leading-5 -tracking-[0.1px]"
          title={name}
          data-component-part="tree-folder-title"
        >
          {name}
        </span>
      </div>
      {isOpenable && open ? (
        <div
          role="group"
          id={groupId}
          className="relative"
          data-component-part="tree-folder-children-wrapper"
        >
          <div
            aria-hidden="true"
            className="absolute z-10 h-full w-px select-none bg-stone-200 dark:bg-stone-800"
            style={{ left: '8px' }}
            data-component-part="tree-folder-children-line"
          />
          <TreeLevelProvider level={level + 1}>{children}</TreeLevelProvider>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Mintlify-style Tree. Use as `<Tree>` with `<Tree.Folder>` and `<Tree.File>`
 * children. Click on a folder toggles its children. Keyboard nav from the
 * vendor implementation (roving tabindex, ArrowUp/Down, typeahead) is
 * dropped for Phase 3 — re-add when this becomes part of editor UX.
 */
export const Tree = Object.assign(TreeRoot, {
  Folder: TreeFolder,
  File: TreeFile,
});
