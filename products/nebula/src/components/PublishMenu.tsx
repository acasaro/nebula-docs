import { FileTypeIcon } from "@/components/FileTypeIcon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, FileEdit, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";

export interface PublishChange {
  path: string;
  status: "modified" | "added";
}

type RevertTarget = { kind: "one"; path: string } | { kind: "all" };

interface PublishMenuProps {
  currentBranch: string;
  defaultBranch: string;
  changes: PublishChange[];
  saving: boolean;
  creatingPr: boolean;
  message: string | null;
  onSave: () => void | Promise<void>;
  onCreatePr: (title: string, body: string) => Promise<void>;
  onRevert: (path: string) => void;
  onRevertAll: () => void;
}

export function PublishMenu({
  currentBranch,
  defaultBranch,
  changes,
  saving,
  creatingPr,
  message,
  onSave,
  onCreatePr,
  onRevert,
  onRevertAll,
}: PublishMenuProps) {
  const [open, setOpen] = useState(false);
  const [prOpen, setPrOpen] = useState(false);
  const [revertTarget, setRevertTarget] = useState<RevertTarget | null>(null);

  const onDefault = currentBranch === defaultBranch;
  const dirtyCount = changes.length;
  const busy = saving || creatingPr;

  const saveLabel = onDefault ? "Publish" : `Save in ${currentBranch}`;

  return (
    <>
      <Popover.Root open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <Popover.Trigger asChild>
          <button
            type='button'
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
              "bg-primary text-primary-foreground shadow-sm transition-colors",
              "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}>
            Publish
            <ChevronDown className='size-3.5' />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={8}
            align='end'
            className={cn(
              "z-50 w-80 rounded-md border bg-popover p-3 shadow-md",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            )}>
            <ChangesList
              branch={currentBranch}
              changes={changes}
              onRevertOne={(path) => setRevertTarget({ kind: "one", path })}
              onRevertAll={() => setRevertTarget({ kind: "all" })}
            />
            {message ? (
              <p
                className={cn(
                  "mb-2 px-1 text-xs leading-tight",
                  message.startsWith("Save failed") || message.startsWith("PR failed")
                    ? "text-destructive"
                    : "text-emerald-500",
                )}>
                {linkifyMessage(message)}
              </p>
            ) : null}
            <div className='flex flex-col gap-2'>
              <Button
                type='button'
                variant={onDefault ? "default" : "outline"}
                disabled={busy || dirtyCount === 0}
                onClick={async () => {
                  await onSave();
                }}>
                {saving ? "Saving…" : saveLabel}
              </Button>
              {!onDefault ? (
                <Button
                  type='button'
                  disabled={busy}
                  onClick={() => {
                    setOpen(false);
                    setPrOpen(true);
                  }}>
                  Create pull request
                </Button>
              ) : null}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <CreatePrDialog
        open={prOpen}
        onOpenChange={(next) => !creatingPr && setPrOpen(next)}
        currentBranch={currentBranch}
        defaultBranch={defaultBranch}
        changes={changes}
        creating={creatingPr}
        onCreate={onCreatePr}
      />
      <RevertConfirmDialog
        target={revertTarget}
        onCancel={() => setRevertTarget(null)}
        onConfirm={() => {
          if (revertTarget?.kind === "one") onRevert(revertTarget.path);
          else if (revertTarget?.kind === "all") onRevertAll();
          setRevertTarget(null);
        }}
      />
    </>
  );
}

/** Render a status message with any embedded URL turned into a clickable link. */
function linkifyMessage(message: string): React.ReactNode {
  const match = message.match(/(https?:\/\/\S+)/);
  if (!match) return message;
  const [url] = match;
  const i = match.index ?? 0;
  return (
    <>
      {message.slice(0, i)}
      <a
        href={url}
        target='_blank'
        rel='noreferrer'
        className='underline underline-offset-2 hover:no-underline'>
        {url}
      </a>
      {message.slice(i + url.length)}
    </>
  );
}

