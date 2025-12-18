/**
 * MediaPicker Component
 * Allows picking and uploading multiple images/videos for chat
 * With thumbnails and progress indicators
 */

import { useRef } from 'react';
import { useMultiUpload } from '@/hooks/useUpload';
import type { UploadResult } from '@/services/api/uploadService';

interface MediaPickerProps {
  allowVideo?: boolean;
  maxFiles?: number;
  onUploadComplete: (results: UploadResult[]) => void;
  className?: string;
}

export function MediaPicker({
  allowVideo = true,
  maxFiles = 10,
  onUploadComplete,
  className = '',
}: MediaPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    items,
    uploadFiles,
    removeItem,
    reset,
    isUploading,
    completedCount,
    totalCount,
  } = useMultiUpload({
    uploadType: 'chat_image',
    serviceUrl: '/api/chat',
    onComplete: (results) => {
      onUploadComplete(results);
      reset();
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadFiles(files.slice(0, maxFiles));
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const accept = allowVideo
    ? 'image/jpeg,image/jpg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm'
    : 'image/jpeg,image/jpg,image/png,image/gif,image/webp';

  return (
    <div className={`media-picker ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Button */}
      {items.length === 0 && (
        <button
          onClick={handleClick}
          className="
            flex items-center gap-2 px-4 py-2
            bg-blue-500 text-white rounded-lg
            hover:bg-blue-600 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          disabled={isUploading}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span>Pick Media</span>
        </button>
      )}

      {/* Preview Grid */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="relative group">
                {/* Preview */}
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={item.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />

                  {/* Progress Overlay */}
                  {item.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                        <p className="text-xs">{item.progress}%</p>
                      </div>
                    </div>
                  )}

                  {/* Success Indicator */}
                  {item.status === 'completed' && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Error Indicator */}
                  {item.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                {!isUploading && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="
                      absolute -top-2 -right-2 w-6 h-6
                      bg-red-500 rounded-full
                      flex items-center justify-center
                      opacity-0 group-hover:opacity-100
                      transition-opacity
                    "
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            {/* Add More Button */}
            {items.length < maxFiles && !isUploading && (
              <button
                onClick={handleClick}
                className="
                  aspect-square rounded-lg border-2 border-dashed
                  border-gray-300 hover:border-gray-400
                  flex items-center justify-center
                  transition-colors
                "
              >
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Progress Summary */}
          {isUploading && (
            <div className="text-sm text-gray-600 text-center">
              Uploading {completedCount} of {totalCount}...
            </div>
          )}

          {/* Action Buttons */}
          {!isUploading && items.some((i) => i.status === 'completed') && (
            <div className="flex gap-2 justify-end">
              <button
                onClick={reset}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
