import { useId } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface ToggleFieldProps {
  label: string;
  icon?: LucideIcon;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  className?: string;
}

export function ToggleField({
  label,
  icon: Icon,
  description,
  checked,
  onChange,
  className,
}: ToggleFieldProps) {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </Label>
      {description ? (
        <p className="text-[11px] leading-tight text-muted-foreground">
          {description}
        </p>
      ) : null}
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
