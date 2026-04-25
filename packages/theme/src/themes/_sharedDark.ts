/**
 * Shared dark-mode neutral surfaces and semantic colors.
 * UHC, Optum, and mcoe-default use the same dark neutrals; brand colors
 * stay distinct.
 */

export const sharedDarkSurfaces = {
  bgPrimary: '#1c1e26',
  bgSecondary: '#14161e',
  bgTertiary: '#252836',
  bgInverse: '#f0f2f5',
  borderDefault: '#353847',
  borderMuted: '#282b3a',
} as const;

export const sharedDarkSemantic = {
  success: '#3fbf68',
  successLight: '#1a3326',
  warning: '#f5a623',
  warningLight: '#332514',
  error: '#f06272',
  errorLight: '#331820',
  info: '#5a9cf5',
  infoLight: '#162238',
} as const;
