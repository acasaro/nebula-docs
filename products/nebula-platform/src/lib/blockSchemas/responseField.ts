import { Asterisk, Code2, Hash, ShieldAlert, ShieldCheck, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const responseFieldSchema: BlockAttrSchema = {
  blockType: 'mdxResponseField',
  title: 'Edit ResponseField',
  headerIcon: ShieldCheck,
  sections: [
    {
      label: 'Identity',
      fields: [
        {
          kind: 'text',
          key: 'name',
          label: 'Name',
          icon: Hash,
          placeholder: 'field name',
        },
        {
          kind: 'text',
          key: 'type',
          label: 'Type',
          icon: Code2,
          placeholder: 'string, number, …',
        },
      ],
    },
    {
      label: 'Defaults',
      fields: [
        {
          kind: 'text',
          key: 'default',
          label: 'Default value',
          icon: Type,
          placeholder: 'optional default',
        },
      ],
    },
    {
      label: 'Flags',
      fields: [
        {
          kind: 'toggle',
          key: 'required',
          label: 'Required',
          icon: Asterisk,
        },
        {
          kind: 'toggle',
          key: 'deprecated',
          label: 'Deprecated',
          icon: ShieldAlert,
        },
      ],
    },
  ],
};
