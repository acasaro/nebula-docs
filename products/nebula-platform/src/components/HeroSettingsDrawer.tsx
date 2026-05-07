import {
  ArrowLeftRight,
  Image as ImageIcon,
  Layers,
  Link2,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type {
  HeroAction,
  HeroSlide,
  HeroVariant,
} from '@nebula-docs/components';
import { MediaPickerDialog, type PickedMedia } from '@/components/assets';
import { NumberField, SelectField, TextField } from '@/components/fields';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const VARIANT_OPTIONS = [
  { value: 'banner', label: 'Banner — full hero with CTAs' },
  { value: 'compact', label: 'Compact — slim title + subtitle' },
  { value: 'split', label: 'Split — two stacked tiers' },
] as const;

const ACTION_STYLE_OPTIONS = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
] as const;

interface HeroAttrsLike {
  variant: HeroVariant | null;
  interval: number | null;
  padded: boolean | null;
  slides: HeroSlide[];
}

interface HeroSettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attrs: HeroAttrsLike;
  onChange: (patch: Partial<HeroAttrsLike>) => void;
  onDelete?: () => void;
}

/**
 * Sheet-anchored editor for `<Hero>`. Three concerns, top to bottom:
 *   1. Layout (variant + auto-advance interval) — global to the hero
 *   2. Slide list — tab strip with add/remove
 *   3. Active slide form — fields filtered by the current variant
 *
 * The slide form delegates media-pick flows to a single `MediaPickerDialog`
 * instance owned by this drawer. `pickerKey` tracks which slide field
 * triggered the picker so the result lands in the right place.
 */
export function HeroSettingsDrawer({
  open,
  onOpenChange,
  attrs,
  onChange,
  onDelete,
}: HeroSettingsDrawerProps) {
  // Reset to slide 0 every time the drawer opens. Stable across attr
  // changes within a session — we don't want the user's pointer to jump
  // mid-edit if attrs flow in.
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    if (open) setActiveIndex(0);
  }, [open]);

  const slides = attrs.slides.length > 0 ? attrs.slides : [{}];
  const variant: HeroVariant = attrs.variant ?? 'banner';
  const safeIndex = Math.min(activeIndex, slides.length - 1);
  const slide = slides[safeIndex] ?? {};

  const writeSlide = (patch: Partial<HeroSlide>) => {
    const next = slides.map((s, i) => (i === safeIndex ? { ...s, ...patch } : s));
    onChange({ slides: next });
  };

  const addSlide = () => {
    const next = [...slides, { title: 'New slide' }];
    onChange({ slides: next });
    setActiveIndex(next.length - 1);
  };

  const removeSlide = (i: number) => {
    if (slides.length <= 1) return;
    const next = slides.filter((_, idx) => idx !== i);
    onChange({ slides: next });
    setActiveIndex(Math.max(0, Math.min(safeIndex, next.length - 1)));
  };

  const moveSlide = (from: number, dir: -1 | 1) => {
    const to = from + dir;
    if (to < 0 || to >= slides.length) return;
    const next = slides.slice();
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    onChange({ slides: next });
    setActiveIndex(to);
  };

  // Media-picker plumbing. `picker` captures both which slide field is
  // requesting an asset and the asset category to surface.
  const [picker, setPicker] = useState<
    | { key: 'background' | 'sideImage'; category: 'image' | 'video' }
    | null
  >(null);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side='right' className='gap-0'>
          <SheetHeader>
            <SheetTitle className='flex items-center gap-2'>
              <Layers className='size-4' />
              Hero options
            </SheetTitle>
          </SheetHeader>

          <div className='flex-1 overflow-y-auto px-6 py-5'>
            {/* Layout — global */}
            <Section title='Layout'>
              <SelectField
                label='Variant'
                options={VARIANT_OPTIONS}
                value={attrs.variant ?? null}
                placeholder='Banner'
                onChange={(next) =>
                  onChange({ variant: next as HeroVariant | null })
                }
              />
              <NumberField
                label='Auto-advance (ms)'
                placeholder='Manual only'
                min={1000}
                step={500}
                value={attrs.interval}
                onChange={(next) => onChange({ interval: next })}
              />
            </Section>

            {/* Slide tabs */}
            <Section title='Slides' className='mt-6'>
              <div className='flex flex-wrap items-center gap-1.5'>
                {slides.map((s, i) => (
                  <button
                    key={i}
                    type='button'
                    onClick={() => setActiveIndex(i)}
                    className={cn(
                      'group/tab inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                      i === safeIndex
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background text-foreground hover:bg-accent/50',
                    )}
                  >
                    <span>
                      Slide {i + 1}
                      {s.title ? <span className='ml-1 opacity-70'>· {truncate(s.title, 20)}</span> : null}
                    </span>
                    {slides.length > 1 ? (
                      <span
                        role='button'
                        tabIndex={0}
                        aria-label={`Remove slide ${i + 1}`}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSlide(i);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            removeSlide(i);
                          }
                        }}
                        className={cn(
                          'flex size-4 items-center justify-center rounded-full opacity-0 transition-opacity',
                          'group-hover/tab:opacity-100 focus:opacity-100 focus:outline-none',
                          i === safeIndex ? 'bg-white/20 hover:bg-white/30' : 'hover:bg-muted',
                        )}
                      >
                        <X className='size-3' />
                      </span>
                    ) : null}
                  </button>
                ))}
                <button
                  type='button'
                  onClick={addSlide}
                  className='inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary'
                >
                  <Plus className='size-3' />
                  Add slide
                </button>
              </div>

              {slides.length > 1 ? (
                <div className='mt-2 flex items-center gap-1 text-[11px] text-muted-foreground'>
                  <span>Reorder:</span>
                  <button
                    type='button'
                    onClick={() => moveSlide(safeIndex, -1)}
                    disabled={safeIndex === 0}
                    className='inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent'
                  >
                    <ArrowLeftRight className='size-3 -scale-x-100' /> Move left
                  </button>
                  <button
                    type='button'
                    onClick={() => moveSlide(safeIndex, 1)}
                    disabled={safeIndex === slides.length - 1}
                    className='inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 hover:bg-accent disabled:opacity-30 disabled:hover:bg-transparent'
                  >
                    <ArrowLeftRight className='size-3' /> Move right
                  </button>
                </div>
              ) : null}
            </Section>

            {/* Active slide form */}
            <Section title={`Slide ${safeIndex + 1}`} className='mt-6'>
              <SlideFormFields
                variant={variant}
                slide={slide}
                onChange={writeSlide}
                onRequestMedia={(key, category) => setPicker({ key, category })}
              />
            </Section>
          </div>

          <SheetFooter>
            {onDelete ? (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  onDelete();
                  onOpenChange(false);
                }}
                className='mr-auto text-destructive hover:bg-destructive/10 hover:text-destructive'
              >
                <Trash2 className='size-4' />
                Delete hero
              </Button>
            ) : null}
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <MediaPickerDialog
        open={picker !== null}
        category={picker?.category ?? 'image'}
        onOpenChange={(o) => {
          if (!o) setPicker(null);
        }}
        onPick={(picked: PickedMedia) => {
          if (picker) {
            // The `background` slot is a CSS shorthand value, so a bare
            // URL renders as nothing — wrap it in `url("…") center / cover`
            // so the picked asset actually paints. `sideImage` flows into
            // an `<img src>` and stays a plain URL.
            const value =
              picker.key === 'background'
                ? `url("${picked.src}") center / cover no-repeat`
                : picked.src;
            writeSlide({ [picker.key]: value });
          }
          setPicker(null);
        }}
      />
    </>
  );
}

