import { sharedDarkSurfaces, sharedDarkSemantic } from './_sharedDark';
/**
 * mcoe-default — Stripe-neutral palette. No strong brand color.
 * Used as both the SSR fallback (mirrored in dist/tokens.css) and a
 * selectable "no brand" theme.
 */
export const mcoeDefaultTokens = {
    id: 'mcoe-default',
    label: 'Default',
    brandPrimary: '#5469d4', // sail-color-blue-500
    brandPrimaryDark: '#3d4eac', // sail-color-blue-600
    brandPrimaryLight: '#7d89e0', // sail-color-blue-400
    brandPrimaryOnDark: '#84a9ff',
    brandAccent: '#3abff8',
    brandAccentDark: '#0ea5e9',
    bgPrimary: '#ffffff',
    bgSecondary: '#f7fafc', // sail-color-gray-50
    bgTertiary: '#e3e8ee', // sail-color-gray-100
    bgInverse: '#1a1f36', // sail-color-gray-900
    textLink: '#5469d4', // sail-color-blue-500
    borderDefault: '#e3e8ee', // sail-color-gray-100
    borderMuted: '#c1c9d2', // sail-color-gray-200
    success: '#09825d', // sail-color-green-500
    successLight: '#efffed', // sail-color-green-50
    warning: '#bb5504', // sail-color-yellow-500
    warningLight: '#fcf9e9', // sail-color-yellow-50
    error: '#cd3d64', // sail-color-red-500
    errorLight: '#fff8f5', // sail-color-red-50
    info: '#5469d4', // sail-color-blue-500
    infoLight: '#f5fbff', // sail-color-blue-50
    heroGradient: 'linear-gradient(135deg, #3d4eac 0%, #2d3a8c 40%, #1a2457 100%)',
    heroOrb1: 'rgba(84, 105, 212, 0.25)',
    heroOrb2: 'rgba(58, 191, 248, 0.15)',
    codeBackground: '#212d63',
    codeTitleBackground: '#161f4a',
    codeTitleText: '#a0aecf',
    codePlainText: '#cdd5e0',
    codeKeyword: '#84a9ff',
    codeString: '#84d896',
    codeFunction: '#d2a8ff',
    codeNumber: '#84d896',
    codeComment: '#6b7498',
    codePunctuation: '#8892b0',
    codeSymbol: '#fbb5b2',
    darkMode: {
        ...sharedDarkSurfaces,
        ...sharedDarkSemantic,
        textLink: '#84a9ff',
        brandPrimaryOnDark: '#84a9ff',
        heroGradient: 'linear-gradient(135deg, #252836 0%, #1c1e26 100%)',
    },
};
//# sourceMappingURL=mcoeDefault.js.map