import { GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";

interface BranchPillProps {
  name: string;
  className?: string;
}

export function BranchPill({ name, className }: BranchPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground",
        className,
      )}>
      <GitBranch className='size-3 text-muted-foreground' />
      {name}
    </span>
  );
}
