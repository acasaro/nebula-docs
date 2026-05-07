interface Stage {
  name: string;
  status: 'completed' | 'active' | 'upcoming';
  label?: string;
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  completed: { bg: '#dcfce7', text: '#166534', dot: '#22c55e' },
  active: { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  upcoming: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
};

export function StageStatus({ stages }: { stages: Stage[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '13px', margin: '20px 0' }}>
      {stages.map((stage, i) => {
        const colors = statusColors[stage.status] || statusColors.upcoming;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '20px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              backgroundColor: colors.bg,
              color: colors.text,
            }}
          >
            <span
              aria-hidden
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                flexShrink: 0,
                backgroundColor: colors.dot,
              }}
            />
            <span style={{ fontWeight: 500 }}>{stage.name}</span>
            {stage.label && (
              <span style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.8 }}>
                {stage.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
