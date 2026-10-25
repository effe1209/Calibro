import { useCallback, useEffect, useRef, useState } from 'react';
import { getWatchThumbnailUrl } from './imageService';

const IMAGE_FALLBACK = 'orologio_back.svg';

export const useWatchThumbnail = (imageValue, originalImageUrl, targetRef) => {
  const [imageSrc, setImageSrc] = useState(null);
  const hasTriedOriginalRef = useRef(false);

  useEffect(() => {
    let isCurrent = true;
    hasTriedOriginalRef.current = false;

    const loadThumbnail = async () => {
      try {
        const thumbnailUrl = await getWatchThumbnailUrl(imageValue);
        if (isCurrent) setImageSrc(thumbnailUrl || originalImageUrl || null);
      } catch (error) {
        console.error('Impossibile caricare la miniatura; uso la foto originale:', error);
        if (isCurrent) setImageSrc(originalImageUrl || null);
      }
    };

    const target = targetRef.current;
    if (!imageValue || !target || typeof IntersectionObserver === 'undefined') {
      if (imageValue) {
        loadThumbnail();
      } else {
        setImageSrc(originalImageUrl || null);
      }
      return () => {
        isCurrent = false;
      };
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      loadThumbnail();
    }, { rootMargin: '300px' });

    observer.observe(target);
    return () => {
      isCurrent = false;
      observer.disconnect();
    };
  }, [imageValue, originalImageUrl, targetRef]);

  const handleImageError = useCallback((event, onFallback) => {
    if (
      imageSrc
      && imageSrc !== originalImageUrl
      && originalImageUrl
      && !hasTriedOriginalRef.current
    ) {
      console.error('La miniatura non è disponibile; ripiego sulla foto originale.');
      hasTriedOriginalRef.current = true;
      setImageSrc(originalImageUrl);
      return;
    }

    event.currentTarget.src = IMAGE_FALLBACK;
    onFallback?.(event);
  }, [imageSrc, originalImageUrl]);

  return {
    imageSrc: imageSrc || IMAGE_FALLBACK,
    handleImageError,
  };
};
