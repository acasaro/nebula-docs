/**
 * Map simple color names ("info", "warning", "primary") to CSS variable
 * references. Component authors can pass token names instead of raw vars.
 * Unknown values pass through unchanged (so hex, rgb(), etc. still work).
 */
const tokenColorMap: Record<string, string> = {
  info: 'var(--mcoe-info)',
  'info-light': 'var(--mcoe-info-light)',
  warning: 'var(--mcoe-warning)',
  'warning-light': 'var(--mcoe-warning-light)',
  success: 'var(--mcoe-success)',
  'success-light': 'var(--mcoe-success-light)',
  error: 'var(--mcoe-error)',
  'error-light': 'var(--mcoe-error-light)',
  primary: 'var(--mcoe-brand-primary)',
  'primary-dark': 'var(--mcoe-brand-primary-dark)',
  'primary-light': 'var(--mcoe-brand-primary-light)',
  accent: 'var(--mcoe-brand-accent)',
  'accent-dark': 'var(--mcoe-brand-accent-dark)',
  'text-link': 'var(--mcoe-text-link)',
  border: 'var(--mcoe-border-default)',
  'border-muted': 'var(--mcoe-border-muted)',
};

export function resolveColor(value: string): string {
  return tokenColorMap[value] ?? value;
}
