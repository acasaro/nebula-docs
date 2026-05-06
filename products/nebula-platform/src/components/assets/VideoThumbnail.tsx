import { useEffect, useRef, useState } from 'react';
import { FileVideo, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoThumbnailProps {
  src: string;
  /** Optional explicit poster URL — when present, skips browser metadata fetch. */
  poster?: string;
  className?: string;
  /** Play a muted preview loop while the parent's `:hover` is active. */
  hoverPreview?: boolean;
}

/**
 * Renders a video thumbnail by relying on the browser's metadata fetch:
 *   1. `preload="metadata"` pulls only the moov atom + first frames.
 *   2. We seek to `min(1s, duration/4)` to skip black opening frames.
 *   3. With `muted` + no `controls`, the resulting still acts as a poster.
 *   4. On hover (when `hoverPreview` is set), play() runs a silent loop.
 */
export function VideoThumbnail({
  src,
  poster,
  className,
  hoverPreview = true,
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [broken, setBroken] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => {
      // Some streams have a few black frames at t=0. Quartering the duration
      // (capped at 1s) usually lands somewhere visually meaningful without
      // pulling more than the first chunk of bytes.
      const target = Math.min(1, (v.duration || 4) / 4);
      try {
        v.currentTime = target;
      } catch {
        /* seek failed, leave on first frame */
      }
    };
    const onSeeked = () => setReady(true);
    const onError = () => setBroken(true);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('seeked', onSeeked);
    v.addEventListener('error', onError);
    return () => {
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('seeked', onSeeked);
      v.removeEventListener('error', onError);
    };
  }, [src]);

  if (broken) {
    return (
      <div className='flex flex-col items-center gap-2 p-4 text-muted-foreground'>
        <FileVideo className='size-8' />
        <span className='text-xs uppercase tracking-wide'>Video</span>
      </div>
    );
  }

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        playsInline
        preload='metadata'
        loop
        // Hover-play wiring. We rely on the parent's `group` class so the
        // CSS-state-driven approach lights up when the card is hovered. The
        // play()/pause() calls are guarded so a paused-state second hover
        // doesn't throw.
        onMouseEnter={() => {
          if (!hoverPreview) return;
          videoRef.current?.play().catch(() => {});
        }}
        onMouseLeave={() => {
          if (!hoverPreview) return;
          const v = videoRef.current;
          if (!v) return;
          v.pause();
          // Snap back to the poster frame so the next hover starts clean.
          try {
            v.currentTime = Math.min(1, (v.duration || 4) / 4);
          } catch {
            /* ignored */
          }
        }}
        className={cn(
          'size-full object-cover transition-opacity',
          ready ? 'opacity-100' : 'opacity-0',
          className,
        )}
      />

      {/* Skeleton + play-button overlay. */}
      {!ready ? (
        <div className='absolute inset-0 animate-pulse bg-muted/60' />
      ) : null}
      <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
        <div className='flex size-10 items-center justify-center rounded-full bg-black/55 text-white shadow-md backdrop-blur-sm transition-opacity group-hover:opacity-0'>
          <Play className='size-4 translate-x-[1px] fill-current' />
        </div>
      </div>
    </>
  );
}
