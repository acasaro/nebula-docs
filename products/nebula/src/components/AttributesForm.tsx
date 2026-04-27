import type { IconLibrary, IconType } from '@nebula/components';
import { IconField, type IconValue } from '@/components/IconField';
import { SelectField, TextField, ToggleField } from '@/components/fields';
import type { AttrField, BlockAttrs, BlockAttrSchema } from '@/lib/blockSchemas';

interface AttributesFormProps {
  schema: BlockAttrSchema;
  values: BlockAttrs;
  onChange: (patch: BlockAttrs) => void;
}

export function AttributesForm({ schema, values, onChange }: AttributesFormProps) {
  return (
    <>
      {schema.sections.map((section) => (
        <section key={section.label} className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-foreground">
            {section.label}
          </h4>
          {section.fields.map((field) => (
            <FieldRenderer
              key={field.key}
              field={field}
              values={values}
              onChange={onChange}
            />
          ))}
        </section>
      ))}
    </>
  );
}

function FieldRenderer({
  field,
  values,
  onChange,
}: {
  field: AttrField;
  values: BlockAttrs;
  onChange: (patch: BlockAttrs) => void;
}) {
  switch (field.kind) {
    case 'text':
      return (
        <TextField
          label={field.label}
          icon={field.icon}
          placeholder={field.placeholder}
          type={field.type}
          value={typeof values[field.key] === 'string' ? (values[field.key] as string) : ''}
          onChange={(next) => onChange({ [field.key]: next || null })}
        />
      );
    case 'toggle':
      return (
        <ToggleField
          label={field.label}
          icon={field.icon}
          description={field.description}
          checked={values[field.key] === true}
          onChange={(next) => onChange({ [field.key]: next })}
        />
      );
    case 'select':
      return (
        <SelectField
          label={field.label}
          icon={field.icon}
          placeholder={field.placeholder}
          value={typeof values[field.key] === 'string' ? (values[field.key] as string) : null}
          options={field.options}
          onChange={(next) => onChange({ [field.key]: next })}
        />
      );
    case 'icon': {
      const Icon = field.icon;
      const iconValue: IconValue = {
        icon: typeof values[field.key] === 'string' ? (values[field.key] as string) : undefined,
        iconLibrary:
          typeof values[field.libraryKey] === 'string'
            ? (values[field.libraryKey] as IconLibrary)
            : undefined,
        iconType:
          field.typeKey && typeof values[field.typeKey] === 'string'
            ? (values[field.typeKey] as IconType)
            : undefined,
      };
      return (
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {Icon ? <Icon className="size-3.5" /> : null}
            {field.label}
          </span>
          <IconField
            value={iconValue}
            onChange={(next) => {
              const patch: BlockAttrs = {
                [field.key]: next.icon ?? null,
                [field.libraryKey]: next.iconLibrary ?? null,
              };
              if (field.typeKey) {
                patch[field.typeKey] = next.iconType ?? null;
              }
              onChange(patch);
            }}
          />
        </div>
      );
    }
  }
}
