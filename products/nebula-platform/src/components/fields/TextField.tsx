import { useId, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TextFieldProps {
  label: string;
  icon?: LucideIcon;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  type?: 'text' | 'url' | 'email';
  className?: string;
  /** Optional element rendered to the right of the input — e.g. an Upload
   *  button that opens an asset picker and writes the picked URL back via
   *  onChange. Slotted at row level so the input still spans the available
   *  width and the action sits flush to its right edge. */
  trailing?: ReactNode;
}

export function TextField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
  trailing,
}: TextFieldProps) {
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
      <div className="flex items-stretch gap-2">
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 flex-1 min-w-0"
        />
        {trailing}
      </div>
    </div>
  );
}
