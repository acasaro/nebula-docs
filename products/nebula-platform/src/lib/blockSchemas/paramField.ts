import { Asterisk, Code2, Hash, MapPin, ShieldAlert, Sliders, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

const LOCATION_OPTIONS = [
  { value: 'path', label: 'Path' },
  { value: 'query', label: 'Query' },
  { value: 'header', label: 'Header' },
  { value: 'body', label: 'Body' },
  { value: 'cookie', label: 'Cookie' },
] as const;

export const paramFieldSchema: BlockAttrSchema = {
  blockType: 'mdxParamField',
  title: 'Edit ParamField',
  headerIcon: Sliders,
  inlinePopover: true,
  sections: [
    {
      label: 'Identity',
      fields: [
        {
          kind: 'text',
          key: 'path',
          label: 'Name',
          icon: Hash,
          placeholder: 'parameter name',
        },
        {
          kind: 'text',
          key: 'type',
          label: 'Type',
          icon: Code2,
          placeholder: 'string, number, …',
        },
        {
          kind: 'select',
          key: 'location',
          label: 'Location',
          options: LOCATION_OPTIONS,
          placeholder: 'Body',
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
