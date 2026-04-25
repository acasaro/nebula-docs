import { useState } from 'react';
import { useTheme } from '../../hooks';
import { styled } from '@site/src/lib/styled';
import { track } from '@site/src/lib/analytics';

const Wrapper = styled('div', {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  zIndex: 9999,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
});

const Dropdown = styled('div', {
  position: 'absolute',
  bottom: '52px',
  right: 0,
  width: '220px',
  background: '#1e1e1e',
  borderRadius: '12px',
  border: '1px solid #333',
  boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
  overflow: 'hidden',
  padding: '6px',
});

const DropdownLabel = styled('div', {
  padding: '8px 12px 10px',
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1.5px',
  color: '#666',
});

const Option = styled('button', {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  padding: '10px 12px',
  border: 'none',
  borderRadius: '8px',
  background: 'transparent',
  color: '#e5e5e5',
  fontSize: '13px',
  fontWeight: 400,
  cursor: 'pointer',
  textAlign: 'left',
  '&:hover': { background: '#2a2a2a' },
});

const Swatches = styled('span', {
  display: 'flex',
  gap: '3px',
});

const Toggle = styled('button', {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 16px',
  borderRadius: '100px',
  border: '1px solid #333',
  background: '#1e1e1e',
  color: '#e5e5e5',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
  letterSpacing: '0.3px',
});

const swatchStyle = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  display: 'inline-block',
};

export function ThemeSwitcher() {
  const { theme, themeId, setThemeId, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Wrapper data-analytics-ignore="">
      {isOpen && (
        <Dropdown>
          <DropdownLabel>Theme</DropdownLabel>
          {themes.map((t) => (
            <Option
              key={t.id}
              style={themeId === t.id ? { background: '#2a2a2a', fontWeight: 600 } : undefined}
              onClick={() => {
                if (t.id !== themeId) {
                  track('theme_switch', { from_theme: themeId, to_theme: t.id });
                }
                setThemeId(t.id);
                setIsOpen(false);
              }}
            >
              <Swatches>
                <span style={{ ...swatchStyle, background: t.brandPrimary }} />
                <span style={{ ...swatchStyle, background: t.brandAccent }} />
              </Swatches>
              {t.label}
              {themeId === t.id && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#888' }}>✓</span>}
            </Option>
          ))}
        </Dropdown>
      )}
      <Toggle onClick={() => setIsOpen(!isOpen)}>
        <span style={{ ...swatchStyle, background: theme.brandAccent, boxShadow: `0 0 6px ${theme.brandAccent}80` }} />
        <span style={{ ...swatchStyle, background: theme.brandPrimary, boxShadow: `0 0 6px ${theme.brandPrimary}80`, marginLeft: '-4px' }} />
        {theme.label}
        <span style={{ fontSize: '10px', opacity: 0.5 }}>{isOpen ? '▼' : '▲'}</span>
      </Toggle>
    </Wrapper>
  );
}
