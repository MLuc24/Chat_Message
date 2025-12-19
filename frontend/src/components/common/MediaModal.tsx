// MediaModal Component - Popup modal for viewing images and videos

import { useEffect, useCallback } from 'react';
import { 
  XMarkIcon, 
  ArrowDownTrayIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowsPointingOutIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import type { Message } from '@/types/chat.types';

interface MediaModalProps {
  media: Message;
  isOpen: boolean;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onJumpTo?: (index: number) => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  gallery?: Message[];
  currentIndex?: number;
}

export function MediaModal({
  media,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  onJumpTo,
  hasPrevious = false,
  hasNext = false,
  gallery = [],
  currentIndex = 0,
}: MediaModalProps) {
  // Close on ESC key
  const handleEscKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Navigate with arrow keys
  const handleArrowKeys = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
      }
    },
    [hasPrevious, hasNext, onPrevious, onNext]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.addEventListener('keydown', handleArrowKeys);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscKey);
        document.removeEventListener('keydown', handleArrowKeys);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, handleEscKey, handleArrowKeys]);

  // Download media
  const handleDownload = async () => {
    if (!media.mediaUrl) return;

    try {
      const response = await fetch(media.mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${media.type}_${media.id}.${media.type === 'image' ? 'jpg' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download media:', error);
    }
  };

  // Open in new tab
  const handleOpenInNewTab = () => {
    if (media.mediaUrl) {
      window.open(media.mediaUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            title="Download"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            title="Open in new tab"
          >
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
          title="Close (ESC)"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation buttons */}
      {hasPrevious && onPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-4 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white z-10"
          title="Previous (←)"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
      )}

      {hasNext && onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white z-10"
          title="Next (→)"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      )}

      {/* Media content */}
      <div
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {media.type === 'image' && media.mediaUrl && (
          <img
            src={media.mediaUrl}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onError={() => {
              console.error('Failed to load image:', media.mediaUrl);
            }}
          />
        )}

        {media.type === 'video' && media.mediaUrl && (
          <video
            src={media.mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
            poster={media.thumbnailUrl}
          />
        )}
      </div>

      {/* Media info and thumbnail carousel */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
        {/* Media info */}
        <div className="text-white text-center px-4 pt-4 pb-2">
          {media.text && <p className="text-sm mb-1">{media.text}</p>}
          <p className="text-xs text-gray-300">
            {new Date(media.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Thumbnail carousel - only show if there are multiple media items */}
        {gallery.length > 1 && onJumpTo && (
          <div className="px-4 pb-4 overflow-hidden">
            <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide py-2 max-w-full">
              {gallery.map((item, idx) => {
                const isActive = idx === currentIndex;
                
                return (
                  <button
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onJumpTo(idx);
                    }}
                    className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all ${
                      isActive 
                        ? 'ring-2 ring-white scale-110' 
                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    {item.type === 'image' && (
                      <img
                        src={item.thumbnailUrl || item.mediaUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {item.type === 'video' && (
                      <div className="relative w-full h-full">
                        <img
                          src={item.thumbnailUrl || item.mediaUrl}
                          alt={`Video thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <PlayIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
