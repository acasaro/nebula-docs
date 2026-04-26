import styled from '@emotion/styled';
import type { ReactNode } from 'react';
import { resolveColor } from '@nebula/theme';
import { Icon, type IconLibrary } from '../icon/Icon';

export type CalloutVariant =
  | 'info'
  | 'warning'
  | 'note'
  | 'tip'
  | 'check'
  | 'danger'
  | 'custom';

const presets: Record<
  Exclude<CalloutVariant, 'custom'>,
  { icon: string; color: string; label: string }
> = {
  note:    { icon: 'info',          color: 'info',    label: 'Note' },
  info:    { icon: 'lightbulb',     color: 'primary', label: 'Info' },
  tip:     { icon: 'emoji_objects', color: 'success', label: 'Tip' },
  check:   { icon: 'check_circle',  color: 'success', label: 'Check' },
  warning: { icon: 'warning',       color: 'warning', label: 'Warning' },
  danger:  { icon: 'dangerous',     color: 'error',   label: 'Danger' },
};

const Header = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '8px',
});

const Content = styled.div({
  fontSize: '14px',
  lineHeight: 1.6,
  '& > *:last-child': { marginBottom: 0 },
});

export interface CalloutNaturalProps {
  children: ReactNode;
  title?: string;
  variant?: CalloutVariant;
  icon?: ReactNode | string;
  iconLibrary?: IconLibrary;
  color?: string;
  className?: string;
  ariaLabel?: string;
}

export function Callout({
  children,
  title,
  variant = 'note',
  icon,
  iconLibrary,
  color,
  className,
  ariaLabel,
}: CalloutNaturalProps) {
  const preset = variant !== 'custom' ? presets[variant] : null;
  const resolvedColor = resolveColor(color ?? preset?.color ?? 'info');
  const resolvedTitle = title ?? preset?.label;

  // Resolve icon: ReactNode passthrough, string via Icon, or preset default
  let iconElement: ReactNode = null;
  if (icon && typeof icon !== 'string') {
    iconElement = icon;
  } else {
    const iconName = (icon as string) ?? preset?.icon;
    if (iconName) {
      iconElement = (
        <Icon
          icon={iconName}
          size={18}
          color={color ?? preset?.color}
          iconLibrary={iconLibrary}
        />
      );
    }
  }

  return (
    <div
      className={className}
      role={ariaLabel ? 'note' : undefined}
      aria-label={ariaLabel}
      data-analytics-surface="mdx.callout"
      data-analytics-category={variant}
      style={{
        borderRadius: '12px',
        borderLeft: `4px solid ${resolvedColor}`,
        background: `color-mix(in srgb, ${resolvedColor} 8%, transparent)`,
        padding: '16px 20px',
        margin: '16px 0',
      }}
    >
      {(iconElement || resolvedTitle) && (
        <Header>
          {iconElement}
          {resolvedTitle && (
            <span style={{ fontSize: '14px', fontWeight: 650, color: resolvedColor }}>
              {resolvedTitle}
            </span>
          )}
        </Header>
      )}
      <Content>{children}</Content>
    </div>
  );
}

/* ── Convenience presets — for MDX shorthand like <Note>, <Tip>, etc. ── */

function createPreset(presetVariant: Exclude<CalloutVariant, 'custom'>) {
  return function PresetCallout({
    children,
    title,
    icon,
    iconLibrary,
    className,
    ariaLabel,
  }: Omit<CalloutNaturalProps, 'variant' | 'color'>) {
    return (
      <Callout
        variant={presetVariant}
        title={title}
        icon={icon}
        iconLibrary={iconLibrary}
        className={className}
        ariaLabel={ariaLabel}
      >
        {children}
      </Callout>
    );
  };
}

export const Note    = createPreset('note');
export const Warning = createPreset('warning');
export const Info    = createPreset('info');
export const Tip     = createPreset('tip');
export const Check   = createPreset('check');
export const Danger  = createPreset('danger');
