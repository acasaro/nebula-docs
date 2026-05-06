import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SelectFieldProps {
  label: string;
  icon?: LucideIcon;
  value: string | null | undefined;
  onChange: (next: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}

export function SelectField({
  label,
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  className,
}: SelectFieldProps) {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </Label>
      <Select value={value ?? undefined} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
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
    </div>
  );
}
