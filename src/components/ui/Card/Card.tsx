import type { ReactNode } from 'react';
import Link from '@docusaurus/Link';
import { styled } from '@site/src/lib/styled';

const cardStyles = {
  display: 'block',
  textDecoration: 'none',
  color: 'inherit',
  borderRadius: '16px',
  border: '1px solid var(--mcoe-border-default)',
  padding: '32px 28px',
  background: 'var(--ifm-background-surface-color)',
  position: 'relative' as const,
  overflow: 'hidden' as const,
  transition: 'all 0.2s ease',
  '&:hover': {
    color: 'inherit',
    textDecoration: 'none',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  },
};

const CardBase = styled('div', cardStyles);
const CardLink = styled(Link, cardStyles);

const Bar = styled('div', {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '3px',
  opacity: 0.8,
  borderRadius: '16px 16px 0 0',
});

const Title = styled('h3', {
  fontSize: '18px',
  fontWeight: 650,
  marginBottom: '8px',
  marginTop: 0,
});

const Description = styled('p', {
  fontSize: '14px',
  color: 'var(--ifm-color-emphasis-600)',
  lineHeight: 1.6,
  margin: 0,
});

interface CardProps {
  title: string;
  description?: string;
  href?: string;
  accent?: string;
  children?: ReactNode;
}

export function Card({ title, description, href, accent, children }: CardProps) {
  const content = (
    <>
      {accent && <Bar style={{ background: accent }} />}
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      {children}
    </>
  );

  if (href) {
    return <CardLink to={href}>{content}</CardLink>;
  }
  return <CardBase>{content}</CardBase>;
}
