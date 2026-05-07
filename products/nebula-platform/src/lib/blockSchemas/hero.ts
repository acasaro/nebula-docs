import {
  Image as ImageIcon,
  Layers,
  Link2,
  Palette,
  Sparkles,
  Type,
} from 'lucide-react';
import type { BlockAttrSchema } from './types';

const VARIANT_OPTIONS = [
  { value: 'banner', label: 'Banner — full hero with CTAs' },
  { value: 'compact', label: 'Compact — slim title + subtitle' },
  { value: 'split', label: 'Split — two stacked tiers' },
] as const;

/**
 * Single-slide attrs are exposed in the form below. Multi-slide rotating
 * heroes (`<Hero slides={[...]} />`) round-trip through the editor as an
 * opaque `slides` JSX expression — those slides are preserved on save but
 * the form here doesn't yet edit them. The MdxHeroView shows a notice
 * when `slides` is set so the author knows the visible fields are a
 * single-slide preview, not the live render.
 */
export const heroSchema: BlockAttrSchema = {
  blockType: 'mdxHero',
  title: 'Hero options',
  headerIcon: Layers,
  inlinePopover: true,
  sections: [
    {
      label: 'Layout',
      fields: [
        {
          kind: 'select',
          key: 'variant',
          label: 'Variant',
          options: VARIANT_OPTIONS,
          placeholder: 'Banner',
        },
      ],
    },
    {
      label: 'Content',
      fields: [
        {
          kind: 'text',
          key: 'eyebrow',
          label: 'Eyebrow',
          icon: Sparkles,
          placeholder: 'Small uppercase line above the title',
        },
        {
          kind: 'text',
          key: 'title',
          label: 'Title',
          icon: Type,
          placeholder: 'Main heading',
        },
        {
          kind: 'text',
          key: 'accent',
          label: 'Accent (highlighted fragment)',
          icon: Sparkles,
          placeholder: 'Optional — appended to the title in accent color',
        },
        {
          kind: 'text',
          key: 'description',
          label: 'Description',
          icon: Type,
          placeholder: 'Supporting copy beneath the title',
        },
      ],
    },
    {
      label: 'Background',
      fields: [
        {
          kind: 'text',
          key: 'background',
          label: 'Background',
          icon: ImageIcon,
          placeholder: 'CSS color, gradient, or url(…)',
          upload: true,
          uploadCategory: 'image',
        },
        {
          kind: 'text',
          key: 'textColor',
          label: 'Text color',
          icon: Palette,
          placeholder: 'CSS color (e.g. #002677)',
        },
        {
          kind: 'text',
          key: 'accentColor',
          label: 'Accent color',
          icon: Palette,
          placeholder: 'CSS color for the accent fragment',
        },
      ],
    },
    {
      label: 'Split tier (split variant only)',
      fields: [
        {
          kind: 'text',
          key: 'secondaryTitle',
          label: 'Secondary title',
          icon: Type,
          placeholder: 'Bottom-tier heading',
        },
        {
          kind: 'text',
          key: 'secondaryDescription',
          label: 'Secondary description',
          icon: Type,
          placeholder: 'Bottom-tier description',
        },
        {
          kind: 'text',
          key: 'sideImage',
          label: 'Side image URL',
          icon: ImageIcon,
          type: 'url',
          placeholder: 'https://… or /assets/…',
          upload: true,
          uploadCategory: 'image',
        },
        {
          kind: 'text',
          key: 'sideImageAlt',
          label: 'Side image alt text',
          icon: Type,
          placeholder: 'Describe the side illustration',
        },
      ],
    },
    {
      label: 'Rotation',
      fields: [
        {
          kind: 'number',
          key: 'interval',
          label: 'Auto-advance (ms)',
          min: 1000,
          step: 500,
          placeholder: 'Manual only',
        },
      ],
    },
  ],
};
