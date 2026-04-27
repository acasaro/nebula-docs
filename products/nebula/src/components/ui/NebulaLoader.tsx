/**
 * NebulaLoader — stellar-nursery loading indicator
 * InlineSpinner — flat circular spinner for buttons / inline use
 *
 * Drop-in React components. Zero dependencies beyond React 18+.
 * Keyframes are injected once on first render — no separate CSS file required.
 *
 *   import { NebulaLoader, InlineSpinner } from "./NebulaLoader";
 *
 *   <NebulaLoader size={64} theme="dark" />
 *   <InlineSpinner size={16} color="currentColor" />
 *
 * Brand tokens:
 *   Dark surface  → core uses #cedc00 (Lime), rings use rgba(206,220,0,…)
 *   Light surface → core uses #00665e (Opal Green), rings use rgba(0,111,98,…)
 */

import React, { useMemo, useRef, useEffect } from "react";

/* -------------------------------------------------------------------------- */
/*  Shared keyframe injection                                                 */
/* -------------------------------------------------------------------------- */

const KEYFRAMES_ID = "nebula-loader-keyframes";

const KEYFRAMES_CSS = `
@keyframes nb-spin {
  from { transform: rotate(0deg);   }
  to   { transform: rotate(360deg); }
}
@keyframes nb-spin-rev {
  from { transform: rotate(360deg); }
  to   { transform: rotate(0deg);   }
}
@keyframes nb-glow {
  0%, 100% { opacity: 1;    }
  50%      { opacity: 0.55; }
}
@keyframes nb-core {
  0%, 100% { opacity: 1;    transform: scale(1);    }
  50%      { opacity: 0.92; transform: scale(0.94); }
}
@keyframes nb-expand {
  0%, 100% { transform: scale(0.94); opacity: 0.85; }
  50%      { transform: scale(1.08); opacity: 1;    }
}
@keyframes nb-expand-out {
  0%, 100% { transform: scale(1.06); opacity: 1;   }
  50%      { transform: scale(0.95); opacity: 0.7; }
}
@keyframes nb-dissipate {
  0%   { transform: scale(0.4); opacity: 0;    }
  35%  { transform: scale(1);   opacity: 1;    }
  75%  { transform: scale(1.6); opacity: 0.35; }
  100% { transform: scale(2.0); opacity: 0;    }
}
@media (prefers-reduced-motion: reduce) {
  [data-nebula-loader] *,
  [data-nebula-spinner] * {
    animation-duration: 8s !important;
  }
}
`;

function useInjectKeyframes() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(KEYFRAMES_ID)) return;
    const style = document.createElement("style");
    style.id = KEYFRAMES_ID;
    style.textContent = KEYFRAMES_CSS;
    document.head.appendChild(style);
  }, []);
}

/* -------------------------------------------------------------------------- */
/*  NebulaLoader                                                              */
/* -------------------------------------------------------------------------- */

export type NebulaTheme = "light" | "dark";

export interface NebulaLoaderProps {
  /** Pixel size of the SVG. Designed for 16–96px. Default 64. */
  size?: number;
  /** Surface theme. Dark uses Lime (#cedc00); light uses Opal Green (#00665e). */
  theme?: NebulaTheme;
  /** Animation speed multiplier. 1 = default; <1 slower; >1 faster. */
  speed?: number;
  /**
   * "default" — full glyph (halo, gas puffs, two rings, core).
   * "minimal" — drops the halo, gas, and outer ring. Use ≤ 20px.
   * Auto-applied when size ≤ 20.
   */
  variant?: "default" | "minimal" | "auto";
  /** Cloud opacity 0..1. Default 0.7. */
  density?: number;
  /** Lime flare strength on dark surfaces, 0..1. Default 0.7. */
  flareIntensity?: number;
  /** Number of drifting gas puffs, 3..7. Default 5. */
  cloudCount?: number;
  /** Ring rendering: soft (blurred), crisp (sharp), or off. Default "soft". */
  ringStyle?: "soft" | "crisp" | "off";
  /** Accessible label for screen readers. Default "Loading". */
  label?: string;
  /** Optional className passthrough. */
  className?: string;
  /** Optional inline style passthrough. */
  style?: React.CSSProperties;
}

