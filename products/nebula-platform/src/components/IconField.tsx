import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineSpinner } from "@/components/ui/NebulaLoader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBytes, useAssets, useAssetUpload, type Asset } from "@/lib/assets";
import { useIconManifest } from "@/lib/iconManifest";
import { cn } from "@/lib/utils";
import { Icon, type IconLibrary, type IconType } from "@nebula-docs/components";
import * as Popover from "@radix-ui/react-popover";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Link2, Plus, Search, Trash2, Upload } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

export interface IconValue {
  icon?: string;
  iconLibrary?: IconLibrary;
  iconType?: IconType;
}

interface IconFieldProps {
  value: IconValue;
  onChange: (next: IconValue) => void;
  className?: string;
}

const TAB_KEYS = ["lucide", "material", "material-symbols", "custom"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  lucide: "Lucide",
  material: "Material",
  "material-symbols": "Symbols",
  custom: "Custom",
};

const DEFAULT_PREVIEW_TYPE: Record<IconLibrary, IconType | undefined> = {
  lucide: undefined,
  material: "outlined",
  "material-symbols": "outlined",
};

function isCustomUrl(s: string): boolean {
  return /^https?:\/\//i.test(s) || s.startsWith("/") || s.startsWith("data:");
}

export function IconField({ value, onChange, className }: IconFieldProps) {
  const [open, setOpen] = useState(false);
  const isSelected = !!value.icon;
  const isCustom = isSelected && isCustomUrl(value.icon!);
  const displayName = isSelected ? (isCustom ? "Custom URL" : value.icon) : null;

  return (
    <IconPickerPopover open={open} onOpenChange={setOpen} value={value} onChange={onChange}>
      <button
        type='button'
        className={cn(
          "flex w-full items-center gap-2 rounded-md border bg-input/40 px-3 py-2 text-sm transition-colors",
          "hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          className,
        )}>
        {isSelected ? (
          <>
            <Icon
              icon={value.icon}
              iconLibrary={value.iconLibrary}
              iconType={value.iconType}
              size={16}
            />
            <span className='flex-1 truncate text-left'>{displayName}</span>
            <span
              role='button'
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange({});
              }}
              className='rounded p-1 text-muted-foreground transition-colors hover:text-destructive'
              aria-label='Clear icon'>
              <Trash2 className='size-3.5' />
            </span>
          </>
        ) : (
          <>
            <Plus className='size-3.5 text-muted-foreground' />
            <span className='text-muted-foreground'>Select Icon</span>
          </>
        )}
      </button>
    </IconPickerPopover>
  );
}

interface IconPickerPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: IconValue;
  onChange: (next: IconValue) => void;
  children: React.ReactNode;
}

