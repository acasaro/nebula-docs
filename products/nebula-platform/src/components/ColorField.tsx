import { useState } from "react";
import { PaintBucket } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorFieldProps {
  value?: string;
  onChange: (next: string | undefined) => void;
  disabled?: boolean;
  className?: string;
}

const HEX_RE = /^#[0-9a-f]{6}$/i;

/**
 * Compact color input — a small pill that shows the current color as a
 * leading swatch with the hex value beside it. Clicking opens a popover
 * with an HSV gradient + hue bar (react-colorful) and a separate hex
 * input field for typed entry.
 */
export function ColorField({ value, onChange, disabled, className }: ColorFieldProps) {
  const [open, setOpen] = useState(false);
  const hasValue = !!value;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type='button'
          disabled={disabled}
          className={cn(
            "flex h-9 items-center gap-2 rounded-md border bg-background px-2 text-sm transition-colors",
            "hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}>
          <span
            aria-hidden
            className={cn(
              "block size-4 shrink-0 rounded-full border border-border/60",
              !hasValue && "bg-muted-foreground/20",
            )}
            style={hasValue ? { backgroundColor: value } : undefined}
          />
          <span
            className={cn(
              "font-mono text-xs",
              !hasValue && "text-muted-foreground",
            )}>
            {value ?? "Color"}
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side='right'
          align='start'
          sideOffset={8}
          collisionPadding={12}
          className={cn(
            "z-50 w-64 rounded-md border bg-popover p-3 shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
          onCloseAutoFocus={(e) => e.preventDefault()}>
          <ColorPickerPanel
            value={value ?? "#000000"}
            onChange={onChange}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function ColorPickerPanel({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string | undefined) => void;
}) {
  // Local mirror so the user can type a partial hex without React
  // immediately rejecting / reverting the input. We only fire `onChange`
  // up the tree once the draft passes the hex validator.
  const [draft, setDraft] = useState(value);

  const handlePickerChange = (next: string) => {
    setDraft(next);
    onChange(next);
  };

  const handleHexInput = (next: string) => {
    setDraft(next);
    if (HEX_RE.test(next)) onChange(next);
  };

  return (
    <div className='flex flex-col gap-3'>
      <HexColorPicker
        color={value}
        onChange={handlePickerChange}
        style={{ width: "100%", height: "9rem" }}
      />
      <div className='flex items-center gap-2'>
        <PaintBucket className='size-4 shrink-0 text-muted-foreground' />
        <label className='text-xs text-muted-foreground'>Hex Color</label>
        <Input
          value={draft}
          onChange={(e) => handleHexInput(e.target.value)}
          placeholder='#000000'
          className='h-8 flex-1 font-mono'
          spellCheck={false}
        />
      </div>
    </div>
  );
}
