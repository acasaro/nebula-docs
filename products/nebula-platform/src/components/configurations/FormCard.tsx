import { type ReactNode, useId } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

/**
 * A bordered card with a stacked label and field, used by every form on the
 * Configurations page. Lives in `configurations/` rather than the shared
 * `nav-settings/` rail because the side panel for page/group/tab edits keeps
 * its horizontal label-row layout where vertical space is tight.
 */
interface FormCardProps {
  label: string;
  htmlFor?: string;
  className?: string;
  /** Optional element rendered to the right of the label (e.g. an Add button). */
  action?: ReactNode;
  children: ReactNode;
}

export function FormCard({
  label,
  htmlFor,
  className,
  action,
  children,
}: FormCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-border/40 bg-muted/30 p-4',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={htmlFor} className="text-sm font-semibold">
          {label}
        </Label>
        {action ?? null}
      </div>
      {children}
    </div>
  );
}

const CARD_INPUT_CLASSES = 'h-9 bg-background';

interface TextCardProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  type?: 'text' | 'url' | 'email';
}

export function TextCard({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: TextCardProps) {
  const id = useId();
  return (
    <FormCard label={label} htmlFor={id}>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={CARD_INPUT_CLASSES}
      />
    </FormCard>
  );
}

interface SelectCardProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectCard({
  label,
  value,
  onChange,
  options,
  placeholder,
}: SelectCardProps) {
  const id = useId();
  return (
    <FormCard label={label} htmlFor={id}>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className={cn(CARD_INPUT_CLASSES, 'w-full justify-between')}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormCard>
  );
}

interface ToggleCardProps {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Right-side caption — defaults to ['On', 'Off']. */
  labels?: [onLabel: string, offLabel: string];
}

export function ToggleCard({
  label,
  checked,
  onChange,
  labels = ['On', 'Off'],
}: ToggleCardProps) {
  const id = useId();
  const [onLabel, offLabel] = labels;
  return (
    <FormCard label={label} htmlFor={id}>
      <div className="flex items-center gap-2">
        <Switch id={id} size="sm" checked={checked} onCheckedChange={onChange} />
        <span className="text-xs text-muted-foreground">
          {checked ? onLabel : offLabel}
        </span>
      </div>
    </FormCard>
  );
}

interface ColorCardProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

export function ColorCard({
  label,
  value,
  onChange,
  placeholder,
}: ColorCardProps) {
  const id = useId();
  // The native swatch picker requires a 7-char hex; fall back to the
  // placeholder when the value is empty or non-hex so the picker still opens.
  const swatchValue = /^#[0-9a-fA-F]{6}$/.test(value)
    ? value
    : (placeholder ?? '#000000');
  return (
    <FormCard label={label} htmlFor={id}>
      <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-2">
        <input
          type="color"
          aria-label={`${label} swatch`}
          value={swatchValue}
          onChange={(e) => onChange(e.target.value)}
          className="size-5 cursor-pointer rounded border border-border/60 bg-transparent"
        />
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 rounded-none border-0 bg-transparent px-0 font-mono text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </div>
    </FormCard>
  );
}
