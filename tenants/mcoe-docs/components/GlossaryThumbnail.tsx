const palette = {
  bg: '#1a2457',
  primary: '#5469d4',
  accent: '#3abff8',
  light: '#84a9ff',
  dot: '#84a9ff',
};

export function GlossaryThumbnail() {
  const { bg, primary, accent, light, dot } = palette;

  return (
    <svg width="100%" viewBox="0 0 680 420" role="img" xmlns="http://www.w3.org/2000/svg">
      <title>Glossary thumbnail</title>
      <desc>Typography-driven thumbnail featuring a large serif Aa letterform with accent underline in brand colors</desc>
      <defs>
        <clipPath id="glossary-frame">
          <rect x="0" y="0" width="680" height="420" rx="20" />
        </clipPath>
      </defs>
      <rect x="0" y="0" width="680" height="420" rx="20" fill={bg} />
      <g clipPath="url(#glossary-frame)">
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
        <text
          x="220"
          y="330"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="260"
          fontWeight="600"
          fill={light}
          opacity="0.18"
        >
          a
        </text>
        <text
          x="340"
          y="290"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="240"
          fontWeight="600"
          fill={light}
        >
          Aa
        </text>
        <rect x="240" y="314" width="200" height="8" rx="4" fill={primary} />
        <text
          x="340"
          y="362"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="22"
          fontWeight="400"
          fill={light}
          opacity="0.55"
          letterSpacing="8"
        >
          Bb Cc Dd
        </text>
      </g>
    </svg>
  );
}
