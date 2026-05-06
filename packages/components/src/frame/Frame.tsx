import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface FrameProps {
  children?: ReactNode;
  caption?: string;
  /** Alias kept for MDX compatibility — `title` is also supported. */
  title?: string;
  /** Alias kept for MDX compatibility — `description` maps to `caption`. */
  description?: string;
  /** When set, Frame renders an `<img>` with this URL. */
  src?: string;
  /** Alt text for the image. Falls back to caption/title if omitted. */
  alt?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Rounded card with a subtle dot grid and an optional caption beneath.
 * When `src` is provided, renders an image inside the frame.
 */
export function Frame({
  children,
  caption,
  description,
  title,
  src,
  alt,
  width,
  height,
  className,
  style,
}: FrameProps) {
  const finalCaption = caption ?? description;
  const finalAlt = alt ?? caption ?? description ?? title ?? '';

  return (
    <div className="my-6" data-component-part="frame-container">
      {title ? (
        <div className="not-prose mb-3 flex items-center gap-2">
          <svg
            aria-hidden="true"
            className="size-4 flex-none fill-stone-400 dark:fill-stone-500"
            viewBox="0 0 512 512"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M224 320c0 17.69 14.33 32 32 32h64c17.67 0 32-14.31 32-32s-14.33-32-32-32h-64C238.3 288 224 302.3 224 320zM267.6 256H352c17.67 0 32-14.31 32-32s-14.33-32-32-32h-80v40C272 240.5 270.3 248.5 267.6 256zM272 160H480c17.67 0 32-14.31 32-32s-14.33-32-32-32h-208.8C271.5 98.66 272 101.3 272 104V160zM320 416c0-17.69-14.33-32-32-32H224c-17.67 0-32 14.31-32 32s14.33 32 32 32h64C305.7 448 320 433.7 320 416zM202.1 355.8C196 345.6 192 333.3 192 320c0-5.766 1.08-11.24 2.51-16.55C157.4 300.6 128 269.9 128 232V159.1C128 151.2 135.2 144 143.1 144S160 151.2 159.1 159.1l0 69.72C159.1 245.2 171.3 271.1 200 271.1C222.1 271.1 240 254.1 240 232v-128C240 81.91 222.1 64 200 64H136.6C103.5 64 72.03 80 52.47 106.8L26.02 143.2C9.107 166.5 0 194.5 0 223.3V312C0 387.1 60.89 448 136 448h32.88C163.4 438.6 160 427.7 160 416C160 388.1 178 364.6 202.1 355.8z" />
          </svg>
          <p className="font-medium text-sm text-stone-700 dark:text-stone-200">
            {title}
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          'not-prose relative overflow-hidden rounded-2xl bg-stone-50/60 p-2 dark:bg-stone-800/40',
          className,
        )}
        data-component-part="frame"
        data-name="frame"
        style={style}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-40 dark:opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '14px 14px',
            color: 'rgb(168 162 158 / 0.5)',
            backgroundPosition: '10px 10px',
          }}
          data-component-part="frame-background-pattern"
        />
        <div
          className="relative flex w-full justify-center overflow-hidden rounded-xl bg-white dark:bg-stone-900"
          data-component-part="frame-content"
        >
          {src ? (
            <img
              src={src}
              alt={finalAlt}
              width={width}
              height={height}
              className="block h-auto max-w-full"
              data-component-part="frame-image"
            />
          ) : null}
          {children}
        </div>

        {finalCaption ? (
          <div
            className="relative mt-2 flex min-h-[44px] items-center justify-center rounded-xl bg-white px-4 py-2 text-center text-sm text-stone-600 dark:bg-stone-900 dark:text-stone-400"
            data-component-part="frame-description"
          >
            <p className="m-0">{finalCaption}</p>
          </div>
        ) : null}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl border border-black/5 dark:border-white/5"
          data-component-part="frame-border"
        />
      </div>
    </div>
  );
}
