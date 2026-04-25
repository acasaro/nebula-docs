import React, { createContext, useContext, useState, useEffect, useLayoutEffect, type ReactNode } from 'react';
import { type ThemeTokens, getThemeById, allThemes } from '../lib/tokens';
import { THEME_STORAGE_KEY, DEFAULT_THEME_ID } from '../lib/constants';

interface ThemeContextValue {
  theme: ThemeTokens;
  themeId: string;
  isDark: boolean;
  setThemeId: (id: string) => void;
  themes: ThemeTokens[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within McoeThemeProvider');
  return ctx;
}

function applyTokensToDOM(tokens: ThemeTokens, isDark: boolean) {
  const root = document.documentElement;
  const dark = isDark ? tokens.darkMode : {};

  // Brand
  root.style.setProperty('--mcoe-brand-primary', tokens.brandPrimary);
  root.style.setProperty('--mcoe-brand-primary-dark', tokens.brandPrimaryDark);
  root.style.setProperty('--mcoe-brand-primary-light', tokens.brandPrimaryLight);
  root.style.setProperty('--mcoe-brand-accent', tokens.brandAccent);
  root.style.setProperty('--mcoe-brand-accent-dark', tokens.brandAccentDark);

  // Surfaces — use darkMode overrides if present
  root.style.setProperty('--mcoe-bg-primary', dark.bgPrimary ?? tokens.bgPrimary);
  root.style.setProperty('--mcoe-bg-secondary', dark.bgSecondary ?? tokens.bgSecondary);
  root.style.setProperty('--mcoe-bg-tertiary', dark.bgTertiary ?? tokens.bgTertiary);
  root.style.setProperty('--mcoe-bg-inverse', dark.bgInverse ?? tokens.bgInverse);

  // Link
  root.style.setProperty('--mcoe-text-link', dark.textLink ?? tokens.textLink);

  // Brand display — readable brand color for text; switches to onDark variant in dark mode
  const primaryOnDark = dark.brandPrimaryOnDark ?? tokens.brandPrimaryOnDark;
  root.style.setProperty('--mcoe-brand-display', isDark ? primaryOnDark : tokens.brandPrimary);

  // Borders
  root.style.setProperty('--mcoe-border-default', dark.borderDefault ?? tokens.borderDefault);
  root.style.setProperty('--mcoe-border-muted', dark.borderMuted ?? tokens.borderMuted);
  root.style.setProperty('--mcoe-border-nav', dark.borderDefault ?? tokens.borderDefault);

  // Semantic
  root.style.setProperty('--mcoe-success', dark.success ?? tokens.success);
  root.style.setProperty('--mcoe-success-light', dark.successLight ?? tokens.successLight);
  root.style.setProperty('--mcoe-warning', dark.warning ?? tokens.warning);
  root.style.setProperty('--mcoe-warning-light', dark.warningLight ?? tokens.warningLight);
  root.style.setProperty('--mcoe-error', dark.error ?? tokens.error);
  root.style.setProperty('--mcoe-error-light', dark.errorLight ?? tokens.errorLight);
  root.style.setProperty('--mcoe-info', dark.info ?? tokens.info);
  root.style.setProperty('--mcoe-info-light', dark.infoLight ?? tokens.infoLight);

  // Hero
  root.style.setProperty('--mcoe-hero-gradient', dark.heroGradient ?? tokens.heroGradient);
  root.style.setProperty('--mcoe-hero-orb-1', tokens.heroOrb1);
  root.style.setProperty('--mcoe-hero-orb-2', tokens.heroOrb2);

  // Code block
  root.style.setProperty('--mcoe-code-background', tokens.codeBackground);
  root.style.setProperty('--mcoe-code-title-background', tokens.codeTitleBackground);
  root.style.setProperty('--mcoe-code-title-text', tokens.codeTitleText);
  root.style.setProperty('--mcoe-code-plain', tokens.codePlainText);
  root.style.setProperty('--mcoe-code-keyword', tokens.codeKeyword);
  root.style.setProperty('--mcoe-code-string', tokens.codeString);
  root.style.setProperty('--mcoe-code-function', tokens.codeFunction);
  root.style.setProperty('--mcoe-code-number', tokens.codeNumber);
  root.style.setProperty('--mcoe-code-comment', tokens.codeComment);
  root.style.setProperty('--mcoe-code-punctuation', tokens.codePunctuation);

  // Docusaurus/Infima primary and link
  if (isDark) {
    root.style.setProperty('--ifm-color-primary', primaryOnDark);
    root.style.setProperty('--ifm-color-primary-dark', tokens.brandPrimaryLight);
    root.style.setProperty('--ifm-color-primary-light', primaryOnDark);
    root.style.setProperty('--ifm-link-color', dark.textLink ?? tokens.textLink);
  } else {
    root.style.setProperty('--ifm-color-primary', tokens.brandPrimary);
    root.style.setProperty('--ifm-color-primary-dark', tokens.brandPrimaryDark);
    root.style.setProperty('--ifm-color-primary-light', tokens.brandPrimaryLight);
    root.style.setProperty('--ifm-link-color', tokens.textLink);
  }
}

function getIsDark(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

export function McoeThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID;
    }
    return DEFAULT_THEME_ID;
  });

  const [isDark, setIsDark] = useState(getIsDark);
  const theme = getThemeById(themeId);

  // Apply tokens synchronously before paint — prevents flash on page navigation
  useLayoutEffect(() => {
    applyTokensToDOM(theme, isDark);
    document.documentElement.setAttribute('data-mcoe-theme', themeId);
  });

  // Watch for Docusaurus dark/light mode changes via data-theme attribute
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(getIsDark());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  // Persist theme selection
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ theme, themeId, isDark, setThemeId, themes: allThemes }}>
      {children}
    </ThemeContext.Provider>
  );
}
