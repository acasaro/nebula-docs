import React, { useId } from "react";

type ColorType = "blue" | "light-blue" | "orange" | "white" | "multi-color" | "uhg" | "unknown";

interface AppIcon {
  src: string;
  isFeatured: boolean;
  colorType: ColorType;
}

const RAW_IMAGES: AppIcon[] = [
  { src: "/images/apps/blue-360x360bb-11.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/blue-360x360bb-3.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/blue-360x360bb-8.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/blue-360x360ia-11.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/blue-360x360ia-19.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/blue-360x360ia-22.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/blue-360x360ia-23.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/blue-360x360ia-24.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/blue-360x360ia-25.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/blue-360x360ia-27.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/blue-360x360ia-3.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/blue-360x360ia-6.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/blue-360x360ia-9.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/blue-360x360ia.png", isFeatured: false, colorType: "blue" },
  { src: "/images/apps/feature-360x360bb-5.png", isFeatured: true, colorType: "unknown" },
  { src: "/images/apps/feature-360x360ia-5.png", isFeatured: true, colorType: "unknown" },
  { src: "/images/apps/feature-blue-360x360bb-1.png", isFeatured: true, colorType: "blue" },
  { src: "/images/apps/feature-blue-360x360bb-10.png", isFeatured: true, colorType: "blue" },
  { src: "/images/apps/feature-blue-360x360bb-4.png", isFeatured: true, colorType: "blue" },
  { src: "/images/apps/feature-blue-360x360bb-6.png", isFeatured: true, colorType: "blue" },
  { src: "/images/apps/feature-light-blue-360x360ia-18.png", isFeatured: true, colorType: "light-blue" },
  { src: "/images/apps/feature-orange-360x360bb-1.png", isFeatured: true, colorType: "orange" },
  { src: "/images/apps/feature-orange-360x360bb-10.png", isFeatured: true, colorType: "orange" },
  { src: "/images/apps/feature-orange-360x360bb-4.png", isFeatured: true, colorType: "orange" },
  { src: "/images/apps/feature-orange-360x360bb-5.png", isFeatured: true, colorType: "orange" },
  { src: "/images/apps/feature-orange-360x360bb-6.png", isFeatured: true, colorType: "orange" },
  { src: "/images/apps/feature-orange-360x360bb-7.png", isFeatured: true, colorType: "orange" },
  { src: "/images/apps/feature-orange-360x360bb-9.png", isFeatured: true, colorType: "orange" },
  { src: "/images/apps/feature-orange-360x360ia-5.png", isFeatured: true, colorType: "orange" },
  { src: "/images/apps/feature-uhg-360x360bb-13.png", isFeatured: true, colorType: "uhg" },
  { src: "/images/apps/feature-white-360x360bb-7.png", isFeatured: true, colorType: "white" },
  { src: "/images/apps/feature-white-360x360bb-9.png", isFeatured: true, colorType: "white" },
  { src: "/images/apps/light-blue-360x360bb-12.png", isFeatured: false, colorType: "light-blue" },
  { src: "/images/apps/light-blue-360x360bb-4.png", isFeatured: false, colorType: "light-blue" },
  { src: "/images/apps/light-blue-360x360ia-21.png", isFeatured: false, colorType: "light-blue" },
  { src: "/images/apps/multi-color-360x360bb-2.png", isFeatured: false, colorType: "multi-color" },
  { src: "/images/apps/multi-color-360x360ia-4.png", isFeatured: false, colorType: "multi-color" },
  { src: "/images/apps/multi-color-360x360ia-7.png", isFeatured: false, colorType: "multi-color" },
  { src: "/images/apps/multi-color-360x360ia-8.png", isFeatured: false, colorType: "multi-color" },
  { src: "/images/apps/orange-360x360ia-12.png", isFeatured: false, colorType: "orange" },
  { src: "/images/apps/orange-360x360ia-14.png", isFeatured: false, colorType: "orange" },
  { src: "/images/apps/orange-360x360ia-15.png", isFeatured: false, colorType: "orange" },
  { src: "/images/apps/orange-360x360ia-16.png", isFeatured: false, colorType: "orange" },
  { src: "/images/apps/orange-360x360ia-17.png", isFeatured: false, colorType: "orange" },
  { src: "/images/apps/orange-360x360ia-20.png", isFeatured: false, colorType: "orange" },
  { src: "/images/apps/white-360x360bb.png", isFeatured: false, colorType: "white" },
  { src: "/images/apps/white-360x360ia-1.png", isFeatured: false, colorType: "white" },
  { src: "/images/apps/white-360x360ia-10.png", isFeatured: false, colorType: "white" },
  { src: "/images/apps/white-360x360ia-13.png", isFeatured: false, colorType: "white" },
  { src: "/images/apps/white-360x360ia-2.png", isFeatured: false, colorType: "white" },
  { src: "/images/apps/white-360x360ia-26.png", isFeatured: false, colorType: "white" },
];

const CHICLET_SIZE = 110;
const CHICLET_GAP = 20;
const CELL = CHICLET_SIZE + CHICLET_GAP;
const ROWS = 3;
const WRAPPER_HEIGHT =
  CHICLET_SIZE / 2 + CHICLET_GAP + CHICLET_SIZE + CHICLET_GAP + CHICLET_SIZE / 2;
