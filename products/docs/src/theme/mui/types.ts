import type {
  Theme,
  Shadows,
  Components,
  ColorSystemOptions,
  CssVarsThemeOptions,
  SupportedColorScheme,
  ThemeOptions as MuiThemeOptions,
} from '@mui/material/styles';
import type { CustomShadows } from './core/custom-shadows';

export type ThemeColorScheme = SupportedColorScheme;
export type ThemeCssVariables = Pick<
  CssVarsThemeOptions,
  | 'cssVarPrefix'
  | 'rootSelector'
  | 'colorSchemeSelector'
  | 'disableCssColorScheme'
  | 'shouldSkipGeneratingVar'
>;

export type ColorSchemeOptionsExtended = ColorSystemOptions & {
  shadows?: Partial<Shadows>;
  customShadows?: Partial<CustomShadows>;
};

export type SchemesRecord<T> = Partial<Record<ThemeColorScheme, T>>;

export type ThemeOptions = Omit<MuiThemeOptions, 'components'> &
  Pick<CssVarsThemeOptions, 'defaultColorScheme'> & {
    colorSchemes?: SchemesRecord<ColorSchemeOptionsExtended>;
    cssVariables?: ThemeCssVariables;
    components?: Components<Theme>;
  };

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;
