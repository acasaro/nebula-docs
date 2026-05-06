import { useState } from 'react';
import { Icon } from '@nebula-docs/components';
import { IconField, type IconValue } from '@/components/IconField';

/** Dev-only sandbox for the IconField. Removed once attribute menus land. */
export function DevIconPicker() {
  const [a, setA] = useState<IconValue>({});
  const [b, setB] = useState<IconValue>({ icon: 'circle-check', iconLibrary: 'lucide' });
  const [c, setC] = useState<IconValue>({});

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-xl font-semibold">IconField sandbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Temporary route for verifying the IconPicker. Will be removed once
          attribute menus land.
        </p>
      </div>

      <Field label="Empty (defaults to Lucide tab)" value={a} onChange={setA} />
      <Field
        label="Pre-selected (Lucide circle-check)"
        value={b}
        onChange={setB}
      />
      <Field label="Custom URL example" value={c} onChange={setC} />

      <div className="rounded-md border bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Resolved JSON:
        </p>
        <pre className="mt-2 text-xs">
          {JSON.stringify({ a, b, c }, null, 2)}
        </pre>
      </div>

      <div className="rounded-md border bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground">Live render:</p>
        <div className="mt-3 flex items-center gap-6 text-foreground">
          {a.icon ? (
            <Icon icon={a.icon} iconLibrary={a.iconLibrary} iconType={a.iconType} size={32} />
          ) : (
            <span className="text-xs text-muted-foreground">a: —</span>
          )}
          {b.icon ? (
            <Icon icon={b.icon} iconLibrary={b.iconLibrary} iconType={b.iconType} size={32} />
          ) : (
            <span className="text-xs text-muted-foreground">b: —</span>
          )}
          {c.icon ? (
            <Icon icon={c.icon} iconLibrary={c.iconLibrary} iconType={c.iconType} size={32} />
          ) : (
            <span className="text-xs text-muted-foreground">c: —</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: IconValue;
  onChange: (next: IconValue) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <IconField value={value} onChange={onChange} />
    </div>
  );
}