const SCROLL_DURATION = 140;

const ROW_CONFIG: { xOffset: number; yOffset: number }[] = [
  { xOffset: 0, yOffset: -(CHICLET_SIZE / 2) },
  { xOffset: CELL * 0.5, yOffset: CHICLET_SIZE / 2 + CHICLET_GAP },
  { xOffset: 0, yOffset: CHICLET_SIZE / 2 + CHICLET_GAP + CHICLET_SIZE + CHICLET_GAP },
];

const ROW_SCALES = [0.92, 1, 0.92];

const COLOR_ORDER: ColorType[] = [
  "blue",
  "orange",
  "white",
  "light-blue",
  "multi-color",
  "uhg",
  "unknown",
];

function groupByColor(icons: AppIcon[]): Map<ColorType, AppIcon[]> {
  const map = new Map<ColorType, AppIcon[]>();
  for (const icon of icons) {
    const arr = map.get(icon.colorType) ?? [];
    arr.push(icon);
    map.set(icon.colorType, arr);
  }
  return map;
}

function roundRobinMerge(buckets: Map<ColorType, AppIcon[]>, order: ColorType[]): AppIcon[] {
  const result: AppIcon[] = [];
  const copies = new Map(order.map((c) => [c, [...(buckets.get(c) ?? [])]]));
  let any = true;
  while (any) {
    any = false;
    for (const color of order) {
      const arr = copies.get(color)!;
      if (arr.length > 0) {
        result.push(arr.shift()!);
        any = true;
      }
    }
  }
  return result;
}

function buildRows(): AppIcon[][] {
  const featured = RAW_IMAGES.filter((i) => i.isFeatured);
  const regular = roundRobinMerge(
    groupByColor(RAW_IMAGES.filter((i) => !i.isFeatured)),
    COLOR_ORDER,
  );

  const iconsPerRow = Math.ceil(RAW_IMAGES.length / ROWS) + 2;
  const regularQ = [...regular];

  const row0 = regularQ.splice(0, iconsPerRow);
  const row2 = regularQ.splice(0, iconsPerRow);

  const middleRegular = [...regularQ];
  const middleBase: AppIcon[] = [];
  const featuredQ = [...featured];
  while (featuredQ.length > 0 || middleRegular.length > 0) {
    if (middleRegular.length > 0) middleBase.push(middleRegular.shift()!);
    if (featuredQ.length > 0) middleBase.push(featuredQ.shift()!);
  }

  const base = [row0, middleBase, row2];
  return base.map((row) => [...row, ...row, ...row]);
}

const wrapperStyle: React.CSSProperties = {
  position: "relative",
  left: "50%",
  right: "50%",
  marginLeft: "-50vw",
  marginRight: "-50vw",
  width: "100vw",
  maxWidth: "100vw",
  overflow: "hidden",
  height: `${WRAPPER_HEIGHT}px`,
  maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
};

export function AppsHero() {
  const rows = buildRows();
  const id = useId().replace(/:/g, "");
  const animLeft = `apps-hero-left-${id}`;
  const animRight = `apps-hero-right-${id}`;
  const animFade = `apps-hero-fade-${id}`;

  const css = `
    @keyframes ${animLeft} {
      from { transform: translateX(0); }
      to { transform: translateX(-33.333%); }
    }
    @keyframes ${animRight} {
      from { transform: translateX(-33.333%); }
      to { transform: translateX(0); }
    }
    @keyframes ${animFade} {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .apps-hero-${id} .row {
      display: flex;
      flex-direction: row;
      gap: ${CHICLET_GAP}px;
      position: absolute;
      flex-shrink: 0;
      opacity: 0;
      will-change: transform;
    }
    .apps-hero-${id} .row.left {
      animation: ${animFade} 0.8s ease forwards, ${animLeft} ${SCROLL_DURATION}s linear infinite;
    }
    .apps-hero-${id} .row.right {
      animation: ${animFade} 0.8s ease forwards, ${animRight} ${SCROLL_DURATION}s linear infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .apps-hero-${id} .row { animation: none !important; opacity: 1 !important; }
    }
  `;

  return (
    <div className={`apps-hero-${id}`} style={wrapperStyle} aria-hidden='true'>
      <style>{css}</style>
      {rows.map((icons, rowIndex) => {
        const { xOffset, yOffset } = ROW_CONFIG[rowIndex]!;
        const scale = ROW_SCALES[rowIndex]!;
        const size = Math.round(CHICLET_SIZE * scale);
        const direction = rowIndex === 1 ? "right" : "left";
        const shadow =
          rowIndex === 1 ? "0 8px 24px rgba(0,0,0,0.18)" : "0 2px 8px rgba(0,0,0,0.08)";

        return (
          <div
            key={rowIndex}
            className={`row ${direction}`}
            style={{
              top: yOffset,
              left: xOffset,
              animationDelay: `${rowIndex * 150}ms, 0s`,
            }}
          >
            {icons.map((icon, i) => (
              <img
                key={`${rowIndex}-${i}`}
                src={icon.src}
                alt=''
                style={{
                  width: size,
                  height: size,
                  borderRadius: "20%",
                  objectFit: "cover",
                  display: "block",
                  flexShrink: 0,
                  boxShadow: shadow,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default AppsHero;
