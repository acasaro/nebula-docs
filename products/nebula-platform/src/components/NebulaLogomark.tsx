import type { SVGProps } from 'react';

/**
 * Nebula logomark — the orbital icon only (no wordmark text).
 * Extracted from the full nebula-wordmark SVGs in public/.
 *
 * Uses the brand teal (#00665E) in light mode and lime (#CEDC00) in dark mode,
 * matching the original wordmark color schemes. The `dark:` class variant
 * swaps fill/stroke via a pair of grouped paths — only one group is visible
 * at a time.
 */
export function NebulaLogomark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Light mode: teal */}
      <g className="dark:hidden">
        <path
          d="M15 28C22.732 28 29 21.732 29 14C29 6.26801 22.732 0 15 0C7.26801 0 1 6.26801 1 14C1 21.732 7.26801 28 15 28Z"
          stroke="#00665E"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
        <path
          d="M17.248 19.563C24.417 16.666 29.222 11.828 27.981 8.755C26.74 5.683 19.922 5.54 12.753 8.437C5.584 11.333 0.779 16.172 2.02 19.244C3.261 22.317 10.079 22.459 17.248 19.563Z"
          stroke="#00665E"
          strokeOpacity="0.59"
          strokeWidth="1.5"
        />
        <path
          d="M15 17.25C16.795 17.25 18.25 15.795 18.25 14C18.25 12.205 16.795 10.75 15 10.75C13.205 10.75 11.75 12.205 11.75 14C11.75 15.795 13.205 17.25 15 17.25Z"
          fill="#00665E"
        />
      </g>
      {/* Dark mode: lime */}
      <g className="hidden dark:block">
        <path
          d="M15 28C22.732 28 29 21.732 29 14C29 6.26801 22.732 0 15 0C7.26801 0 1 6.26801 1 14C1 21.732 7.26801 28 15 28Z"
          stroke="#CEDC00"
          strokeOpacity="0.22"
          strokeWidth="1.5"
        />
        <path
          d="M17.248 19.563C24.417 16.666 29.222 11.828 27.981 8.755C26.74 5.683 19.922 5.54 12.753 8.437C5.584 11.333 0.779 16.172 2.02 19.244C3.261 22.317 10.079 22.459 17.248 19.563Z"
          stroke="#CEDC00"
          strokeOpacity="0.55"
          strokeWidth="1.5"
        />
        <path
          d="M15 17.25C16.795 17.25 18.25 15.795 18.25 14C18.25 12.205 16.795 10.75 15 10.75C13.205 10.75 11.75 12.205 11.75 14C11.75 15.795 13.205 17.25 15 17.25Z"
          fill="#CEDC00"
        />
      </g>
    </svg>
  );
}
