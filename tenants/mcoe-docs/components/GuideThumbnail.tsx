const palette = {
  bg: '#1a2457',
  primary: '#5469d4',
  accent: '#3abff8',
  light: '#84a9ff',
  dot: '#84a9ff',
};

export function GuideThumbnail() {
  const { bg, primary, accent, light, dot } = palette;

  return (
    <svg width="100%" viewBox="0 0 680 420" role="img" xmlns="http://www.w3.org/2000/svg">
      <title>Branded guide thumbnail</title>
      <desc>Card thumbnail illustration with layered document cards using brand colors</desc>
      <defs>
        <clipPath id="guide-frame">
          <rect x="0" y="0" width="680" height="420" rx="20" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="680" height="420" rx="20" fill={bg} />
      <g clipPath="url(#guide-frame)">
        <circle cx="650" cy="60" r="110" fill={primary} />
        <circle cx="40" cy="400" r="150" fill={accent} opacity="0.55" />
        <circle cx="90" cy="90" r="3" fill={dot} opacity="0.7" />
        <circle cx="130" cy="110" r="3" fill={dot} opacity="0.7" />
        <circle cx="100" cy="140" r="3" fill={dot} opacity="0.7" />
        <circle cx="140" cy="70" r="3" fill={dot} opacity="0.5" />
        <circle cx="560" cy="340" r="3" fill={dot} opacity="0.7" />
        <circle cx="600" cy="360" r="3" fill={dot} opacity="0.7" />
        <circle cx="570" cy="380" r="3" fill={dot} opacity="0.7" />
        <circle cx="610" cy="320" r="3" fill={dot} opacity="0.5" />
        <rect x="250" y="140" width="320" height="220" rx="14" fill={accent} />
        <rect x="190" y="110" width="320" height="220" rx="14" fill={light} />
        <rect x="214" y="140" width="170" height="14" rx="7" fill={bg} />
        <rect x="214" y="174" width="260" height="8" rx="4" fill={bg} opacity="0.4" />
        <rect x="214" y="194" width="240" height="8" rx="4" fill={bg} opacity="0.4" />
        <rect x="214" y="214" width="220" height="8" rx="4" fill={bg} opacity="0.4" />
        <rect x="214" y="234" width="200" height="8" rx="4" fill={bg} opacity="0.4" />
        <rect x="214" y="270" width="120" height="36" rx="18" fill={primary} />
      </g>
    </svg>
  );
}
