import * as Popover from "@radix-ui/react-popover";
import {
  Bell,
  Check,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import {
  useNotifications,
  type Notification,
  type NotificationPhase,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

/**
 * Bell icon button + dropdown listing the in-app notification queue.
 * Always visible (even when empty) so it's a stable target the user can
 * reach without surprise — a notification appearing or vanishing changes
 * the badge / pulse, not the existence of the bell.
 *
 * Each row renders the notification's phase icon, headline (clickable to
 * the source URL), optional description, and a dismiss button. The phase
 * comes from the provider's polling/subscription watchers, which transition
 * `in-progress → success | failure` once the underlying work completes.
 */
export function NotificationCenter() {
  const { notifications, dismissNotification } = useNotifications();

  const inProgressCount = notifications.filter(
    (n) => n.phase === "in-progress",
  ).length;
  const isEmpty = notifications.length === 0;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type='button'
          aria-label={`Notifications (${notifications.length})`}
          title='Notifications'
          className={cn(
            "relative inline-flex size-8 shrink-0 items-center justify-center rounded-md border transition-colors",
            "border-border bg-background text-foreground hover:bg-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          )}>
          <Bell className='size-4' />
          {inProgressCount > 0 ? (
            <span
              className='absolute -right-0.5 -top-0.5 size-2 animate-pulse rounded-full bg-blue-500 ring-2 ring-background'
              aria-hidden
            />
          ) : notifications.length > 0 ? (
            <span
              className='absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground'
              aria-hidden>
              {notifications.length}
            </span>
          ) : null}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align='end'
          sideOffset={8}
          className={cn(
            "z-50 w-80 rounded-md border bg-popover p-2 shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}>
          <div className='flex items-center justify-between px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            <span>Notifications</span>
            {notifications.length > 1 ? (
              <button
                type='button'
                onClick={() => {
                  for (const n of notifications) dismissNotification(n.id);
                }}
                className='rounded text-[11px] font-normal normal-case text-muted-foreground hover:text-foreground'>
                Clear all
              </button>
            ) : null}
          </div>
          {isEmpty ? (
            <p className='px-2 py-6 text-center text-xs text-muted-foreground'>
              No notifications.
            </p>
          ) : (
            <ul className='flex flex-col'>
              {notifications.map((n) => (
                <li key={n.id}>
                  <NotificationRow
                    notification={n}
                    onDismiss={() => dismissNotification(n.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface NotificationRowProps {
  notification: Notification;
  onDismiss: () => void;
}

function NotificationRow({ notification, onDismiss }: NotificationRowProps) {
  const phase = notification.phase;
  const Icon =
    phase === "in-progress" ? Loader2 : phase === "success" ? Check : X;
  const iconCls = phase === "in-progress" ? "animate-spin text-muted-foreground" : "";

  return (
    <div className='flex items-start gap-2 rounded px-2 py-2 hover:bg-accent/40'>
      <span className={cn("mt-0.5 inline-flex shrink-0", phaseTone(phase))}>
        <Icon className={cn("size-4", iconCls)} />
      </span>
      <div className='min-w-0 flex-1'>
        <a
          href={notification.href}
          target='_blank'
          rel='noreferrer'
          className='inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-2 hover:underline'
          title='Open in GitHub'>
          {notification.title}
          <ExternalLink className='size-3 text-muted-foreground' />
        </a>
        {notification.description ? (
          <p className='mt-0.5 truncate text-xs text-muted-foreground'>
            {notification.description}
          </p>
        ) : null}
      </div>
      <button
        type='button'
        onClick={onDismiss}
        aria-label='Dismiss notification'
        className='shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground'
        title='Dismiss'>
        <X className='size-3.5' />
      </button>
    </div>
  );
}

function phaseTone(phase: NotificationPhase): string {
  if (phase === "success") return "text-emerald-500";
  if (phase === "failure") return "text-destructive";
  return ""; // in-progress styling lives on the icon (animate-spin)
}
