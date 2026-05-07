import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface NumberFieldProps {
  label: string;
  icon?: LucideIcon;
  value: number | null;
  onChange: (next: number | null) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function NumberField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  className,
}: NumberFieldProps) {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label
        htmlFor={id}
        className='flex items-center gap-1.5 text-xs text-muted-foreground'
      >
        {Icon ? <Icon className='size-3.5' /> : null}
        {label}
      </Label>
      <Input
        id={id}
        type='number'
        value={value ?? ''}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === '') {
            onChange(null);
            return;
          }
          const n = Number(raw);
          if (Number.isFinite(n)) onChange(n);
        }}
        className='h-9'
      />
    </div>
  );
}
