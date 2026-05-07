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
  { src: "/images/apps/feature-360x360bb-5.png", isFeatured: true, colorType: "unknown" },
  { src: "/images/apps/feature-blue-360x360bb-1.png", isFeatured: true, colorType: "blue" },
  { src: "/images/apps/feature-blue-360x360bb-10.png", isFeatured: true, colorType: "blue" },
  { src: "/images/apps/feature-blue-360x360bb-4.png", isFeatured: true, colorType: "blue" },
  {
    src: "/images/apps/feature-light-blue-360x360ia-18.png",
    isFeatured: true,
    colorType: "light-blue",
  },
  { src: "/images/apps/feature-orange-360x360bb-1.png", isFeatured: true, colorType: "orange" },
  { src: "/images/apps/feature-orange-360x360bb-10.png", isFeatured: true, colorType: "orange" },
  { src: "/images/apps/feature-orange-360x360bb-5.png", isFeatured: true, colorType: "orange" },
  { src: "/images/apps/feature-uhg-360x360bb-13.png", isFeatured: true, colorType: "uhg" },
  { src: "/images/apps/feature-white-360x360bb-7.png", isFeatured: true, colorType: "white" },
  { src: "/images/apps/feature-white-360x360bb-9.png", isFeatured: true, colorType: "white" },
  { src: "/images/apps/light-blue-360x360bb-12.png", isFeatured: false, colorType: "light-blue" },
  { src: "/images/apps/multi-color-360x360bb-2.png", isFeatured: false, colorType: "multi-color" },
  { src: "/images/apps/multi-color-360x360ia-4.png", isFeatured: false, colorType: "multi-color" },
  { src: "/images/apps/orange-360x360ia-12.png", isFeatured: false, colorType: "orange" },
  { src: "/images/apps/orange-360x360ia-14.png", isFeatured: false, colorType: "orange" },
  { src: "/images/apps/white-360x360bb.png", isFeatured: false, colorType: "white" },
  { src: "/images/apps/white-360x360ia-1.png", isFeatured: false, colorType: "white" },
];

const CHICLET_SIZE = 88;
const CHICLET_GAP = 16;

const wrapperStyle: React.CSSProperties = {
  width: "100%",
  overflow: "hidden",
  padding: "32px 24px",
  background:
    "linear-gradient(135deg, rgba(241,245,249,0.93) 0%, rgba(237,242,247,0.95) 100%), url(/images/landing/pixel-pattern-hero.jpg)",
  backgroundSize: "cover",
  backgroundPosition: "center",
  maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  gap: `${CHICLET_GAP}px`,
  marginBottom: `${CHICLET_GAP}px`,
};

const iconStyle: React.CSSProperties = {
  width: CHICLET_SIZE,
  height: CHICLET_SIZE,
  borderRadius: "20%",
  objectFit: "cover",
  display: "block",
  flexShrink: 0,
  boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
};

export function AppsHeroComponent() {
  const half = Math.ceil(RAW_IMAGES.length / 2);
  const row1 = RAW_IMAGES.slice(0, half);
  const row2 = RAW_IMAGES.slice(half);

  return (
    <div style={wrapperStyle} aria-hidden='true'>
      <div style={{ ...rowStyle, justifyContent: "center" }}>
        {row1.map((icon, i) => (
          <img key={`r1-${i}`} src={icon.src} alt='' style={iconStyle} />
        ))}
      </div>
      <div style={{ ...rowStyle, justifyContent: "center", marginBottom: 0 }}>
        {row2.map((icon, i) => (
          <img key={`r2-${i}`} src={icon.src} alt='' style={iconStyle} />
        ))}
      </div>
    </div>
  );
}
