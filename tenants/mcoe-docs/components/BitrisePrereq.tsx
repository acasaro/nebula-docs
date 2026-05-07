interface Props {
  feature?: string;
}

export function BitrisePrereq({ feature }: Props) {
  return (
    <div
      role="note"
      style={{
        margin: '20px 0',
        padding: '16px 20px',
        borderRadius: '8px',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderLeft: '4px solid #f59e0b',
        background: 'rgba(245, 158, 11, 0.06)',
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: '14px',
          marginBottom: '6px',
          color: '#92400e',
        }}
      >
        Prerequisite
      </div>
      <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
        Your project must be fully migrated to Bitrise CI before{' '}
        {feature ? `using ${feature}` : 'proceeding'}. If you haven't migrated yet, see{' '}
        <a
          href="/developers/mobile-ci/migrate-github-to-bitrise"
          style={{ color: 'var(--mcoe-brand-primary, #2563eb)', textDecoration: 'underline' }}
        >
          Migrating from GitHub to Bitrise
        </a>
        .
      </div>
    </div>
  );
}
