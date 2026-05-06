import { useCallback, useState } from 'react';
import { deleteAssetDoc } from './firestore';
import { deleteStorageObject } from './storage';
import type { Asset } from './types';

export function useAssetDelete() {
  const [pending, setPending] = useState<Set<string>>(new Set());

  const deleteAsset = useCallback(async (asset: Asset): Promise<void> => {
    setPending((prev) => new Set(prev).add(asset.id));
    try {
      try {
        await deleteStorageObject(asset.storagePath);
      } catch (err) {
        // 404 from storage is fine — orphaned doc cleanup. Anything else, rethrow.
        const code = (err as { code?: string }).code;
        if (code !== 'storage/object-not-found') throw err;
      }
      await deleteAssetDoc(asset.id);
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(asset.id);
        return next;
      });
    }
  }, []);

  return { deleteAsset, isPending: (id: string) => pending.has(id) } as const;
}
