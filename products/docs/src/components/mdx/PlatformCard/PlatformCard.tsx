import type { ReactNode } from 'react';
import { styled } from '@site/src/lib/styled';
import { Icon } from '@site/src/components/mdx/Icon/Icon';

const CardHeader = styled('div', {
  fontWeight: 600,
  marginBottom: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '15px',
});

const CardContent = styled('div', {
  '& ol, & ul': { marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '12px' },
  '& > *:last-child': { marginBottom: 0 },
  '& ol li:last-child, & ul li:last-child': { paddingBottom: '20px' },
});

const config: Record<string, { label: string; color: string; icon: string }> = {
  ios: { label: 'iOS', color: '#147EFB', icon: '/images/icons/ios_platform.svg' },
  android: { label: 'Android', color: '#3DDC84', icon: '/images/icons/android_platform.svg' },
};

interface PlatformCardProps {
  platform: 'ios' | 'android';
  children: ReactNode;
}

export function PlatformCard({ platform, children }: PlatformCardProps) {
  const { label, color, icon } = config[platform] || config.ios;

  return (
    <div
      data-analytics-surface="mdx.platform_card"
      data-analytics-category={platform}
      style={{
        border: `1px solid ${color}33`,
        borderLeft: `4px solid ${color}`,
        borderRadius: '8px',
        padding: '16px 20px',
        marginBottom: '12px',
        background: `${color}08`,
      }}
    >
      <CardHeader>
        <Icon icon={icon} color={color} size={18} />
        {label}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </div>
  );
}
