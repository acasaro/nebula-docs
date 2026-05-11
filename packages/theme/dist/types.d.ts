/**
 * MCoE theme contracts.
 *
 * Two categories of tokens:
 *   - ThemeTokens — change per theme (mcoe-default / uhc / optum). Brand colors,
 *     surfaces, semantic colors, link, code-block syntax theme.
 *   - GlobalTokens — never theme-specific. Stripe Sail typography, spacing,
 *     radii, shadows, and the body/heading text colors that stay constant
 *     across themes (with a small light/dark override set).
 */
export interface ThemeTokens {
    id: string;
    label: string;
    brandPrimary: string;
    brandPrimaryDark: string;
    brandPrimaryLight: string;
    brandPrimaryOnDark: string;
    brandAccent: string;
    brandAccentDark: string;
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgInverse: string;
    textLink: string;
    borderDefault: string;
    borderMuted: string;
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    error: string;
    errorLight: string;
    info: string;
    infoLight: string;
    heroGradient: string;
    heroOrb1: string;
    heroOrb2: string;
    codeBackground: string;
    codeTitleBackground: string;
    codeTitleText: string;
    codePlainText: string;
    codeKeyword: string;
    codeString: string;
    codeFunction: string;
    codeNumber: string;
    codeComment: string;
    codePunctuation: string;
    codeSymbol: string;
    darkMode: {
        bgPrimary?: string;
        bgSecondary?: string;
        bgTertiary?: string;
        bgInverse?: string;
        textLink?: string;
        borderDefault?: string;
        borderMuted?: string;
        brandPrimaryOnDark?: string;
        success?: string;
        successLight?: string;
        warning?: string;
        warningLight?: string;
        error?: string;
        errorLight?: string;
        info?: string;
        infoLight?: string;
        heroGradient?: string;
    };
}
export interface GlobalTokens {
    fontFamily: string;
    fontFamilyMono: string;
    fontSizeXs: string;
    fontSizeSm: string;
    fontSizeBase: string;
    fontSizeMd: string;
    fontSizeLg: string;
    fontSizeXl: string;
    fontSize2xl: string;
    fontSize3xl: string;
    fontWeightRegular: string;
    fontWeightMedium: string;
    fontWeightBold: string;
    space1: string;
    space2: string;
    space3: string;
    space4: string;
    space5: string;
    space6: string;
    space7: string;
    space8: string;
    space9: string;
    space10: string;
    space11: string;
    radiusSm: string;
    radius: string;
    radiusMd: string;
    shadowXs: string;
    shadowSm: string;
    shadowMd: string;
    shadowLg: string;
    shadowFocus: string;
    textPrimary: string;
    textSecondary: string;
    textInverse: string;
    textHeading: string;
    bgDeepest: string;
    borderNav: string;
    brandDisplay: string;
    heroGradientGray: string;
    darkOverrides: {
        textPrimary: string;
        textSecondary: string;
        textHeading: string;
        textInverse: string;
        bgDeepest: string;
    };
}
//# sourceMappingURL=types.d.ts.map