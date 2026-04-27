import { Plus } from "lucide-react";
import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { PreviewsTable } from "@/components/dashboard/PreviewsTable";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ActivityEntry,
  Deployment,
  PreviewEntry,
} from "@/lib/dashboard";

export type DashboardTab = "live" | "previews";

interface ActivitySectionProps {
  tab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  deployment: Deployment;
  activity: ActivityEntry[];
  previews: PreviewEntry[];
}

const TABS: { value: DashboardTab; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "previews", label: "Previews" },
];

export function ActivitySection({
  tab,
  onTabChange,
  deployment,
  activity,
  previews,
}: ActivitySectionProps) {
  const heading = tab === "live" ? "Activity" : "Previews";

  return (
    <section className='flex flex-col gap-4'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-semibold text-foreground'>{heading}</h2>
        <div
          role='tablist'
          aria-label='Switch between live activity and previews'
          className='inline-flex items-center rounded-full border border-border/60 bg-muted/40 p-0.5 text-sm'>
          {TABS.map(({ value, label }) => {
            const active = tab === value;
            return (
              <button
                key={value}
                type='button'
                role='tab'
                aria-selected={active}
                onClick={() => onTabChange(value)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "previews" ? (
        <div>
          <Button variant='outline' size='sm'>
            <Plus />
            Create custom preview
          </Button>
        </div>
      ) : null}

      {tab === "live" ? (
        <ActivityTable entries={activity} deployment={deployment} />
      ) : (
        <PreviewsTable entries={previews} deployment={deployment} />
      )}
    </section>
  );
}
