import type { LucideIcon } from 'lucide-react';
import type { IconLibrary, IconType } from '@nebula-docs/components';

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
  sections: ReadonlyArray<AttrSection>;
}

export interface IconAttrValue {
  icon: string | null;
  iconLibrary: IconLibrary | null;
  iconType: IconType | null;
}
