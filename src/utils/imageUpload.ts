import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB input limit (will be compressed)

// Configure fast timeout on storage retries so failed/CORS buckets don't hang the UI for 2 minutes
try {
  storage.maxUploadRetryTime = 2500;
  storage.maxOperationRetryTime = 2500;
} catch {
  // Ignore if properties are read-only in some SDK environments
}

// Cache whether remote Firebase Storage bucket is functional to avoid repetitive CORS errors
let isStorageFunctional: boolean | null = null;

/**
 * Validates file type and file size.
 */
export const validateImageFile = (file: File): ImageValidationResult => {
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file type (${file.type || 'unknown'}). Only JPEG, PNG, and WebP images are supported.`
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the 10 MB limit. Please select a smaller photo.`
    };
  }

  return { valid: true };
};

/**
 * Resizes and compresses an image in-browser to ~30-60KB.
 * Ensures crisp display on all screens while staying well within Firestore document limits.
 */
export const compressImage = (file: File, maxWidth = 960, quality = 0.78): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read photo file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to process photo image.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not initialize image compression canvas.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image file.'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a Blob or File to a compact base64 data URL.
 */
export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to convert photo to data URL'));
    reader.readAsDataURL(blob);
  });
};

/**
 * Race a promise with a timeout.
 */
const timeoutPromise = <T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
  ]);
};

/**
 * Uploads a vehicle photo. Tries Firebase Storage first; falls back to compressed base64 if storage is unconfigured.
 */
export const uploadVehiclePhoto = async (
  file: File,
  userId: string,
  vehicleIdPrefix?: string
): Promise<string> => {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 1. Compress image to lightweight, high-quality JPEG (~35KB-55KB)
  const compressedBlob = await compressImage(file);

  // 2. If Firebase Storage was already identified as unconfigured/CORS-blocked, directly return compressed data URL
  if (isStorageFunctional === false) {
    return blobToDataUrl(compressedBlob);
  }

  // 3. Attempt Firebase Storage upload with a fast timeout
  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const folder = vehicleIdPrefix || `veh_${Date.now()}`;
    const storagePath = `users/${userId}/vehicles/${folder}/${Date.now()}_${cleanFileName}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytes(storageRef, compressedBlob, {
      contentType: 'image/jpeg'
    });

    // Timeout in 2.5 seconds if CORS or bucket initialization causes a hang
    await timeoutPromise(uploadTask, 2500, 'Storage upload timed out');

    const downloadUrl = await getDownloadURL(storageRef);
    isStorageFunctional = true;
    return downloadUrl;
  } catch (storageErr) {
    // If CORS or bucket not found, mark as unconfigured to avoid repetitive console errors
    isStorageFunctional = false;
    console.warn(
      'Firebase Storage bucket is uninitialized or blocked by CORS. Using optimized inline image format instead.',
      storageErr
    );
    const dataUrl = await blobToDataUrl(compressedBlob);
    return dataUrl;
  }
};
