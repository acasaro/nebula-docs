import { type ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeVarsProvider } from '@mui/material/styles';
import { useTheme } from '../ThemeContext';
import { createTheme } from './create-theme';

export function MuiThemeProvider({ children }: { children: ReactNode }) {
  const { theme: tokens, isDark } = useTheme();

  const muiTheme = useMemo(
    () => createTheme({ tokens, isDark }),
    [tokens, isDark]
  );

  return (
    <MuiThemeVarsProvider disableTransitionOnChange theme={muiTheme}>
      {children}
    </MuiThemeVarsProvider>
  );
}
