import { styled } from '@site/src/lib/styled';

const Grid = styled('div', {
  display: 'flex',
  gap: '16px',
  padding: '28px 32px',
  borderRadius: '16px',
  border: '1px solid var(--mcoe-border-default)',
  background: 'var(--ifm-background-surface-color)',
  marginBottom: '48px',
  flexWrap: 'wrap',
  '@media (min-width: 997px)': { flexWrap: 'nowrap' },
  '@media (max-width: 996px)': { padding: '20px 24px' },
});

const Stat = styled('div', {
  textAlign: 'center',
  flex: 1,
  '@media (max-width: 996px)': { flex: '0 0 calc(50% - 8px)' },
});

const StatValue = styled('div', {
  fontSize: '28px',
  fontWeight: 750,
  letterSpacing: '-0.03em',
  lineHeight: 1.2,
  background: 'linear-gradient(135deg, var(--mcoe-brand-primary), var(--mcoe-brand-primary-light))',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});

const StatLabel = styled('div', {
  fontSize: '13px',
  color: 'var(--ifm-color-emphasis-600)',
  fontWeight: 500,
  marginTop: '4px',
});

const items = [
  { value: '2', label: 'Platforms' },
  { value: '5', label: 'Release Stages' },
  { value: '40+', label: 'Technical Docs' },
  { value: '100%', label: 'Bitrise Coverage' },
];

export function StatsGrid() {
  return (
    <Grid>
      {items.map((item) => (
        <Stat key={item.label}>
          <StatValue>{item.value}</StatValue>
          <StatLabel>{item.label}</StatLabel>
        </Stat>
      ))}
    </Grid>
  );
}
