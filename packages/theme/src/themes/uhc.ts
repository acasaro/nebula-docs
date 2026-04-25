import type { ThemeTokens } from '../types';
import { sharedDarkSurfaces, sharedDarkSemantic } from './_sharedDark';

export const uhcTokens: ThemeTokens = {
  id: 'uhc',
  label: 'UHC',

  brandPrimary: '#002677',       // Abyss core.color.brand.100
  brandPrimaryDark: '#00184D',   // Abyss core.color.brand.120
  brandPrimaryLight: '#0C55B8',  // Abyss core.color.brand.70
  brandPrimaryOnDark: '#5A9CF5',
  brandAccent: '#00BED5',        // Abyss core.color.pacific.100
  brandAccentDark: '#149E8F',    // Abyss core.color.turquoise.100

  bgPrimary: '#ffffff',
  bgSecondary: '#f7fafc',
  bgTertiary: '#e3e8ee',
  bgInverse: '#1a1f36',

  textLink: '#0C55B8',           // UHC brand blue

  borderDefault: '#e3e8ee',
  borderMuted: '#c1c9d2',

  success: '#09825d',
  successLight: '#efffed',
  warning: '#bb5504',
  warningLight: '#fcf9e9',
  error: '#cd3d64',
  errorLight: '#fff8f5',
  info: '#0C55B8',               // UHC blue for info
  infoLight: '#e8f0fb',

  heroGradient: 'linear-gradient(135deg, #002677 0%, #00184D 40%, #000f3d 100%)',
  heroOrb1: 'rgba(0, 190, 213, 0.25)',
  heroOrb2: 'rgba(12, 85, 184, 0.15)',

  codeBackground: '#0d1b3e',
  codeTitleBackground: '#071030',
  codeTitleText: '#8aabcc',
  codePlainText: '#cdd5e0',
  codeKeyword: '#5A9CF5',
  codeString: '#7ecbca',
  codeFunction: '#00BED5',
  codeNumber: '#79c0ff',
  codeComment: '#5a6a8a',
  codePunctuation: '#8892b0',
  codeSymbol: '#79c0ff',

  darkMode: {
    ...sharedDarkSurfaces,
    ...sharedDarkSemantic,
    textLink: '#5A9CF5',
    brandPrimaryOnDark: '#5A9CF5',
    info: '#5A9CF5',
    infoLight: '#162238',
    heroGradient: 'linear-gradient(135deg, #252836 0%, #1c1e26 100%)',
  },
};