interface SlideFormFieldsProps {
  variant: HeroVariant;
  slide: HeroSlide;
  onChange: (patch: Partial<HeroSlide>) => void;
  onRequestMedia: (
    key: 'background' | 'sideImage',
    category: 'image' | 'video',
  ) => void;
}

function SlideFormFields({
  variant,
  slide,
  onChange,
  onRequestMedia,
}: SlideFormFieldsProps) {
  const showEyebrow = variant === 'banner' || variant === 'split';
  const showAccent = variant === 'banner' || variant === 'split';
  const showActions = variant === 'banner';
  const showSplitFields = variant === 'split';

  return (
    <div className='flex flex-col gap-3'>
      {showEyebrow ? (
        <TextField
          label='Eyebrow'
          icon={Sparkles}
          placeholder='Small uppercase line above the title'
          value={slide.eyebrow ?? ''}
          onChange={(next) => onChange({ eyebrow: next || undefined })}
        />
      ) : null}
      <TextField
        label='Title'
        icon={Type}
        placeholder='Main heading'
        value={slide.title ?? ''}
        onChange={(next) => onChange({ title: next || undefined })}
      />
      {showAccent ? (
        <TextField
          label='Accent (highlighted fragment)'
          icon={Sparkles}
          placeholder='Optional — appended to the title in accent color'
          value={slide.accent ?? ''}
          onChange={(next) => onChange({ accent: next || undefined })}
        />
      ) : null}
      <TextField
        label='Description'
        icon={Type}
        placeholder='Supporting copy beneath the title'
        value={slide.description ?? ''}
        onChange={(next) => onChange({ description: next || undefined })}
      />

      <Subgroup title='Background'>
        <TextField
          label='Background'
          icon={ImageIcon}
          placeholder='CSS color, gradient, or url(…)'
          value={slide.background ?? ''}
          onChange={(next) => onChange({ background: next || undefined })}
          trailing={
            <UploadInline
              onClick={() => onRequestMedia('background', 'image')}
            />
          }
        />
        <TextField
          label='Title color'
          icon={Palette}
          placeholder='CSS color — also tints the eyebrow chip'
          value={slide.titleColor ?? ''}
          onChange={(next) => onChange({ titleColor: next || undefined })}
        />
        <TextField
          label='Body text color'
          icon={Palette}
          placeholder='CSS color (e.g. #002677)'
          value={slide.textColor ?? ''}
          onChange={(next) => onChange({ textColor: next || undefined })}
        />
        {showAccent ? (
          <TextField
            label='Accent color'
            icon={Palette}
            placeholder='CSS color for the accent fragment'
            value={slide.accentColor ?? ''}
            onChange={(next) => onChange({ accentColor: next || undefined })}
          />
        ) : null}
      </Subgroup>

      {showActions ? (
        <Subgroup title='Actions'>
          <ActionsEditor
            actions={slide.actions ?? []}
            onChange={(actions) =>
              onChange({ actions: actions.length ? actions : undefined })
            }
          />
        </Subgroup>
      ) : null}

      {showSplitFields ? (
        <Subgroup title='Split — second tier'>
          <TextField
            label='Secondary title'
            icon={Type}
            placeholder='Bottom-tier heading'
            value={slide.secondaryTitle ?? ''}
            onChange={(next) =>
              onChange({ secondaryTitle: next || undefined })
            }
          />
          <TextField
            label='Secondary description'
            icon={Type}
            placeholder='Bottom-tier description'
            value={slide.secondaryDescription ?? ''}
            onChange={(next) =>
              onChange({ secondaryDescription: next || undefined })
            }
          />
          <TextField
            label='Side image URL'
            icon={ImageIcon}
            type='url'
            placeholder='https://… or /assets/…'
            value={slide.sideImage ?? ''}
            onChange={(next) => onChange({ sideImage: next || undefined })}
            trailing={
              <UploadInline
                onClick={() => onRequestMedia('sideImage', 'image')}
              />
            }
          />
          <TextField
            label='Side image alt text'
            icon={Type}
            placeholder='Describe the side illustration'
            value={slide.sideImageAlt ?? ''}
            onChange={(next) =>
              onChange({ sideImageAlt: next || undefined })
            }
          />
        </Subgroup>
      ) : null}
    </div>
  );
}

