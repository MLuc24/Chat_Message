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
 * For uploading multiple files simultaneously (images, videos, or mixed)
 */
interface UseMultiUploadOptions {
  uploadType?: 'chat_image' | 'chat_video' | 'auto'; // 'auto' will detect file type
  serviceUrl?: string;
  maxFiles?: number;
  maxTotalSizeMB?: number; // Max total size for all files
  onComplete?: (results: UploadResult[]) => void;
  onError?: (error: Error) => void;
  onProgress?: (completed: number, total: number) => void;
}

interface UploadItem {
  id: string;
  file: File;
  fileType: 'image' | 'video' | 'document'; // Determined from file MIME type
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
  uploadType = 'auto',
  serviceUrl = '/api/chat',
  maxFiles = 10,
  maxTotalSizeMB = 100,
  onComplete,
  onError,
  onProgress,
}: UseMultiUploadOptions): UseMultiUploadReturn {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Determine upload type from file MIME type
   */
  const getUploadTypeForFile = useCallback((file: File): 'chat_image' | 'chat_video' | 'chat_document' => {
    if (file.type.startsWith('image/')) return 'chat_image';
    if (file.type.startsWith('video/')) return 'chat_video';
    return 'chat_document';
  }, []);

  /**
   * Get file type category
   */
  const getFileTypeCategory = useCallback((file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  }, []);

  /**
   * Validate files before upload
   */
  const validateFiles = useCallback((files: File[]): string | null => {
    // Check max files
    if (files.length > maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }

    // Check total size
    const totalSizeMB = files.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
    if (totalSizeMB > maxTotalSizeMB) {
      return `Total file size (${totalSizeMB.toFixed(1)}MB) exceeds maximum (${maxTotalSizeMB}MB)`;
    }

    // Check individual file sizes
    for (const file of files) {
      const fileSizeMB = file.size / (1024 * 1024);
      if (file.type.startsWith('image/') && fileSizeMB > 10) {
        return `Image "${file.name}" exceeds 10MB limit`;
      }
      if (file.type.startsWith('video/') && fileSizeMB > 50) {
        return `Video "${file.name}" exceeds 50MB limit`;
      }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && fileSizeMB > 20) {
        return `File "${file.name}" exceeds 20MB limit`;
      }
    }

    return null;
  }, [maxFiles, maxTotalSizeMB]);

  /**
   * Upload multiple files
   */
  const uploadFiles = useCallback(
    async (files: File[]) => {
      // Validate files
      const validationError = validateFiles(files);
      if (validationError) {
        onError?.(new Error(validationError));
        return;
      }

      setIsUploading(true);

      // Create upload items with auto-detected file types
      const newItems: UploadItem[] = files.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        fileType: getFileTypeCategory(file),
        preview: file.type.startsWith('image/') || file.type.startsWith('video/') 
          ? URL.createObjectURL(file) 
          : '',
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
            // Determine upload type for this specific file
            const fileUploadType = uploadType === 'auto' 
              ? getUploadTypeForFile(item.file)
              : uploadType;

            const result = await uploadService.upload(
              item.file,
              fileUploadType,
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

            // Notify progress
            if (onProgress) {
              const completed = newItems.filter(i => 
                i.status === 'completed' || i.id === item.id
              ).length;
              onProgress(completed, newItems.length);
            }

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
    [uploadType, serviceUrl, maxFiles, maxTotalSizeMB, validateFiles, getFileTypeCategory, getUploadTypeForFile, onComplete, onError, onProgress],
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
