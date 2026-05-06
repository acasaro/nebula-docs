import type { LucideIcon } from 'lucide-react';
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
 * Horizontal row used by the nav-settings forms: a 140px label box on the
 * left (icon + label stacked vertically inside it) and the field on the
 * right. Inputs use a bottom-border-only treatment so the dense form reads
 * like a settings sheet rather than a card form.
 */
interface FormRowProps {
  label: string;
  icon?: LucideIcon;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export function FormRow({ label, icon: Icon, htmlFor, className, children }: FormRowProps) {
  return (
    <div className={cn('flex items-start gap-6', className)}>
      <Label
        htmlFor={htmlFor}
        className="flex w-[140px] shrink-0 items-center gap-1.5 pt-2 text-sm font-normal text-muted-foreground"
      >
        {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
        <span className="truncate">{label}</span>
      </Label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

const UNDERLINE_INPUT_CLASSES =
  'h-9 rounded-none border-0 border-b border-border/60 bg-transparent px-0 shadow-none transition-colors focus-visible:border-foreground focus-visible:ring-0';

interface TextRowProps {
  label: string;
  icon?: LucideIcon;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  type?: 'text' | 'url' | 'email';
}

export function TextRow({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = 'text',
}: TextRowProps) {
  const id = useId();
  return (
    <FormRow label={label} icon={icon} htmlFor={id}>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={UNDERLINE_INPUT_CLASSES}
      />
    </FormRow>
  );
}

interface ToggleRowProps {
  label: string;
  icon?: LucideIcon;
  checked: boolean;
  onChange: (next: boolean) => void;
  /** "On"/"Off" or "Yes"/"No" — labels rendered next to the switch. */
  labels?: [onLabel: string, offLabel: string];
}

export function ToggleRow({
  label,
  icon,
  checked,
  onChange,
  labels = ['On', 'Off'],
}: ToggleRowProps) {
  const id = useId();
  const [onLabel, offLabel] = labels;
  return (
    <FormRow label={label} icon={icon} htmlFor={id}>
      <div className="flex h-9 items-center gap-2">
        <Switch id={id} size="sm" checked={checked} onCheckedChange={onChange} />
        <span className="text-xs text-muted-foreground">{checked ? onLabel : offLabel}</span>
      </div>
    </FormRow>
  );
}

interface SelectRowProps {
  label: string;
  icon?: LucideIcon;
  value: string;
  onChange: (next: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}

export function SelectRow({
  label,
  icon,
  value,
  onChange,
  options,
  placeholder,
}: SelectRowProps) {
  const id = useId();
  return (
    <FormRow label={label} icon={icon} htmlFor={id}>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className={cn(UNDERLINE_INPUT_CLASSES, 'w-full justify-between')}
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
    </FormRow>
  );
}
