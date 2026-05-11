import { mcoeDefaultTokens } from './mcoeDefault';
import { uhcTokens } from './uhc';
import { optumTokens } from './optum';
export { mcoeDefaultTokens, uhcTokens, optumTokens };
export const allThemes = [
    mcoeDefaultTokens,
    uhcTokens,
    optumTokens,
];
export function getThemeById(id) {
    return allThemes.find((t) => t.id === id) ?? mcoeDefaultTokens;
}
//# sourceMappingURL=index.js.map