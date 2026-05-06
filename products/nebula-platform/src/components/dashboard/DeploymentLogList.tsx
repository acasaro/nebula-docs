import { Check, CircleDashed, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeploymentLogStep } from "@/lib/dashboard";

interface DeploymentLogListProps {
  steps: DeploymentLogStep[];
}

const iconByStatus = {
  ok: Check,
  pending: CircleDashed,
  fail: X,
} as const;

const iconColorByStatus = {
  ok: "text-emerald-500",
  pending: "text-muted-foreground",
  fail: "text-destructive",
} as const;

export function DeploymentLogList({ steps }: DeploymentLogListProps) {
  return (
    <ul className='flex flex-col gap-2 text-sm'>
      {steps.map((step, idx) => {
        const Icon = iconByStatus[step.status];
        return (
          <li
            key={`${idx}-${step.label}`}
            className='flex items-start gap-2 text-foreground'>
            <Icon
              className={cn("mt-0.5 size-4 shrink-0", iconColorByStatus[step.status])}
              aria-hidden
            />
            <span className='leading-snug'>{step.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
