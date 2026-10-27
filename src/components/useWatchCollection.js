import { useCallback, useRef, useState } from 'react';
import { getUserWatches } from './watchService';

export function useWatchCollection(setMessage) {
  const [watches, setWatches] = useState([]);
  const [missingOutfitEmbeddingIds, setMissingOutfitEmbeddingIds] = useState([]);
  const requestRef = useRef(0);

  const invalidateRequests = useCallback(() => {
    requestRef.current += 1;
  }, []);

  const clearCollection = useCallback(() => {
    invalidateRequests();
    setWatches([]);
    setMissingOutfitEmbeddingIds([]);
  }, [invalidateRequests]);

  const fetchWatches = useCallback(async (userId) => {
    const requestId = ++requestRef.current;

    try {
      const collection = await getUserWatches(userId);
      if (requestId !== requestRef.current) return false;

      setWatches(collection.watches);
      setMissingOutfitEmbeddingIds(collection.missingOutfitEmbeddingIds);
      return true;
    } catch (error) {
      if (requestId === requestRef.current) {
        const details = error instanceof Error ? error.message : String(error);
        setMessage(`Errore durante il recupero degli orologi: ${details}`);
      }
      return false;
    }
  }, [setMessage]);

  return {
    watches,
    setWatches,
    missingOutfitEmbeddingIds,
    setMissingOutfitEmbeddingIds,
    fetchWatches,
    invalidateRequests,
    clearCollection,
  };
}
