import type { ReactNode } from 'react';

interface Props {
  name: string;
  props?: Record<string, unknown>;
  children?: ReactNode;
}

export function Phase2Stub({ name, props, children }: Props) {
  const visibleProps =
    props && Object.keys(props).filter((k) => props[k] !== undefined).length > 0
      ? Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined))
      : null;

  return (
    <div className="my-4 rounded-md border border-dashed border-amber-400/60 bg-amber-50/50 p-4 text-sm dark:border-amber-400/40 dark:bg-amber-950/20">
      <div className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-300">
        &lt;{name} /&gt;{' '}
        <span className="font-sans font-normal opacity-70">— phase-2 stub</span>
      </div>
      {visibleProps && (
        <pre className="mt-2 overflow-x-auto text-xs text-amber-800/80 dark:text-amber-200/70">
          {JSON.stringify(visibleProps, null, 2)}
        </pre>
      )}
      {children && <div className="mt-3 opacity-60">{children}</div>}
    </div>
  );
}
