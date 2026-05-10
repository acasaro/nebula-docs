import { PageLoader } from "@/components/ui/PageLoader";
import { useAnalyticsSummary, type AnalyticsRangeKey } from "@/lib/analytics";
import { useState } from "react";
import { DateRangePicker } from "./DateRangePicker";
import { MetricCard } from "./MetricCard";
import { TopPagesTable } from "./TopPagesTable";
import { TopUsersTable } from "./TopUsersTable";
import { VisitorsChart } from "./VisitorsChart";

export function AnalyticsPage() {
  const [rangeKey, setRangeKey] = useState<AnalyticsRangeKey>("7d");
  const summary = useAnalyticsSummary(rangeKey);

  if (summary.status === "loading") {
    return (
      <div className='-m-8 flex h-[calc(100vh-1rem)] items-center justify-center'>
        <PageLoader size={120} ringStyle='crisp' label='Loading workspace...' />
      </div>
    );
  }

  if (summary.status === "error") {
    return (
      <div className='mx-auto flex max-w-5xl flex-col gap-6'>
        <h1 className='text-2xl font-semibold tracking-tight'>Analytics</h1>
        <div className='rounded-xl border bg-card p-6 text-card-foreground'>
          <p className='text-sm text-muted-foreground'>{summary.error}</p>
        </div>
      </div>
    );
  }

  const data = summary.data;

  return (
    <div className='mx-auto flex max-w-5xl flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold tracking-tight'>Analytics</h1>
        <DateRangePicker value={rangeKey} onChange={setRangeKey} rangeLabel={data.range.label} />
      </div>

      <div className='grid gap-3 sm:grid-cols-3'>
        <MetricCard label='Visitors' metric={data.visitors} />
        <MetricCard label='Views' metric={data.views} />
        <MetricCard label='Searches' metric={data.searches} />
      </div>

      <div className='rounded-xl border bg-card p-5 text-card-foreground'>
        <div className='mb-4'>
          <div className='text-sm font-semibold'>Visitors over time</div>
          <div className='text-xs text-muted-foreground'>
            Daily visitors for the selected date range
          </div>
        </div>
        <VisitorsChart points={data.visitorsOverTime} />
      </div>

      <div className='grid gap-3 lg:grid-cols-2'>
        <TopPagesTable rows={data.topPages} />
        <TopUsersTable rows={data.topUsers} />
      </div>
    </div>
  );
}
