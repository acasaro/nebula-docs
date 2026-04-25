import type { ThemeTokens } from '../types';
import { sharedDarkSurfaces, sharedDarkSemantic } from './_sharedDark';

export const optumTokens: ThemeTokens = {
  id: 'optum',
  label: 'Optum',

  brandPrimary: '#FF612B',       // Abyss core.color.orange.100
  brandPrimaryDark: '#C24E14',
  brandPrimaryLight: '#FF8F6B',
  brandPrimaryOnDark: '#FF8F6B',
  brandAccent: '#0C55B8',        // Abyss core.color.brand.70
  brandAccentDark: '#002677',

  bgPrimary: '#ffffff',
  bgSecondary: '#f7fafc',
  bgTertiary: '#e3e8ee',
  bgInverse: '#1a1f36',

  textLink: '#0C55B8',           // Optum uses blue for links, not orange

  borderDefault: '#e3e8ee',
  borderMuted: '#c1c9d2',

  success: '#09825d',
  successLight: '#efffed',
  warning: '#FF612B',            // Optum orange doubles as warning
  warningLight: '#fff2ec',
  error: '#cd3d64',
  errorLight: '#fff8f5',
  info: '#0C55B8',
  infoLight: '#e8f0fb',

  heroGradient: 'linear-gradient(135deg, #FF612B 0%, #D14900 40%, #8B3000 100%)',
  heroOrb1: 'rgba(12, 85, 184, 0.25)',
  heroOrb2: 'rgba(255, 143, 107, 0.15)',

  codeBackground: '#2b2623',
  codeTitleBackground: '#1a1410',
  codeTitleText: '#b8a898',
  codePlainText: '#e8ddd6',
  codeKeyword: '#FF8F6B',
  codeString: '#ffd080',
  codeFunction: '#FF612B',
  codeNumber: '#79c0ff',
  codeComment: '#7a6a5a',
  codePunctuation: '#9a8878',
  codeSymbol: '#ffd080',

  darkMode: {
    ...sharedDarkSurfaces,
    ...sharedDarkSemantic,
    textLink: '#FF8F6B',
    brandPrimaryOnDark: '#FF8F6B',
    heroGradient: 'linear-gradient(135deg, #252836 0%, #1c1e26 100%)',
  },
};
