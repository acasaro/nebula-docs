import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BranchPill } from "@/components/dashboard/BranchPill";
import { NebulaBotAvatar } from "@/components/dashboard/NebulaBotAvatar";
import { StatusPill } from "@/components/dashboard/StatusPill";
import {
  formatFileCounts,
  formatRelativeTime,
  type Actor,
  type DashboardEntry,
  type EntryStatus,
} from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface ActivityRowProps {
  entry: DashboardEntry;
  showBranch: boolean;
  expandedContent: ReactNode;
}

function statusLabel(status: EntryStatus): string {
  if (status === "successful") return "Successful";
  if (status === "building") return "Building";
  return "Failed";
}

function ActorCell({ actor }: { actor: Actor }) {
  if (actor.kind === "bot") {
    return (
      <span className='inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/40'>
        <NebulaBotAvatar size={20} />
      </span>
    );
  }
  const initials = actor.shortName
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  return (
    <Avatar>
      {actor.avatarUrl ? <AvatarImage src={actor.avatarUrl} alt='' /> : null}
      <AvatarFallback>{initials || "?"}</AvatarFallback>
    </Avatar>
  );
}

export function ActivityRow({
  entry,
  showBranch,
  expandedContent,
}: ActivityRowProps) {
  const [open, setOpen] = useState(false);
  const branch = entry.kind === "preview" ? entry.branch : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <div className='border-b border-border/60 last:border-b-0'>
        <CollapsibleTrigger asChild>
          <button
            type='button'
            className='flex w-full cursor-pointer items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40 data-[state=open]:bg-muted/30'>
            <div className='flex w-56 shrink-0 items-center gap-3'>
              <ActorCell actor={entry.actor} />
              <div className='flex min-w-0 flex-col'>
                <span className='truncate text-sm font-medium text-foreground'>
                  {entry.actor.shortName}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {formatRelativeTime(entry.occurredAt)}
                </span>
              </div>
            </div>

            {showBranch ? (
              <div className='w-44 shrink-0'>
                {branch ? <BranchPill name={branch} /> : null}
              </div>
            ) : null}

            <div className='w-32 shrink-0'>
              <StatusPill tone='success' label={statusLabel(entry.status)} />
            </div>

            <div className='flex min-w-0 flex-1 flex-col text-sm'>
              <span className='truncate text-foreground'>{entry.title}</span>
              {entry.subtitle ? (
                <span className='truncate text-xs text-muted-foreground'>
                  {entry.subtitle}
                </span>
              ) : null}
              <span className='truncate text-xs text-muted-foreground'>
                {formatFileCounts(entry.fileCounts)}
              </span>
            </div>

            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className='border-t border-border/60 bg-muted/20 px-4 py-5'>
          {expandedContent}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
