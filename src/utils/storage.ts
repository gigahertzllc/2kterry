// Storage utilities for R2 and Supabase uploads
import { publicAnonKey, projectId } from './supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-832015f7`;

export interface UploadProgressCallback {
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

/**
 * Upload a file to storage with progress tracking using XMLHttpRequest
 * Currently uses Supabase as backend, but has R2 integration point for future use
 */
export async function uploadFileWithProgress(
  file: File,
  endpoint: 'upload-file' | 'upload-image',
  callbacks?: UploadProgressCallback
): Promise<{ path: string; url?: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        callbacks?.onProgress?.(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          callbacks?.onComplete?.();
          resolve({
            path: response.path,
            url: response.url
          });
        } catch (error) {
          callbacks?.onError?.(new Error('Failed to parse upload response'));
          reject(new Error('Failed to parse upload response'));
        }
      } else {
        const error = new Error(`Upload failed with status ${xhr.status}`);
        callbacks?.onError?.(error);
        reject(error);
      }
    });

    xhr.addEventListener('error', () => {
      const error = new Error('Network error during upload');
      callbacks?.onError?.(error);
      reject(error);
    });

    xhr.addEventListener('abort', () => {
      const error = new Error('Upload cancelled');
      callbacks?.onError?.(error);
      reject(error);
    });

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);

    // Send request
    xhr.open('POST', `${API_URL}/${endpoint}`);
    xhr.setRequestHeader('Authorization', `Bearer ${publicAnonKey}`);
    xhr.send(formData);
  });
}

/**
 * Cancel upload (note: XMLHttpRequest doesn't support true cancellation,
 * but this can be extended with AbortController in the future)
 */
export function createUploadAbortController() {
  return new AbortController();
}

/**
 * Get R2 configuration (for future use when R2 is configured)
 * Users will need to provide their R2 credentials
 */
export const R2_CONFIG = {
  accountId: import.meta.env.VITE_R2_ACCOUNT_ID || '',
  accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || '',
  secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || '',
  bucketName: import.meta.env.VITE_R2_BUCKET_NAME || '',

  isConfigured: function() {
    return !!(
      this.accountId &&
      this.accessKeyId &&
      this.secretAccessKey &&
      this.bucketName
    );
  },

  // Future: Implement R2 presigned URL generation
  async getPresignedUploadUrl(filename: string) {
    if (!this.isConfigured()) {
      throw new Error('R2 not configured. Please set R2 credentials in environment variables.');
    }
    // This would call a backend endpoint to generate a presigned URL
    // The endpoint would use AWS SDK to generate the URL
    throw new Error('R2 upload not yet implemented. Use Supabase storage for now.');
  }
};

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options: {
    maxSizeBytes?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const maxSize = options.maxSizeBytes || 50 * 1024 * 1024; // 50MB default
  const allowedTypes = options.allowedTypes || ['application/zip'];

  if (file.size > maxSize) {
    const maxMB = Math.floor(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds ${maxMB}MB limit. Consider using R2 for large files.`
    };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Calculate upload speed
 */
export function calculateUploadSpeed(bytesTransferred: number, elapsedSeconds: number): string {
  if (elapsedSeconds === 0) return '0 B/s';
  const bytesPerSecond = bytesTransferred / elapsedSeconds;
  return formatFileSize(bytesPerSecond) + '/s';
}
