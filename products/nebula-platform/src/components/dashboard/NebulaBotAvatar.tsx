import { cn } from "@/lib/utils";

interface NebulaBotAvatarProps {
  size?: number;
  className?: string;
}

/**
 * Static orbit-and-core mark used wherever the `nebula-docs[bot]` actor
 * appears. Mirrors the glyph at the start of the wordmark and the animated
 * NebulaLoader, but without animation. Color is driven by `currentColor`,
 * so wrappers should set text color (typically `text-brand-text`).
 */
export function NebulaBotAvatar({ size = 24, className }: NebulaBotAvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 32 32'
      fill='none'
      role='img'
      aria-label='Nebula bot'
      className={cn("text-brand-text", className)}>
      <circle
        cx='16'
        cy='16'
        r='13.5'
        stroke='currentColor'
        strokeOpacity='0.45'
        strokeWidth='1.5'
      />
      <ellipse
        cx='16'
        cy='16'
        rx='14'
        ry='6'
        transform='rotate(-22 16 16)'
        stroke='currentColor'
        strokeOpacity='0.6'
        strokeWidth='1.5'
      />
      <circle cx='16' cy='16' r='3.25' fill='currentColor' />
    </svg>
  );
}
