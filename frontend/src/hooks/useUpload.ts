/**
 * useUpload Hook
 * Custom hook for handling file uploads with progress tracking
 * 
 * Features:
 * - Progress tracking
 * - Error handling
 * - Preview generation
 * - Upload cancellation (future enhancement)
 */

import { useState, useCallback } from 'react';
import { uploadService, type UploadResult, type UploadProgress } from '@/services/api/uploadService';

interface UseUploadOptions {
  uploadType: 'avatar' | 'chat_image' | 'chat_video';
  serviceUrl?: string;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

interface UseUploadReturn {
  upload: (file: File) => Promise<UploadResult | null>;
  isUploading: boolean;
  progress: number;
  error: string | null;
  preview: string | null;
  reset: () => void;
}

/**
 * Custom hook for file uploads
 * 
 * @example
 * ```tsx
 * const { upload, isUploading, progress, preview } = useUpload({
 *   uploadType: 'avatar',
 *   onSuccess: (result) => {
 *     console.log('Upload success:', result);
 *   },
 * });
 * 
 * const handleFileSelect = async (file: File) => {
 *   await upload(file);
 * };
 * ```
 */
export function useUpload({
  uploadType,
  serviceUrl = '/api/users',
  onSuccess,
  onError,
}: UseUploadOptions): UseUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  /**
   * Generate preview URL for the file
   */
  const generatePreview = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  /**
   * Upload file
   */
  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      // Generate preview
      const previewUrl = generatePreview(file);
      setPreview(previewUrl);

      try {
        // Upload to Cloudinary
        const result = await uploadService.upload(
          file,
          uploadType,
          serviceUrl,
          (progressData: UploadProgress) => {
            setProgress(progressData.percentage);
          },
        );

        // Success
        setIsUploading(false);
        setProgress(100);
        onSuccess?.(result);

        return result;
      } catch (err) {
        // Error
        const error = err as Error;
        setError(error.message);
        setIsUploading(false);
        setProgress(0);
        onError?.(error);

        // Clean up preview
        URL.revokeObjectURL(previewUrl);
        setPreview(null);

        return null;
      }
    },
    [uploadType, serviceUrl, generatePreview, onSuccess, onError],
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [preview]);

  return {
    upload,
    isUploading,
    progress,
    error,
    preview,
    reset,
  };
}

/**
 * useMultiUpload Hook
 * For uploading multiple files simultaneously
 */
interface UseMultiUploadOptions {
  uploadType: 'chat_image' | 'chat_video';
  serviceUrl?: string;
  onComplete?: (results: UploadResult[]) => void;
  onError?: (error: Error) => void;
}

interface UploadItem {
  id: string;
  file: File;
  preview: string;
  progress: number;
  error: string | null;
  result: UploadResult | null;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

interface UseMultiUploadReturn {
  items: UploadItem[];
  uploadFiles: (files: File[]) => Promise<void>;
  removeItem: (id: string) => void;
  reset: () => void;
  isUploading: boolean;
  completedCount: number;
  totalCount: number;
}

export function useMultiUpload({
  uploadType,
  serviceUrl = '/api/chat',
  onComplete,
  onError,
}: UseMultiUploadOptions): UseMultiUploadReturn {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Upload multiple files
   */
  const uploadFiles = useCallback(
    async (files: File[]) => {
      setIsUploading(true);

      // Create upload items
      const newItems: UploadItem[] = files.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        error: null,
        result: null,
        status: 'pending' as const,
      }));

      setItems(newItems);

      // Upload all files in parallel
      const results = await Promise.allSettled(
        newItems.map(async (item) => {
          // Update status to uploading
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: 'uploading' as const } : i,
            ),
          );

          try {
            const result = await uploadService.upload(
              item.file,
              uploadType,
              serviceUrl,
              (progressData) => {
                setItems((prev) =>
                  prev.map((i) =>
                    i.id === item.id ? { ...i, progress: progressData.percentage } : i,
                  ),
                );
              },
            );

            // Update status to completed
            setItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? { ...i, status: 'completed' as const, result, progress: 100 }
                  : i,
              ),
            );

            return result;
          } catch (error) {
            // Update status to error
            setItems((prev) =>
              prev.map((i) =>
                i.id === item.id
                  ? {
                      ...i,
                      status: 'error' as const,
                      error: (error as Error).message,
                    }
                  : i,
              ),
            );
            throw error;
          }
        }),
      );

      // Get successful results
      const successfulResults = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<UploadResult>).value);

      setIsUploading(false);

      if (successfulResults.length > 0) {
        onComplete?.(successfulResults);
      }

      // Handle errors
      const errors = results.filter((r) => r.status === 'rejected');
      if (errors.length > 0 && onError) {
        onError(new Error(`${errors.length} upload(s) failed`));
      }
    },
    [uploadType, serviceUrl, onComplete, onError],
  );

  /**
   * Remove item
   */
  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  /**
   * Reset all
   */
  const reset = useCallback(() => {
    items.forEach((item) => {
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
    });
    setItems([]);
    setIsUploading(false);
  }, [items]);

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const totalCount = items.length;

  return {
    items,
    uploadFiles,
    removeItem,
    reset,
    isUploading,
    completedCount,
    totalCount,
  };
}
