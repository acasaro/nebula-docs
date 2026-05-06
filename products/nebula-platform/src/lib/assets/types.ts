import type { Timestamp } from 'firebase/firestore';

export type AssetCategory = 'image' | 'video' | 'file';

export type AssetEnv = 'dev' | 'prod';

export interface Asset {
  id: string;
  env: AssetEnv;
  tenantId: string;
  category: AssetCategory;
  storagePath: string;
  downloadUrl: string;
  filename: string;
  displayName: string;
  alt: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  contentHash: string;
  uploadedBy: string;
  uploadedByName: string | null;
  uploadedAt: Timestamp;
}

export type UploadStatus =
  | { kind: 'queued' }
  | { kind: 'uploading'; progress: number }
  | { kind: 'success'; asset: Asset }
  | { kind: 'error'; message: string }
  | { kind: 'canceled' };

export interface UploadHandle {
  id: string;
  file: File;
  status: UploadStatus;
  cancel: () => void;
}

const IMAGE_MIME_PREFIX = 'image/';
const VIDEO_MIME_PREFIX = 'video/';

export function categoryFromMime(mime: string): AssetCategory {
  if (mime.startsWith(IMAGE_MIME_PREFIX)) return 'image';
  if (mime.startsWith(VIDEO_MIME_PREFIX)) return 'video';
  return 'file';
}

export function categoryToFolder(c: AssetCategory): 'images' | 'videos' | 'files' {
  if (c === 'image') return 'images';
  if (c === 'video') return 'videos';
  return 'files';
}

export function folderToCategory(
  folder: string,
): AssetCategory | null {
  if (folder === 'images') return 'image';
  if (folder === 'videos') return 'video';
  if (folder === 'files') return 'file';
  return null;
}
