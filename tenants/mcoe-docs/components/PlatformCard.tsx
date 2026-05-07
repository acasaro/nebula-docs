import type { ReactNode } from 'react';

const config: Record<string, { label: string; color: string; icon: string }> = {
  ios: { label: 'iOS', color: '#147EFB', icon: '/images/icons/ios_platform.svg' },
  android: { label: 'Android', color: '#3DDC84', icon: '/images/icons/android_platform.svg' },
};

interface Props {
  platform: 'ios' | 'android' | string;
  children: ReactNode;
}

export function PlatformCard({ platform, children }: Props) {
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
      <div
        style={{
          fontWeight: 600,
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '15px',
          color,
        }}
      >
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: '18px',
            height: '18px',
            backgroundColor: color,
            maskImage: `url(${icon})`,
            WebkitMaskImage: `url(${icon})`,
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
        {label}
      </div>
      <div className="platform-card-body">{children}</div>
    </div>
  );
}
