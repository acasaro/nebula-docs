import type { GitSettings } from '@/lib/gitSettings';
import type { AssetCategory, AssetEnv } from './types';
import { categoryToFolder } from './types';

/**
 * The tenantId scopes storage paths to a specific git repo connection. We use
 * the GitHub installationId because it's immutable, globally unique across
 * orgs, and already on the gitSettings doc — no slug-collision risk.
 */
export function tenantIdFromSettings(settings: GitSettings): string {
  return String(settings.installationId);
}

export function extOf(filename: string): string {
  const i = filename.lastIndexOf('.');
  if (i <= 0 || i === filename.length - 1) return '';
  return filename.slice(i + 1).toLowerCase();
}

export function buildStoragePath(opts: {
  env: AssetEnv;
  tenantId: string;
  category: AssetCategory;
  contentHash: string;
  ext: string;
}): string {
  const folder = categoryToFolder(opts.category);
  const tail = opts.ext ? `${opts.contentHash}.${opts.ext}` : opts.contentHash;
  return `${opts.env}/${opts.tenantId}/${folder}/${tail}`;
}

export async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Stable Firestore doc id derived from the storage path (1:1 with the file). */
export function assetIdFromStoragePath(storagePath: string): string {
  return storagePath.replace(/[^a-zA-Z0-9]+/g, '_');
}

export function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith('image/')) return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const result = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(result);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
