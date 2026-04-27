import type { FileChangeCount } from "./types";

export type Greeting = "Good morning" | "Good afternoon" | "Good evening";

export function getGreeting(now: Date): Greeting {
  const hour = now.getHours();
  if (hour >= 4 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - date.getTime());
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE);
    return `${m} ${m === 1 ? "minute" : "minutes"} ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  }
  const d = Math.floor(diff / DAY);
  return `${d} ${d === 1 ? "day" : "days"} ago`;
}

export function formatFileCounts(counts: FileChangeCount[]): string {
  if (counts.length === 0) return "no changes";
  return counts
    .map(({ kind, count }) => {
      const noun = count === 1 ? "file" : "files";
      return `${count} ${noun} ${kind}`;
    })
    .join(", ");
}

export function getFirstName(source: string | null | undefined): string {
  if (!source) return "there";
  const trimmed = source.trim();
  if (!trimmed) return "there";
  const firstChunk = trimmed.split(/[\s@.]+/).filter(Boolean)[0];
  if (!firstChunk) return "there";
  return firstChunk[0]!.toUpperCase() + firstChunk.slice(1);
}
