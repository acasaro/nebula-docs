import { useId, useMemo } from "react";
import type { AnalyticsTimeseriesPoint } from "@/lib/analytics";

interface VisitorsChartProps {
  points: AnalyticsTimeseriesPoint[];
}

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function shortDate(d: Date): string {
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Pure-SVG bar chart: one bar per `points[]` entry, with the partial-day
 * bucket rendered as a diagonal hatch fill so the user can tell finalized
 * data from in-progress data at a glance.
 *
 * Picks ~4 evenly-spaced X labels (start, two interior, end) to avoid the
 * label row crowding for 7-day or 30-day windows.
 */
export function VisitorsChart({ points }: VisitorsChartProps) {
  const hatchId = useId();
  const max = useMemo(
    () => Math.max(1, ...points.map((p) => p.visitors)),
    [points],
  );

  if (points.length === 0) {
    return (
      <div className='flex h-72 items-center justify-center text-sm text-muted-foreground'>
        No data for this range
      </div>
    );
  }

  const labelIndices = pickLabelIndices(points.length);

  return (
    <div className='relative'>
      <div
        className='grid items-end gap-2'
        style={{
          gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))`,
          height: 240,
        }}>
        <svg width='0' height='0' className='absolute' aria-hidden='true'>
          <defs>
            <pattern
              id={hatchId}
              patternUnits='userSpaceOnUse'
              width='6'
              height='6'
              patternTransform='rotate(45)'>
              <rect width='6' height='6' className='fill-emerald-400/35' />
              <rect width='3' height='6' className='fill-emerald-400' />
            </pattern>
          </defs>
        </svg>
        {points.map((p, i) => {
          const heightPct = Math.max(2, (p.visitors / max) * 100);
          return (
            <div
              key={i}
              className='flex h-full items-end justify-center'
              title={`${shortDate(p.date)}: ${p.visitors} visitors${p.partial ? " (partial)" : ""}`}>
              {p.partial ? (
                <svg
                  width='100%'
                  height={`${heightPct}%`}
                  preserveAspectRatio='none'
                  className='rounded-md'>
                  <rect
                    x='0'
                    y='0'
                    width='100%'
                    height='100%'
                    fill={`url(#${hatchId})`}
                    rx='6'
                    ry='6'
                  />
                </svg>
              ) : (
                <div
                  className='w-full rounded-md bg-emerald-400'
                  style={{ height: `${heightPct}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className='mt-2 border-t border-dashed border-border/60' />
      <div
        className='mt-2 grid text-[11px] text-muted-foreground'
        style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}>
        {points.map((p, i) => (
          <div key={i} className='text-center'>
            {labelIndices.has(i) ? shortDate(p.date) : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function pickLabelIndices(n: number): Set<number> {
  if (n <= 4) return new Set(Array.from({ length: n }, (_, i) => i));
  return new Set([
    0,
    Math.round((n - 1) / 3),
    Math.round((2 * (n - 1)) / 3),
    n - 1,
  ]);
}
