import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyticsMetric } from "@/lib/analytics";

interface MetricCardProps {
  label: string;
  metric: AnalyticsMetric;
}

const numberFmt = new Intl.NumberFormat("en-US");

function formatPct(delta: number): string {
  const pct = Math.abs(delta * 100);
  return pct >= 100 ? `${Math.round(pct)}%` : `${pct.toFixed(1)}%`;
}

export function MetricCard({ label, metric }: MetricCardProps) {
  const { value, delta } = metric;
  const positive = delta !== null && delta > 0;
  const negative = delta !== null && delta < 0;

  return (
    <div className='flex flex-col gap-2 rounded-xl border bg-card p-4 text-card-foreground'>
      <div className='text-sm text-muted-foreground'>{label}</div>
      <div className='text-3xl font-semibold tracking-tight tabular-nums'>
        {numberFmt.format(value)}
      </div>
      {delta === null ? (
        <div className='text-xs text-muted-foreground'>—</div>
      ) : (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            positive && "text-emerald-600 dark:text-emerald-400",
            negative && "text-rose-600 dark:text-rose-400",
          )}>
          {positive ? (
            <ArrowUpRight className='size-3.5' />
          ) : (
            <ArrowDownRight className='size-3.5' />
          )}
          <span>{formatPct(delta)}</span>
          <span className='text-muted-foreground font-normal'>vs previous</span>
        </div>
      )}
    </div>
  );
}
