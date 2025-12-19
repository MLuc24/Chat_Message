// useMediaModal hook - Manages media modal state and gallery navigation

import { useState, useCallback, useMemo } from 'react';
import type { Message } from '@/types/chat.types';

export function useMediaModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<Message | null>(null);
  const [mediaGallery, setMediaGallery] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Open modal with a specific media
  const openModal = useCallback((media: Message, gallery?: Message[]) => {
    setCurrentMedia(media);
    setIsOpen(true);

    if (gallery && gallery.length > 0) {
      setMediaGallery(gallery);
      const index = gallery.findIndex((m) => m.id === media.id);
      setCurrentIndex(index >= 0 ? index : 0);
    } else {
      setMediaGallery([media]);
      setCurrentIndex(0);
    }
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Clear state after animation
    setTimeout(() => {
      setCurrentMedia(null);
      setMediaGallery([]);
      setCurrentIndex(0);
    }, 200);
  }, []);

  // Navigate to previous media
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentMedia(mediaGallery[newIndex]);
    }
  }, [currentIndex, mediaGallery]);

  // Navigate to next media
  const goToNext = useCallback(() => {
    if (currentIndex < mediaGallery.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentMedia(mediaGallery[newIndex]);
    }
  }, [currentIndex, mediaGallery]);

  // Check navigation availability
  const hasPrevious = useMemo(() => currentIndex > 0, [currentIndex]);
  const hasNext = useMemo(
    () => currentIndex < mediaGallery.length - 1,
    [currentIndex, mediaGallery.length]
  );

  // Jump to specific index
  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < mediaGallery.length) {
        setCurrentIndex(index);
        setCurrentMedia(mediaGallery[index]);
      }
    },
    [mediaGallery]
  );

  return {
    isOpen,
    currentMedia,
    mediaGallery,
    openModal,
    closeModal,
    goToPrevious,
    goToNext,
    goToIndex,
    hasPrevious,
    hasNext,
    currentIndex,
    totalMedia: mediaGallery.length,
  };
}
