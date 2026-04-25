export type { ThemeTokens } from '../lib/tokens';

export interface NavLinkItem {
  label: string;
  href: string;
  tag?: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface FeatureCardItem {
  title: string;
  description: string;
  href: string;
  accent: string;
}

export interface PipelineStage {
  n: string;
  label: string;
  sub: string;
}