export function IconPickerPopover({
  open,
  onOpenChange,
  value,
  onChange,
  children,
}: IconPickerPopoverProps) {
  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="right"
          align='start'
          sideOffset={12}
          collisionPadding={12}
          sticky="always"
          className={cn(
            "z-50 w-96 rounded-md border bg-popover shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
          style={{
            height: "min(24rem, var(--radix-popover-content-available-height))",
          }}
          onCloseAutoFocus={(e) => e.preventDefault()}>
          <IconPicker
            value={value}
            onPick={(next) => {
              onChange(next);
              onOpenChange(false);
            }}
            onClear={() => {
              onChange({});
              onOpenChange(false);
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function IconPicker({
  value,
  onPick,
  onClear,
}: {
  value: IconValue;
  onPick: (next: IconValue) => void;
  onClear: () => void;
}) {
  const initialTab: TabKey =
    value.icon && isCustomUrl(value.icon) ? "custom" : ((value.iconLibrary ?? "lucide") as TabKey);
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [search, setSearch] = useState("");
  const [customUrl, setCustomUrl] = useState(
    value.icon && isCustomUrl(value.icon) ? value.icon : "",
  );

  return (
    <div className='flex h-full flex-col overflow-hidden'>
      <div className='flex items-center justify-between border-b px-3 py-2'>
        <h3 className='text-sm font-semibold'>Icons</h3>
        <button
          type='button'
          onClick={onClear}
          className='text-xs text-muted-foreground transition-colors hover:text-destructive'>
          Remove
        </button>
      </div>
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabKey)}
        className='flex flex-1 flex-col overflow-hidden'>
        <TabsList className='mx-3 mt-2 grid w-auto shrink-0 grid-cols-4'>
          {TAB_KEYS.map((k) => (
            <TabsTrigger key={k} value={k} className='text-xs'>
              {TAB_LABELS[k]}
            </TabsTrigger>
          ))}
        </TabsList>
        {(["lucide", "material", "material-symbols"] as IconLibrary[]).map((library) => (
          <TabsContent
            key={library}
            value={library}
            className='flex flex-1 flex-col gap-2 overflow-hidden p-3 pt-2'>
            <SearchBar value={search} onChange={setSearch} />
            <IconGrid
              library={library}
              search={search}
              onPick={(name) =>
                onPick({
                  icon: name,
                  iconLibrary: library,
                  iconType: DEFAULT_PREVIEW_TYPE[library],
                })
              }
            />
          </TabsContent>
        ))}
        <TabsContent value='custom' className='flex flex-1 flex-col overflow-hidden'>
          <CustomIconPanel
            url={customUrl}
            onUrlChange={setCustomUrl}
            onPick={onPick}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className='relative shrink-0'>
      <Search className='pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
      <Input
        type='search'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='Search icons…'
        className='h-8 pl-7'
      />
    </div>
  );
}

const COLS = 9;
const CELL = 32;

function IconGrid({
  library,
  search,
  onPick,
}: {
  library: IconLibrary;
  search: string;
  onPick: (name: string) => void;
}) {
  const manifest = useIconManifest(library);
  const filtered = useMemo(() => {
    if (!manifest) return [];
    const q = search.trim().toLowerCase();
    if (!q) return manifest.icons;
    return manifest.icons.filter((n) => n.includes(q));
  }, [manifest, search]);

  const previewType = DEFAULT_PREVIEW_TYPE[library];
  const rows = Math.ceil(filtered.length / COLS);
  const parentRef = useRef<HTMLDivElement | null>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CELL,
    overscan: 6,
  });

  if (!manifest) {
    return (
      <p className='flex items-center gap-2 p-2 text-xs text-muted-foreground'>
        <InlineSpinner size={12} />
        Loading icons…
      </p>
    );
  }
  if (filtered.length === 0) {
    return <p className='p-2 text-xs text-muted-foreground'>No icons match.</p>;
  }

  return (
    <div ref={parentRef} className='flex-1 overflow-y-auto'>
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          position: "relative",
        }}>
        {rowVirtualizer.getVirtualItems().map((row) => {
          const start = row.index * COLS;
          const end = Math.min(start + COLS, filtered.length);
          const items = filtered.slice(start, end);
          return (
            <div
              key={row.key}
              className='flex items-center gap-1'
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: CELL,
                transform: `translateY(${row.start}px)`,
              }}>
              {items.map((name) => (
                <button
                  key={name}
                  type='button'
                  onClick={() => onPick(name)}
                  title={name}
                  className='flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'>
                  <Icon icon={name} iconLibrary={library} iconType={previewType} size={20} />
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CustomIconPanel({
  url,
  onUrlChange,
  onPick,
}: {
  url: string;
  onUrlChange: (v: string) => void;
  onPick: (next: IconValue) => void;
}) {
  const assets = useAssets();
  const upload = useAssetUpload();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dropActive, setDropActive] = useState(false);

  const images = useMemo(() => {
    if (assets.status !== "ready") return [];
    return assets.assets.filter((a) => a.category === "image");
  }, [assets]);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) return;
      const results = await upload.uploadFiles(imageFiles);
      const first = results.find((r) => r.asset);
      if (first?.asset) onPick({ icon: first.asset.downloadUrl });
    },
    [upload, onPick],
  );

  const pickAsset = useCallback(
    (asset: Asset) => onPick({ icon: asset.downloadUrl }),
    [onPick],
  );

  const trimmedUrl = url.trim();
  const isUrlValid = !!trimmedUrl && isCustomUrl(trimmedUrl);

  if (showUrlInput) {
    return (
      <div className='flex flex-1 flex-col gap-3 p-3 pt-2'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <label className='text-xs text-muted-foreground'>Icon URL</label>
            <button
              type='button'
              onClick={() => setShowUrlInput(false)}
              className='text-[11px] text-muted-foreground transition-colors hover:text-foreground'>
              Back to library
            </button>
          </div>
          <Input
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder='https://example.com/icon.svg'
            autoFocus
          />
          <p className='text-[11px] leading-tight text-muted-foreground'>
            Absolute (https://) or path-rooted (/foo.svg) URLs render as-is and keep their original
            colors.
          </p>
        </div>
        {isUrlValid ? (
          <div className='flex items-center justify-center rounded-md border bg-muted/40 py-6'>
            <Icon icon={trimmedUrl} size={32} />
          </div>
        ) : null}
        <Button onClick={() => isUrlValid && onPick({ icon: trimmedUrl })} disabled={!isUrlValid}>
          Use this URL
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-1 flex-col overflow-hidden", dropActive && "ring-2 ring-inset ring-primary")}
      onDragEnter={(e) => { e.preventDefault(); setDropActive(true); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropActive(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setDropActive(false);
        const files = Array.from(e.dataTransfer.files ?? []);
        void handleFiles(files);
      }}>
      <div className='flex items-center gap-2 border-b px-3 py-2'>
        <input
          ref={inputRef}
          hidden
          type='file'
          multiple
          accept='image/*'
          onChange={(e) => {
            const files = Array.from(e.currentTarget.files ?? []);
            void handleFiles(files);
            e.currentTarget.value = "";
          }}
        />
        <Button
          size='sm'
          variant='outline'
          className='h-7 gap-1.5 text-xs'
          onClick={() => inputRef.current?.click()}>
          <Upload className='size-3' />
          Upload
        </Button>
        <Button
          size='sm'
          variant='ghost'
          className='h-7 gap-1.5 text-xs'
          onClick={() => setShowUrlInput(true)}>
          <Link2 className='size-3' />
          Paste URL
        </Button>
      </div>

      {upload.handles.length > 0 ? (
        <div className='border-b'>
          {upload.handles.map((h) => (
            <div
              key={h.id}
              className='flex items-center justify-between gap-2 px-3 py-1.5 text-[11px]'>
              <span className='truncate'>{h.file.name}</span>
              <span className='shrink-0 text-muted-foreground'>
                {h.status.kind === "uploading"
                  ? `${Math.round(h.status.progress)}%`
                  : h.status.kind === "success"
                    ? "Done"
                    : h.status.kind === "error"
                      ? "Failed"
                      : h.status.kind === "canceled"
                        ? "Canceled"
                        : "Queued"}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className='flex-1 overflow-y-auto p-2'>
        {assets.status !== "ready" ? (
          <p className='flex items-center gap-2 p-2 text-xs text-muted-foreground'>
            <InlineSpinner size={12} />
            Loading assets…
          </p>
        ) : images.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-6 text-center'>
            <div className={cn(
              "flex size-8 items-center justify-center rounded-full text-muted-foreground",
              dropActive ? "bg-primary/10 text-primary" : "bg-muted",
            )}>
              <Upload className='size-4' />
            </div>
            <p className='text-xs text-muted-foreground'>
              {dropActive ? "Drop to upload" : "No images yet. Upload or drop one here."}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-4 gap-1.5'>
            {images.map((asset) => (
              <AssetIconTile key={asset.id} asset={asset} onClick={() => pickAsset(asset)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AssetIconTile({ asset, onClick }: { asset: Asset; onClick: () => void }) {
  const [broken, setBroken] = useState(false);
  return (
    <button
      type='button'
      onClick={onClick}
      title={`${asset.displayName} (${formatBytes(asset.size)})`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-md border bg-card transition-all",
        "hover:border-primary hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      )}>
      <div className='flex aspect-square w-full items-center justify-center overflow-hidden bg-muted/40 p-1.5'>
        {broken ? (
          <span className='text-[10px] text-muted-foreground'>N/A</span>
        ) : (
          <img
            src={asset.downloadUrl}
            alt={asset.alt || asset.displayName}
            loading='lazy'
            className='size-full object-contain transition-transform group-hover:scale-105'
            onError={() => setBroken(true)}
          />
        )}
      </div>
      <div className='truncate px-1 py-0.5 text-[10px] text-muted-foreground'>
        {asset.displayName}
      </div>
    </button>
  );
}
