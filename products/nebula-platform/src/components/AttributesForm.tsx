import { useState } from 'react';
import { Upload } from 'lucide-react';
import type { IconLibrary, IconType } from '@nebula-docs/components';
import { MediaPickerDialog } from '@/components/assets/MediaPickerDialog';
import type { AssetCategory } from '@/lib/assets';
import { IconField, type IconValue } from '@/components/IconField';
import { NumberField, SelectField, TextField, ToggleField } from '@/components/fields';
import type { AttrField, BlockAttrs, BlockAttrSchema } from '@/lib/blockSchemas';
import { cn } from '@/lib/utils';

interface AttributesFormProps {
  schema: BlockAttrSchema;
  values: BlockAttrs;
  onChange: (patch: BlockAttrs) => void;
}

export function AttributesForm({ schema, values, onChange }: AttributesFormProps) {
  // Single dialog instance shared across every upload-enabled field in the
  // form. The state captures both which field's Upload was clicked and the
  // category (image vs video) the picker should surface.
  const [upload, setUpload] = useState<
    | { key: string; category: AssetCategory }
    | null
  >(null);

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
              onRequestUpload={(key, category) => setUpload({ key, category })}
            />
          ))}
        </section>
      ))}
      <MediaPickerDialog
        open={upload !== null}
        category={upload?.category ?? 'image'}
        onOpenChange={(open) => {
          if (!open) setUpload(null);
        }}
        onPick={(picked) => {
          if (upload) onChange({ [upload.key]: picked.src });
          setUpload(null);
        }}
      />
    </>
  );
}

function FieldRenderer({
  field,
  values,
  onChange,
  onRequestUpload,
}: {
  field: AttrField;
  values: BlockAttrs;
  onChange: (patch: BlockAttrs) => void;
  onRequestUpload: (key: string, category: AssetCategory) => void;
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
          trailing={
            field.upload ? (
              <UploadButton
                onClick={() =>
                  onRequestUpload(field.key, field.uploadCategory ?? 'image')
                }
              />
            ) : undefined
          }
        />
      );
    case 'number': {
      const raw = values[field.key];
      const num = typeof raw === 'number' ? raw : null;
      return (
        <NumberField
          label={field.label}
          icon={field.icon}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          step={field.step}
          value={num}
          onChange={(next) => onChange({ [field.key]: next })}
        />
      );
    }
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
    case 'swatch': {
      const Icon = field.icon;
      const current =
        typeof values[field.key] === 'string'
          ? (values[field.key] as string)
          : null;
      return (
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {Icon ? <Icon className="size-3.5" /> : null}
            {field.label}
          </span>
          <div className="grid grid-cols-5 gap-2">
            {field.options.map((opt) => {
              const selected = current === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange({ [field.key]: opt.value })}
                  aria-label={opt.label ?? opt.value}
                  aria-pressed={selected}
                  title={opt.label ?? opt.value}
                  className={cn(
                    'aspect-square w-full rounded-md transition',
                    'ring-1 ring-inset ring-border',
                    'hover:ring-2 hover:ring-foreground/30',
                    selected &&
                      'ring-2 ring-offset-2 ring-offset-popover ring-foreground',
                  )}
                  style={{ backgroundColor: opt.color }}
                />
              );
            })}
          </div>
        </div>
      );
    }
    case 'icon': {
      void onRequestUpload;
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

function UploadButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground',
        'transition-colors hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <Upload className="size-3.5" />
      Upload
    </button>
  );
}
