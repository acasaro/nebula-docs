import {
  ArrowUpRight,
  Github,
  GitBranch,
  Globe,
  PenSquare,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NebulaBotAvatar } from "@/components/dashboard/NebulaBotAvatar";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { DeploymentThumbnail } from "@/components/dashboard/DeploymentThumbnail";
import { formatRelativeTime, type Actor, type Deployment } from "@/lib/dashboard";

interface DeploymentHeroCardProps {
  deployment: Deployment;
  onRefresh?: () => void;
}

function statusLabel(status: Deployment["status"]): string {
  if (status === "live") return "Live";
  if (status === "building") return "Building";
  return "Failed";
}

function ActorBadge({ actor }: { actor: Actor }) {
  if (actor.kind === "bot") {
    return (
      <span className='inline-flex items-center gap-1.5 font-medium text-foreground'>
        <NebulaBotAvatar size={18} />
        {actor.name}
      </span>
    );
  }
  const initials = actor.shortName
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  return (
    <span className='inline-flex items-center gap-1.5 font-medium text-foreground'>
      <Avatar size='sm'>
        {actor.avatarUrl ? <AvatarImage src={actor.avatarUrl} alt='' /> : null}
        <AvatarFallback>{initials || "?"}</AvatarFallback>
      </Avatar>
      {actor.name}
    </span>
  );
}

export function DeploymentHeroCard({
  deployment,
  onRefresh,
}: DeploymentHeroCardProps) {
  const visibleDomain = deployment.customDomain ?? deployment.domain;
  return (
    <section className='grid gap-8 md:grid-cols-2 md:items-center md:gap-12'>
      <DeploymentThumbnail siteName={deployment.siteName} className='w-full' />

      <div className='flex flex-col gap-6'>
        <div className='flex items-center gap-3'>
          <h2 className='text-lg font-semibold text-foreground'>
            {deployment.siteName}
          </h2>
          <StatusPill tone='brand' label={statusLabel(deployment.status)} />
        </div>

        <p className='flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground'>
          <span>Last updated</span>
          <span className='font-medium text-foreground'>
            {formatRelativeTime(deployment.lastUpdatedAt)}
          </span>
          <span>by</span>
          <ActorBadge actor={deployment.lastUpdatedBy} />
        </p>

        <div className='flex items-center gap-2'>
          <Button variant='outline' size='icon-sm' aria-label='Edit in Nebula' asChild>
            <Link to={`/editor/${deployment.branch}`}>
              <PenSquare />
            </Link>
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label='Refresh status from GitHub'
            onClick={onRefresh}
            disabled={!onRefresh}>
            <RefreshCw />
          </Button>
          <Button variant='outline' size='sm' asChild>
            <a
              href={`https://${visibleDomain}`}
              target='_blank'
              rel='noreferrer'>
              <Globe />
              Visit site
            </a>
          </Button>
        </div>

        <div className='flex flex-col gap-2 pt-1'>
          <div className='text-xs font-medium text-muted-foreground'>Domain</div>
          <a
            href={`https://${deployment.domain}`}
            target='_blank'
            rel='noreferrer'
            className='inline-flex w-fit items-center gap-1 font-mono text-sm text-foreground hover:text-brand-text'>
            {deployment.domain}
            <ArrowUpRight className='size-3.5' />
          </a>
        </div>

        <div className='flex flex-col gap-1.5 text-sm'>
          <a
            href={`https://github.com/${deployment.owner}/${deployment.repo}`}
            target='_blank'
            rel='noreferrer'
            className='inline-flex w-fit items-center gap-1.5 text-foreground hover:text-brand-text'>
            <Github className='size-4 text-muted-foreground' />
            {deployment.owner} / {deployment.repo}
            <ArrowUpRight className='size-3.5 text-muted-foreground' />
          </a>
          <span className='inline-flex items-center gap-1.5 text-muted-foreground'>
            <GitBranch className='size-4' />
            branch{" "}
            <span className='font-medium text-foreground'>{deployment.branch}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
