import { cn } from "@/lib/utils";

export type StatusPillTone = "brand" | "success";

interface StatusPillProps {
  tone: StatusPillTone;
  label: string;
  className?: string;
}

const toneStyles: Record<StatusPillTone, { dot: string; pill: string }> = {
  brand: {
    dot: "bg-brand-text",
    pill: "bg-brand-text/12 text-brand-text",
  },
  success: {
    dot: "bg-emerald-500",
    pill:
      "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/15",
  },
};

export function StatusPill({ tone, label, className }: StatusPillProps) {
  const styles = toneStyles[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles.pill,
        className,
      )}>
      <span className={cn("size-1.5 rounded-full", styles.dot)} aria-hidden />
      {label}
    </span>
  );
}
