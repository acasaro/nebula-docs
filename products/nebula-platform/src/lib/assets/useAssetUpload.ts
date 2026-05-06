import { useCallback, useRef, useState } from 'react';
import { useCurrentUser } from '@nebula-docs/firebase';
import { env } from '@/lib/env';
import { useGitSettings } from '@/lib/gitSettings';
import { createAssetDoc } from './firestore';
import {
  assetIdFromStoragePath,
  buildStoragePath,
  extOf,
  readImageDimensions,
  sha256Hex,
  tenantIdFromSettings,
} from './paths';
import { getStorageDownloadUrl, storageObjectExists, uploadAsset } from './storage';
import { categoryFromMime, type Asset, type UploadHandle, type UploadStatus } from './types';

let uploadCounter = 0;

function makeId(): string {
  uploadCounter += 1;
  return `up-${Date.now()}-${uploadCounter}`;
}

export interface UploadResultSummary {
  asset: Asset | null;
  error?: string;
  canceled?: boolean;
}

export function useAssetUpload() {
  const settings = useGitSettings();
  const auth = useCurrentUser();
  const [handles, setHandles] = useState<UploadHandle[]>([]);
  const cancelRefs = useRef<Map<string, () => void>>(new Map());

  const updateHandle = useCallback(
    (id: string, patch: Partial<Pick<UploadHandle, 'status'>>) => {
      setHandles((prev) =>
        prev.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      );
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setHandles((prev) => prev.filter((h) => h.id !== id));
    cancelRefs.current.delete(id);
  }, []);

  const dismissCompleted = useCallback(() => {
    setHandles((prev) =>
      prev.filter(
        (h) =>
          h.status.kind !== 'success' &&
          h.status.kind !== 'canceled' &&
          h.status.kind !== 'error',
      ),
    );
  }, []);

  const upload = useCallback(
    async (file: File): Promise<UploadResultSummary> => {
      if (settings.status !== 'ready') {
        return { asset: null, error: 'No git repo connected' };
      }
      if (auth.status !== 'authenticated') {
        return { asset: null, error: 'Not signed in' };
      }
      const id = makeId();
      const cancelStatus: UploadStatus = { kind: 'canceled' };
      const queued: UploadHandle = {
        id,
        file,
        status: { kind: 'queued' },
        cancel: () => updateHandle(id, { status: cancelStatus }),
      };
      setHandles((prev) => [queued, ...prev]);

      try {
        const tenantId = tenantIdFromSettings(settings.settings);
        const category = categoryFromMime(file.type);
        const contentHash = (await sha256Hex(file)).slice(0, 16);
        const ext = extOf(file.name);
        const storagePath = buildStoragePath({
          env: env.mode,
          tenantId,
          category,
          contentHash,
          ext,
        });
        const docId = assetIdFromStoragePath(storagePath);

        // Dedup: if this hash exists, reuse the URL — skip the upload entirely.
        const exists = await storageObjectExists(storagePath);
        let downloadUrl: string;
        if (exists) {
          downloadUrl = await getStorageDownloadUrl(storagePath);
          updateHandle(id, { status: { kind: 'uploading', progress: 100 } });
        } else {
          updateHandle(id, { status: { kind: 'uploading', progress: 0 } });
          const controller = uploadAsset({
            storagePath,
            file,
            metadata: {
              uploadedBy: auth.user.uid,
              tenantId,
              env: env.mode,
              originalName: file.name,
            },
            onProgress: (progress) => {
              updateHandle(id, {
                status: { kind: 'uploading', progress },
              });
            },
          });
          cancelRefs.current.set(id, controller.cancel);
          const result = await controller.promise;
          downloadUrl = result.downloadUrl;
        }

        const dims = await readImageDimensions(file);

        await createAssetDoc({
          id: docId,
          env: env.mode,
          tenantId,
          category,
          storagePath,
          downloadUrl,
          filename: file.name,
          displayName: file.name,
          alt: '',
          mime: file.type || 'application/octet-stream',
          size: file.size,
          width: dims?.width ?? null,
          height: dims?.height ?? null,
          contentHash,
          uploadedBy: auth.user.uid,
          uploadedByName: auth.user.displayName ?? auth.user.email ?? null,
        });

        // Optimistic local Asset to return; Firestore subscriber will replace
        // with the canonical record (notably uploadedAt timestamp) shortly.
        const asset: Asset = {
          id: docId,
          env: env.mode,
          tenantId,
          category,
          storagePath,
          downloadUrl,
          filename: file.name,
          displayName: file.name,
          alt: '',
          mime: file.type || 'application/octet-stream',
          size: file.size,
          width: dims?.width ?? null,
          height: dims?.height ?? null,
          contentHash,
          uploadedBy: auth.user.uid,
          uploadedByName: auth.user.displayName ?? auth.user.email ?? null,
          // Best-effort; the subscriber will overwrite with serverTimestamp.
          uploadedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as Asset['uploadedAt'],
        };

        updateHandle(id, { status: { kind: 'success', asset } });
        return { asset };
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === 'storage/canceled') {
          updateHandle(id, { status: { kind: 'canceled' } });
          return { asset: null, canceled: true };
        }
        const message = err instanceof Error ? err.message : String(err);
        updateHandle(id, { status: { kind: 'error', message } });
        return { asset: null, error: message };
      }
    },
    [auth, settings, updateHandle],
  );

  const uploadFiles = useCallback(
    (files: File[]): Promise<UploadResultSummary[]> => {
      return Promise.all(files.map((f) => upload(f)));
    },
    [upload],
  );

  return { uploadFiles, upload, handles, dismiss, dismissCompleted } as const;
}