interface ActionsEditorProps {
  actions: HeroAction[];
  onChange: (next: HeroAction[]) => void;
}

function ActionsEditor({ actions, onChange }: ActionsEditorProps) {
  const update = (i: number, patch: Partial<HeroAction>) => {
    onChange(actions.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  };
  const remove = (i: number) => onChange(actions.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([
      ...actions,
      { label: '', href: '', style: actions.length === 0 ? 'primary' : 'secondary' },
    ]);

  if (actions.length === 0) {
    return (
      <button
        type='button'
        onClick={add}
        className='inline-flex items-center gap-1 self-start rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary'
      >
        <Plus className='size-3' />
        Add CTA button
      </button>
    );
  }

  return (
    <div className='flex flex-col gap-3'>
      {actions.map((a, i) => (
        <div
          key={i}
          className='flex flex-col gap-2 rounded-md border border-border/60 bg-muted/20 p-3'
        >
          <div className='flex items-center justify-between text-xs font-semibold text-muted-foreground'>
            <span>Action {i + 1}</span>
            <button
              type='button'
              aria-label={`Remove action ${i + 1}`}
              onClick={() => remove(i)}
              className='text-muted-foreground transition-colors hover:text-destructive'
            >
              <X className='size-3.5' />
            </button>
          </div>
          <TextField
            label='Label'
            icon={Type}
            placeholder='Get started'
            value={a.label ?? ''}
            onChange={(next) => update(i, { label: next })}
          />
          <TextField
            label='Link URL'
            icon={Link2}
            type='url'
            placeholder='/getting-started'
            value={a.href ?? ''}
            onChange={(next) => update(i, { href: next })}
          />
          <SelectField
            label='Style'
            options={ACTION_STYLE_OPTIONS}
            value={a.style ?? null}
            placeholder='Primary'
            onChange={(next) =>
              update(i, { style: (next as 'primary' | 'secondary' | null) ?? undefined })
            }
          />
        </div>
      ))}
      <button
        type='button'
        onClick={add}
        className='inline-flex items-center gap-1 self-start rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary'
      >
        <Plus className='size-3' />
        Add CTA button
      </button>
    </div>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <h4 className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
        {title}
      </h4>
      {children}
    </section>
  );
}

function Subgroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-2.5 rounded-md border border-border/60 p-3'>
      <span className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>
        {title}
      </span>
      {children}
    </div>
  );
}

function UploadInline({ onClick }: { onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
    >
      <ImageIcon className='size-3.5' />
      Upload
    </button>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