export function NebulaLoader({
  size = 64,
  theme = "light",
  speed = 1,
  variant = "auto",
  density = 0.7,
  flareIntensity = 0.7,
  cloudCount = 5,
  ringStyle = "soft",
  label = "Loading",
  className,
  style,
}: NebulaLoaderProps) {
  useInjectKeyframes();

  const isDark = theme === "dark";
  const core = isDark ? "#cedc00" : "#00665e";
  const flare = "#cedc00";
  const ringCol = isDark ? "rgba(206,220,0,0.40)" : "rgba(0,111,98,0.45)";

  const resolvedVariant =
    variant === "auto" ? (size <= 20 ? "minimal" : "default") : variant;
  const minimal = resolvedVariant === "minimal";

  // Stable per-instance id so multiple loaders don't share defs.
  const idRef = useRef(`nb-${Math.random().toString(36).slice(2, 9)}`);
  const uid = idRef.current;
  const haloId = `${uid}-halo`;
  const cloudGradId = `${uid}-cloud`;
  const flareGradId = `${uid}-flare`;
  const blurId = `${uid}-blur`;

  // Deterministic gas puff layout — same arrangement every render.
  const puffs = useMemo(() => {
    const seed = uid.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = (i: number) => {
      const x = Math.sin(seed * 9301 + i * 49297) * 233280;
      return x - Math.floor(x);
    };
    const n = Math.max(3, Math.min(7, cloudCount));
    const arr: {
      a: number; r: number; sz: number; dur: number;
      delay: number; dir: 1 | -1; isFlare: boolean;
    }[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 360 + rand(i * 3) * 24;
      const r = 4.5 + rand(i * 5) * 4.5;
      const sz = 2.4 + rand(i * 7) * 2.4;
      const dur = 5 + rand(i * 11) * 3.5;
      const delay = -rand(i * 13) * dur;
      const dir: 1 | -1 = rand(i * 17) > 0.5 ? 1 : -1;
      const isFlare = rand(i * 19) > 0.55;
      arr.push({ a, r, sz, dur, delay, dir, isFlare });
    }
    return arr;
  }, [uid, cloudCount]);

  const blurStd = size <= 24 ? 0.4 : size <= 48 ? 0.55 : 0.7;

  return (
    <svg
      data-nebula-loader
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="status"
      aria-label={label}
      className={className}
      style={{ display: "block", overflow: "visible", ...style }}
    >
      <defs>
        <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={core} stopOpacity="0.65" />
          <stop offset="45%" stopColor={core} stopOpacity="0.18" />
          <stop offset="100%" stopColor={core} stopOpacity="0" />
        </radialGradient>

        <radialGradient id={cloudGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={core} stopOpacity={0.55 * density} />
          <stop offset="60%" stopColor={core} stopOpacity={0.18 * density} />
          <stop offset="100%" stopColor={core} stopOpacity="0" />
        </radialGradient>

        <radialGradient id={flareGradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={flare} stopOpacity={0.7 * flareIntensity} />
          <stop offset="55%" stopColor={flare} stopOpacity={0.22 * flareIntensity} />
          <stop offset="100%" stopColor={flare} stopOpacity="0" />
        </radialGradient>

        <filter id={blurId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={blurStd} />
        </filter>
      </defs>

      {/* Halo */}
      {!minimal && (
        <circle
          cx="16"
          cy="16"
          r="13"
          fill={`url(#${haloId})`}
          style={{ animation: `nb-glow ${4.0 / speed}s ease-in-out infinite` }}
        />
      )}

      {/* Gas puffs */}
      {!minimal && (
        <g filter={`url(#${blurId})`}>
          {puffs.map((p, i) => {
            const x = 16 + Math.cos((p.a * Math.PI) / 180) * p.r;
            const y = 16 + Math.sin((p.a * Math.PI) / 180) * p.r;
            const fill = p.isFlare ? `url(#${flareGradId})` : `url(#${cloudGradId})`;
            const rotateDur = (p.dur * 1.4) / speed;
            const dissipateDur = p.dur / speed;
            return (
              <g
                key={i}
                style={{
                  transformOrigin: "16px 16px",
                  animation: `${p.dir > 0 ? "nb-spin" : "nb-spin-rev"} ${rotateDur}s linear infinite`,
                  animationDelay: `${p.delay}s`,
                }}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={p.sz}
                  fill={fill}
                  style={{
                    transformOrigin: `${x}px ${y}px`,
                    animation: `nb-dissipate ${dissipateDur}s ease-in-out infinite`,
                    animationDelay: `${p.delay * 0.7}s`,
                  }}
                />
              </g>
            );
          })}
        </g>
      )}

      {/* Tilted gas cloud (inner ellipse) */}
      {ringStyle !== "off" && (
        <g
          style={{
            transformOrigin: "16px 16px",
            animation: `nb-expand ${6.0 / speed}s ease-in-out infinite`,
          }}
        >
          <g
            style={{
              transformOrigin: "16px 16px",
              animation: `nb-spin ${5.5 / speed}s linear infinite`,
            }}
          >
            <ellipse
              cx="16"
              cy="16"
              rx="14"
              ry="6"
              stroke={ringCol}
              strokeWidth={ringStyle === "crisp" ? 0.9 : 0.7}
              strokeOpacity={ringStyle === "crisp" ? 1 : 0.85}
              transform="rotate(-22 16 16)"
              style={ringStyle === "soft" ? { filter: `url(#${blurId})` } : undefined}
            />
          </g>
        </g>
      )}

      {/* Outer ring */}
      {!minimal && ringStyle !== "off" && (
        <g
          style={{
            transformOrigin: "16px 16px",
            animation: `nb-expand-out ${7.5 / speed}s ease-in-out infinite`,
          }}
        >
          <g
            style={{
              transformOrigin: "16px 16px",
              animation: `nb-spin-rev ${10 / speed}s linear infinite`,
            }}
          >
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke={ringCol}
              strokeWidth="0.7"
              strokeOpacity="0.45"
              style={ringStyle === "soft" ? { filter: `url(#${blurId})` } : undefined}
            />
          </g>
        </g>
      )}

      {/* Stellar core */}
      <circle
        cx="16"
        cy="16"
        r="2.6"
        fill={core}
        style={{
          transformOrigin: "16px 16px",
          animation: `nb-core ${3.6 / speed}s ease-in-out infinite`,
        }}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  InlineSpinner                                                             */
/* -------------------------------------------------------------------------- */

export interface InlineSpinnerProps {
  /** Pixel size of the SVG. Default 16. */
  size?: number;
  /** Stroke color. Defaults to currentColor so it inherits text color. */
  color?: string;
  /** Animation speed multiplier. 1 = default; <1 slower; >1 faster. */
  speed?: number;
  /** Stroke thickness in viewBox units (32×32). Default 2.5. */
  strokeWidth?: number;
  /** Accessible label for screen readers. Default "Loading". */
  label?: string;
  /** Optional className passthrough. */
  className?: string;
  /** Optional inline style passthrough. */
  style?: React.CSSProperties;
}

/**
 * Flat circular spinner — a clean rotating arc on a faint track.
 * Use inside buttons, status pills, and other inline contexts where
 * the full Nebula glyph would be too busy or too small to read.
 */
export function InlineSpinner({
  size = 16,
  color = "currentColor",
  speed = 1,
  strokeWidth = 2.5,
  label = "Loading",
  className,
  style,
}: InlineSpinnerProps) {
  useInjectKeyframes();

  return (
    <svg
      data-nebula-spinner
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="status"
      aria-label={label}
      className={className}
      style={{
        display: "inline-block",
        verticalAlign: "-0.15em",
        overflow: "visible",
        ...style,
      }}
    >
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke={color}
        strokeOpacity="0.18"
        strokeWidth={strokeWidth}
      />
      <g
        style={{
          transformOrigin: "16px 16px",
          animation: `nb-spin ${0.85 / speed}s linear infinite`,
        }}
      >
        <path
          d="M 29 16 A 13 13 0 0 0 22.5 4.74"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

export default NebulaLoader;
