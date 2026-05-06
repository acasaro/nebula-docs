import { getStorageInstance } from '@nebula-docs/firebase';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type UploadTask,
} from 'firebase/storage';

export interface UploadOptions {
  storagePath: string;
  file: File;
  contentType?: string;
  metadata?: Record<string, string>;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  storagePath: string;
  downloadUrl: string;
}

export interface UploadController {
  promise: Promise<UploadResult>;
  cancel: () => void;
}

/**
 * Resumable upload to Firebase Storage. Returns a promise + cancel handle so
 * the UI can both await completion and abort mid-flight.
 */
export function uploadAsset(opts: UploadOptions): UploadController {
  const storage = getStorageInstance();
  const target = ref(storage, opts.storagePath);
  const task: UploadTask = uploadBytesResumable(target, opts.file, {
    contentType: opts.contentType ?? opts.file.type,
    customMetadata: opts.metadata,
  });

  const promise = new Promise<UploadResult>((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => {
        if (snap.totalBytes > 0) {
          const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
          opts.onProgress?.(pct);
        }
      },
      (err) => reject(err),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve({ storagePath: opts.storagePath, downloadUrl: url });
        } catch (err) {
          reject(err);
        }
      },
    );
  });

  return {
    promise,
    cancel: () => {
      try {
        task.cancel();
      } catch {
        // already done; ignore
      }
    },
  };
}

export async function deleteStorageObject(storagePath: string): Promise<void> {
  const storage = getStorageInstance();
  await deleteObject(ref(storage, storagePath));
}

export async function getStorageDownloadUrl(storagePath: string): Promise<string> {
  const storage = getStorageInstance();
  return getDownloadURL(ref(storage, storagePath));
}

/** Storage object existence check via getDownloadURL — throws on 404. */
export async function storageObjectExists(storagePath: string): Promise<boolean> {
  try {
    await getStorageDownloadUrl(storagePath);
    return true;
  } catch {
    return false;
  }
}
