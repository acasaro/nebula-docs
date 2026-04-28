import { Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Icon } from '@nebula-docs/components';
import { IconPickerPopover, type IconValue } from '@/components/IconField';
import { FormRow } from './FormRow';

interface IconRowProps {
  value: IconValue;
  onChange: (next: IconValue) => void;
}

/**
 * Icon picker styled to match the underline-row aesthetic used by the other
 * field rows. The trigger renders the picked icon + name, with a clear
 * button when one is selected.
 */
export function IconRow({ value, onChange }: IconRowProps) {
  const [open, setOpen] = useState(false);
  const isSelected = !!value.icon;
  const isCustom = isSelected && /^(https?:\/\/|\/|data:)/i.test(value.icon!);
  const display = isSelected ? (isCustom ? 'Custom URL' : value.icon) : 'Select icon';

  return (
    <FormRow label="Icon" icon={Sparkles}>
      <div className="flex h-9 items-center gap-2 border-b border-border/60">
        <IconPickerPopover open={open} onOpenChange={setOpen} value={value} onChange={onChange}>
          <button
            type="button"
            className="flex flex-1 items-center gap-2 bg-transparent text-left text-sm transition-colors hover:text-foreground focus-visible:outline-none"
          >
            {isSelected ? (
              <Icon
                icon={value.icon}
                iconLibrary={value.iconLibrary}
                iconType={value.iconType}
                size={16}
              />
            ) : null}
            <span className={isSelected ? 'truncate' : 'truncate text-muted-foreground'}>
              {display}
            </span>
          </button>
        </IconPickerPopover>
        {isSelected ? (
          <button
            type="button"
            aria-label="Clear icon"
            onClick={() => onChange({})}
            className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : null}
      </div>
    </FormRow>
  );
}
