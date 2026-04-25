import 'src/global.css';

import { themeConfig, ThemeProvider } from 'src/theme';
import { ProgressBar } from 'src/components/progress-bar';
import { MotionLazy } from 'src/components/animate/motion-lazy';
import { defaultSettings, SettingsProvider } from 'src/components/settings';

type AppProps = {
  children: React.ReactNode;
};

export default function App({ children }: AppProps) {
  return (
    <SettingsProvider defaultSettings={defaultSettings}>
      <ThemeProvider
        modeStorageKey={themeConfig.modeStorageKey}
        defaultMode={themeConfig.defaultMode}
      >
        <MotionLazy>
          <ProgressBar />
          {children}
        </MotionLazy>
      </ThemeProvider>
    </SettingsProvider>
  );
}
