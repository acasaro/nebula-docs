import { Hash, Plus, X } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';
import { Input } from '@/components/ui/input';
import { FormRow } from './FormRow';

interface KeywordsRowProps {
  value: string[];
  onChange: (next: string[]) => void;
}

/**
 * Keyword chip input. New chip is committed on Enter / comma / blur via the
 * "Add keyword" affordance. Backspace on the empty input removes the last
 * chip — the standard tag-input UX.
 */
export function KeywordsRow({ value, onChange }: KeywordsRowProps) {
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);

  const commit = () => {
    const trimmed = draft.trim().replace(/,+$/, '');
    if (!trimmed) {
      setDraft('');
      setAdding(false);
      return;
    }
    if (!value.includes(trimmed)) onChange([...value, trimmed]);
    setDraft('');
    setAdding(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setDraft('');
      setAdding(false);
    }
  };

  const removeAt = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  return (
    <FormRow label="Keywords" icon={Hash}>
      <div className="flex min-h-9 flex-wrap items-center gap-1.5">
        {value.map((kw, i) => (
          <span
            key={`${kw}-${i}`}
            className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 py-0.5 pl-2 pr-1 text-xs"
          >
            {kw}
            <button
              type="button"
              aria-label={`Remove ${kw}`}
              onClick={() => removeAt(i)}
              className="flex size-4 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {adding ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commit}
            placeholder="Keyword"
            className="h-7 w-32 rounded-md border-border/60 bg-transparent px-2 text-xs shadow-none focus-visible:border-foreground focus-visible:ring-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-border/60 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <Plus className="size-3" />
            Add keyword
          </button>
        )}
      </div>
    </FormRow>
  );
}
