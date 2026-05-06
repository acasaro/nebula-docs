import { useId } from 'react';
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
}

export function TextField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
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
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9"
      />
    </div>
  );
}
