import type { Theme, Components } from '@mui/material/styles';
import type { ThemeOptions } from './types';
import type { ThemeTokens } from '../../lib/tokens';

import { createTheme as createMuiTheme } from '@mui/material/styles';
import { createPaletteChannel } from 'minimal-shared/utils';

import { mixins } from './core/mixins';
import { opacity } from './core/opacity';
import { shadows } from './core/shadows';
import { palette } from './core/palette';
import { components } from './core/components';
import { typography } from './core/typography';
import { customShadows } from './core/custom-shadows';

// ----------------------------------------------------------------------

function buildBrandPalette(tokens: ThemeTokens) {
  return {
    primary: createPaletteChannel({
      lighter: tokens.brandPrimaryLight,
      light: tokens.brandPrimaryLight,
      main: tokens.brandPrimary,
      dark: tokens.brandPrimaryDark,
      darker: tokens.brandPrimaryDark,
      contrastText: '#FFFFFF',
    }),
    secondary: createPaletteChannel({
      lighter: tokens.brandAccent,
      light: tokens.brandAccent,
      main: tokens.brandAccent,
      dark: tokens.brandAccentDark,
      darker: tokens.brandAccentDark,
      contrastText: '#FFFFFF',
    }),
  };
}

type CreateThemeProps = {
  tokens: ThemeTokens;
  isDark: boolean;
  themeOverrides?: ThemeOptions;
  localeComponents?: { components?: Components<Theme> };
};

export function createTheme({
  tokens,
  isDark,
  themeOverrides = {},
  localeComponents = {},
}: CreateThemeProps): Theme {
  const brand = buildBrandPalette(tokens);
  const colorScheme = isDark ? 'dark' : 'light';

  const baseTheme: ThemeOptions = {
    colorSchemes: {
      light: {
        palette: { ...palette.light, ...brand },
        shadows: shadows.light,
        customShadows: customShadows.light,
        opacity,
      },
      dark: {
        palette: { ...palette.dark, ...brand },
        shadows: shadows.dark,
        customShadows: customShadows.dark,
        opacity,
      },
    },
    defaultColorScheme: colorScheme,
    mixins,
    components,
    typography,
    shape: { borderRadius: 8 },
    direction: 'ltr',
    cssVariables: {
      cssVarPrefix: 'mui',
      colorSchemeSelector: 'media', // use media queries, not DOM attributes — no style injection on navigation
      disableCssColorScheme: true,  // don't set color-scheme CSS property on :root
    },
  };

  return createMuiTheme(baseTheme, localeComponents, themeOverrides);
}
