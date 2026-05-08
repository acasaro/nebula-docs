import type { LucideIcon } from 'lucide-react';
import type { IconLibrary, IconType } from '@nebula-docs/components';
import type { AssetCategory } from '@/lib/assets';

export type BlockAttrs = Record<string, unknown>;

interface BaseField {
  /** Tiptap node attribute key. */
  key: string;
  label: string;
  description?: string;
  /** Small icon shown next to the field's label. */
  icon?: LucideIcon;
}

export type AttrField =
  | (BaseField & {
      kind: 'text';
      placeholder?: string;
      type?: 'text' | 'url' | 'email';
      /** When true, the field renders an Upload button that opens the
       *  asset picker / uploader. The picked asset's `downloadUrl` is
       *  written into this field's key. */
      upload?: boolean;
      /** Asset category to surface in the picker. Defaults to `image`. */
      uploadCategory?: AssetCategory;
    })
  | (BaseField & {
      kind: 'number';
      placeholder?: string;
      min?: number;
      max?: number;
      step?: number;
    })
  | (BaseField & {
      kind: 'toggle';
    })
  | (BaseField & {
      kind: 'select';
      options: ReadonlyArray<{ value: string; label: string }>;
      placeholder?: string;
    })
  | (BaseField & {
      kind: 'swatch';
      /** Each option is rendered as a clickable color square. `color`
       *  accepts any valid CSS color (CSS var, hex, hsl, etc.). `label`
       *  is used for tooltip + a11y. */
      options: ReadonlyArray<{ value: string; color: string; label?: string }>;
    })
  | (BaseField & {
      kind: 'icon';
      /** Attribute key holding the icon library. */
      libraryKey: string;
      /** Attribute key holding the icon type/variant (optional). */
      typeKey?: string;
    });

export interface AttrSection {
  label: string;
  fields: ReadonlyArray<AttrField>;
}

export interface BlockAttrSchema {
  /** Tiptap node type name, e.g. "mdxCard". */
  blockType: string;
  /** Title shown in the AttributesPopover header. */
  title: string;
  /** Optional small icon shown next to the title. */
  headerIcon?: LucideIcon;
  /** When true, the BlockHandle's right-side kebab is suppressed for this
   * node — its NodeView is expected to render its own ellipsis trigger. */
  inlinePopover?: boolean;
  sections: ReadonlyArray<AttrSection>;
}

export interface IconAttrValue {
  icon: string | null;
  iconLibrary: IconLibrary | null;
  iconType: IconType | null;
}
