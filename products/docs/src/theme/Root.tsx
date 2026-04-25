import { type ReactNode } from 'react';
import { McoeThemeProvider } from './ThemeContext';
import { MuiThemeProvider } from './mui';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { AnalyticsProvider } from '../lib/analytics';

export default function Root({ children }: { children: ReactNode }) {
  return (
    <McoeThemeProvider>
      <MuiThemeProvider>
        <AnalyticsProvider>
          {children}
          <ThemeSwitcher />
        </AnalyticsProvider>
      </MuiThemeProvider>
    </McoeThemeProvider>
  );
}
