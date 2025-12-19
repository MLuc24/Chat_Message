import { useState, useRef, useCallback } from 'react';
import { 
  PhotoIcon, 
  TrashIcon, 
  ArrowUpTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useProfile } from '@/hooks/useProfile';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
}

export function AvatarUpload({ currentAvatarUrl }: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { isUploading, uploadAvatar, deleteAvatar } = useProfile();

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File | null) => {
      if (!file) return;

      setUploadError(null);

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError('Invalid file type. Only JPEG, PNG, and WebP are allowed');
        return;
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError('File size exceeds 5MB limit');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload file
      try {
        const success = await uploadAvatar(file);
        if (success) {
          setPreview(null); // Clear preview after successful upload
        }
      } catch (error: unknown) {
        setUploadError(error instanceof Error ? error.message : 'Upload failed');
      }
    },
    [uploadAvatar]
  );

  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0] || null;
      handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // Handle delete avatar
  const handleDelete = async () => {
    setUploadError(null);
    setPreview(null);
    await deleteAvatar();
  };

  // Clear preview
  const handleClearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayImage = preview || currentAvatarUrl;

  return (
    <div className="space-y-4">
      {/* Avatar Display */}
      <div className="flex items-center gap-6">
        {/* Avatar Preview */}
        <div className="relative">
          {displayImage ? (
            <img
              src={displayImage}
              alt="Profile avatar"
              className="h-24 w-24 rounded-full object-cover ring-4 ring-gray-200 dark:ring-gray-700"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-4 ring-gray-200 dark:ring-gray-700">
              <PhotoIcon className="h-10 w-10 text-white" />
            </div>
          )}

          {/* Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            Upload New
          </button>

          {currentAvatarUrl && !preview && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TrashIcon className="h-4 w-4" />
              Remove
            </button>
          )}

          {preview && (
            <button
              type="button"
              onClick={handleClearPreview}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />

        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Click to upload
          </button>
          {' '}or drag and drop
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          PNG, JPG, WEBP up to 5MB
        </p>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200">
          <XMarkIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{uploadError}</p>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Recommended: Square image, at least 400x400px for best quality
      </p>
    </div>
  );
}
