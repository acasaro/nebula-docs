import { useEffect, useState } from 'react';
import type { IconLibrary } from '@nebula-docs/components';

const CDN_BASE = 'https://mcoe-icons.web.app';

export interface IconManifest {
  library: IconLibrary;
  variants: string[] | null;
  icons: string[];
}

const cache = new Map<IconLibrary, IconManifest>();
const inflight = new Map<IconLibrary, Promise<IconManifest>>();

export async function fetchIconManifest(library: IconLibrary): Promise<IconManifest> {
  const cached = cache.get(library);
  if (cached) return cached;
  let pending = inflight.get(library);
  if (pending) return pending;
  pending = (async () => {
    const res = await fetch(`${CDN_BASE}/manifest/${library}.json`);
    if (!res.ok) throw new Error(`Failed to fetch manifest for ${library}`);
    const manifest = (await res.json()) as IconManifest;
    cache.set(library, manifest);
    inflight.delete(library);
    return manifest;
  })();
  inflight.set(library, pending);
  return pending;
}

/** Subscribe a component to a manifest. Returns null while loading. */
export function useIconManifest(library: IconLibrary): IconManifest | null {
  const [manifest, setManifest] = useState<IconManifest | null>(
    () => cache.get(library) ?? null,
  );
  useEffect(() => {
    const cached = cache.get(library);
    if (cached) {
      setManifest(cached);
      return;
    }
    let cancelled = false;
    fetchIconManifest(library)
      .then((m) => {
        if (!cancelled) setManifest(m);
      })
      .catch(() => {
        if (!cancelled) setManifest({ library, variants: null, icons: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [library]);
  return manifest;
}
