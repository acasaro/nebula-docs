import type { ThemeTokens } from '../types';
import { mcoeDefaultTokens } from './mcoeDefault';
import { uhcTokens } from './uhc';
import { optumTokens } from './optum';

export { mcoeDefaultTokens, uhcTokens, optumTokens };

export const allThemes: ThemeTokens[] = [
  mcoeDefaultTokens,
  uhcTokens,
  optumTokens,
];

export function getThemeById(id: string): ThemeTokens {
  return allThemes.find((t) => t.id === id) ?? mcoeDefaultTokens;
}