function ChangesList({
  branch,
  changes,
  onRevertOne,
  onRevertAll,
}: {
  branch: string;
  changes: PublishChange[];
  onRevertOne: (path: string) => void;
  onRevertAll: () => void;
}) {
  if (changes.length === 0) {
    return (
      <div className='mb-3 flex items-center gap-2 px-1 py-2 text-sm text-muted-foreground'>
        <FileEdit className='size-4' />
        No changes yet on{" "}
        <code className='rounded bg-muted px-1 font-mono text-[11px]'>{branch}</code>.
      </div>
    );
  }
  return (
    <div className='mb-3'>
      <div className='group/header flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent/60'>
        <FileEdit className='size-4 text-muted-foreground' />
        <span>
          {changes.length} file change{changes.length === 1 ? "" : "s"}
        </span>
        <button
          type='button'
          onClick={onRevertAll}
          aria-label='Revert all changes'
          className={cn(
            "ml-auto rounded p-0.5 text-muted-foreground opacity-0 transition-opacity",
            "hover:text-foreground group-hover/header:opacity-100 focus-visible:opacity-100",
          )}>
          <Undo2 className='size-3.5' />
        </button>
      </div>
      <ul className='ml-4 max-h-48 overflow-y-auto border-l border-border/40 pl-1'>
        {changes.map((c) => {
          const segments = c.path.split("/");
          const name = segments.pop() ?? c.path;
          const dir = segments.join("/");
          return (
            <li
              key={c.path}
              className='group/row flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/60'>
              <FileTypeIcon name={name} />
              <span className='truncate font-medium'>{name}</span>
              {dir ? <span className='truncate text-xs text-muted-foreground'>{dir}</span> : null}
              <span className='ml-auto text-xs text-muted-foreground group-hover/row:hidden'>
                {c.status === "added" ? "Added" : "Modified"}
              </span>
              <button
                type='button'
                onClick={() => onRevertOne(c.path)}
                aria-label={`Revert changes to ${name}`}
                className={cn(
                  "ml-auto hidden rounded p-0.5 text-muted-foreground transition-colors",
                  "hover:text-foreground group-hover/row:flex focus-visible:flex",
                )}>
                <Undo2 className='size-3.5' />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RevertConfirmDialog({
  target,
  onCancel,
  onConfirm,
}: {
  target: RevertTarget | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const open = target !== null;
  const description =
    target?.kind === "one" ? (
      <>Are you sure you want to undo changes in &ldquo;{basename(target.path)}&rdquo;?</>
    ) : target?.kind === "all" ? (
      <>Are you sure you want to undo all in-progress changes?</>
    ) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Undo changes</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
          <Button type='button' variant='destructive' onClick={onConfirm}>
            Discard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function basename(path: string): string {
  return path.split("/").pop() ?? path;
}

interface CreatePrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBranch: string;
  defaultBranch: string;
  changes: PublishChange[];
  creating: boolean;
  onCreate: (title: string, body: string) => Promise<void>;
}

function CreatePrDialog({
  open,
  onOpenChange,
  currentBranch,
  defaultBranch,
  changes,
  creating,
  onCreate,
}: CreatePrDialogProps) {
  const defaultTitle =
    changes.length === 0
      ? `Updates from ${currentBranch}`
      : changes.length === 1
        ? `Update ${changes[0]!.path}`
        : `Update ${changes.length} files`;
  const [title, setTitle] = useState(defaultTitle);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset to a fresh default each time the dialog opens. Keeps the title
  // in sync with the current changes / branch instead of pinning to
  // whatever was true at first mount.
  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setBody("");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setError(null);
    try {
      await onCreate(trimmedTitle, body);
      setTitle("");
      setBody("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create PR.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create pull request</DialogTitle>
            <DialogDescription>
              Open a PR from{" "}
              <code className='rounded bg-muted px-1 font-mono text-[11px]'>{currentBranch}</code>{" "}
              into{" "}
              <code className='rounded bg-muted px-1 font-mono text-[11px]'>{defaultBranch}</code>.
            </DialogDescription>
          </DialogHeader>
          <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='pr-title'>Title</Label>
              <Input
                id='pr-title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={creating}
                autoFocus
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='pr-body'>Description</Label>
              <textarea
                id='pr-body'
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                disabled={creating}
                placeholder="What's in this PR? (optional)"
                className={cn(
                  "flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs",
                  "placeholder:text-muted-foreground transition-[color,box-shadow] outline-none",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              />
            </div>
            {error ? <p className='text-sm text-destructive'>{error}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='ghost'
              onClick={() => onOpenChange(false)}
              disabled={creating}>
              Cancel
            </Button>
            <Button type='submit' disabled={creating || !title.trim()}>
              {creating ? "Creating…" : "Create pull request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
