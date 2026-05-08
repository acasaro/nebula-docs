import type { AnalyticsTopPage } from "@/lib/analytics";

interface TopPagesTableProps {
  rows: AnalyticsTopPage[];
}

const numberFmt = new Intl.NumberFormat("en-US");

export function TopPagesTable({ rows }: TopPagesTableProps) {
  return (
    <div className='overflow-hidden rounded-xl border bg-card text-card-foreground'>
      <div className='flex items-center justify-between border-b border-border/60 px-4 py-3 text-xs font-medium text-muted-foreground'>
        <span>Top pages</span>
        <span>Views</span>
      </div>
      <ul className='divide-y divide-border/60'>
        {rows.map((row) => (
          <li
            key={row.path}
            className='flex items-center justify-between px-4 py-3 text-sm'>
            <span className='truncate font-mono text-[13px] text-foreground/90'>
              {row.path}
            </span>
            <span className='tabular-nums text-foreground'>
              {numberFmt.format(row.views)}
            </span>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className='px-4 py-6 text-center text-sm text-muted-foreground'>
            No page views yet
          </li>
        ) : null}
      </ul>
    </div>
  );
}
