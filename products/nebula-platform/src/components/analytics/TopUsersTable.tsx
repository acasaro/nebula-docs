import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AnalyticsTopUser } from "@/lib/analytics";

interface TopUsersTableProps {
  rows: AnalyticsTopUser[];
}

const numberFmt = new Intl.NumberFormat("en-US");

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TopUsersTable({ rows }: TopUsersTableProps) {
  return (
    <div className='overflow-hidden rounded-xl border bg-card text-card-foreground'>
      <div className='flex items-center justify-between border-b border-border/60 px-4 py-3 text-xs font-medium text-muted-foreground'>
        <span>Top users</span>
        <span>Events</span>
      </div>
      <ul className='divide-y divide-border/60'>
        {rows.map((row) => (
          <li
            key={row.name}
            className='flex items-center justify-between gap-3 px-4 py-3 text-sm'>
            <div className='flex min-w-0 items-center gap-3'>
              <Avatar className='size-7'>
                {row.avatarUrl ? <AvatarImage src={row.avatarUrl} alt='' /> : null}
                <AvatarFallback className='text-[11px]'>
                  {initials(row.name)}
                </AvatarFallback>
              </Avatar>
              <span className='truncate text-foreground'>{row.name}</span>
            </div>
            <span className='tabular-nums text-foreground'>
              {numberFmt.format(row.events)}
            </span>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className='px-4 py-6 text-center text-sm text-muted-foreground'>
            No active users yet
          </li>
        ) : null}
      </ul>
    </div>
  );
}
