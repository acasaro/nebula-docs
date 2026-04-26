import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown, GitBranch, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface BranchPickerProps {
  currentBranch: string;
  defaultBranch: string;
  branches: string[];
  loading?: boolean;
  hasDirty: boolean;
  onSwitch: (branch: string) => void;
  onCreate: (
    name: string,
    base: string,
    bringChanges: boolean,
  ) => Promise<void>;
}

export function BranchPicker({
  currentBranch,
  defaultBranch,
  branches,
  loading,
  hasDirty,
  onSwitch,
  onCreate,
}: BranchPickerProps) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex max-w-full items-center gap-1.5 rounded-md border bg-background px-2 py-1',
              'text-xs font-medium transition-colors hover:bg-accent/60',
            )}
          >
            <GitBranch className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{currentBranch}</span>
            <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={6}
            align="start"
            className={cn(
              'z-50 w-64 rounded-md border bg-popover p-1 shadow-md',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            )}
          >
            <div className="max-h-72 overflow-y-auto py-1">
              {loading ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Loading branches…
                </div>
              ) : branches.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No branches found.
                </div>
              ) : (
                branches.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      onSwitch(b);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                      'hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <GitBranch className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{b}</span>
                      {b === defaultBranch ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          Default
                        </span>
                      ) : null}
                    </span>
                    {b === currentBranch ? <Check className="size-3.5 shrink-0" /> : null}
                  </button>
                ))
              )}
            </div>
            <div className="border-t pt-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setCreateOpen(true);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm',
                  'hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Plus className="size-3.5" />
                Create new branch
              </button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <CreateBranchDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        currentBranch={currentBranch}
        defaultBranch={defaultBranch}
        hasDirty={hasDirty}
        onCreate={onCreate}
      />
    </>
  );
}

interface CreateBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBranch: string;
  defaultBranch: string;
  hasDirty: boolean;
  onCreate: (
    name: string,
    base: string,
    bringChanges: boolean,
  ) => Promise<void>;
}

function CreateBranchDialog({
  open,
  onOpenChange,
  currentBranch,
  defaultBranch,
  hasDirty,
  onCreate,
}: CreateBranchDialogProps) {
  const [name, setName] = useState('');
  const [bringChanges, setBringChanges] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = defaultBranch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(trimmed, base, bringChanges);
      setName('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a Branch</DialogTitle>
            <DialogDescription>
              Your branch will be based on{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                {base}
              </code>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branch-name">Branch name</Label>
              <Input
                id="branch-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-edits"
                autoFocus
                required
                disabled={submitting}
              />
            </div>
            {hasDirty ? (
              <fieldset className="flex flex-col gap-2 rounded-md border p-3 text-sm">
                <legend className="px-1 text-xs font-medium text-muted-foreground">
                  In-progress changes
                </legend>
                <RadioOption
                  checked={bringChanges}
                  onSelect={() => setBringChanges(true)}
                  title={
                    <>
                      Bring my changes to{' '}
                      <code className="rounded bg-muted px-1 font-mono text-[11px]">
                        {name.trim() || 'new-branch'}
                      </code>
                    </>
                  }
                  description="Your in-progress work will follow you to your new branch."
                  disabled={submitting}
                />
                <RadioOption
                  checked={!bringChanges}
                  onSelect={() => setBringChanges(false)}
                  title={
                    <>
                      Leave my changes on{' '}
                      <code className="rounded bg-muted px-1 font-mono text-[11px]">
                        {currentBranch}
                      </code>
                    </>
                  }
                  description="Your in-progress work will stay on your current branch."
                  disabled={submitting}
                />
              </fieldset>
            ) : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? 'Creating…' : 'Create branch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RadioOption({
  checked,
  onSelect,
  title,
  description,
  disabled,
}: {
  checked: boolean;
  onSelect: () => void;
  title: React.ReactNode;
  description: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'flex items-start gap-2 rounded-md p-2 text-left transition-colors',
        'hover:bg-accent/40 disabled:opacity-50',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
          checked ? 'border-primary' : 'border-muted-foreground/40',
        )}
      >
        {checked ? <span className="size-2 rounded-full bg-primary" /> : null}
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}
