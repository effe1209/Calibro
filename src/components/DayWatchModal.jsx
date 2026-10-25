import React, { useEffect, useState } from 'react';
import WatchDetails from './WatchDetails';
import { getWatchImageUrl } from './imageService';

// Modale semplice per l'"Orologio del Giorno"
const DayWatchModal = ({ isVisible, setIsVisible, selectedWatch, modalTitle }) => {
  const [imageState, setImageState] = useState({
    watchId: null,
    imageUrl: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (isVisible) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';

    return () => { document.body.style.overflow = 'unset'; };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible || !selectedWatch) return undefined;

    let isCurrent = true;
    const imageValue = selectedWatch.image || selectedWatch.imageUrl;
    setImageState({
      watchId: selectedWatch.id,
      imageUrl: null,
      isLoading: Boolean(imageValue),
      error: null,
    });

    if (imageValue) {
      getWatchImageUrl(imageValue)
        .then((imageUrl) => {
          if (isCurrent) {
            setImageState({
              watchId: selectedWatch.id,
              imageUrl,
              isLoading: false,
              error: null,
            });
          }
        })
        .catch((error) => {
          console.error('Impossibile caricare la foto dell’orologio del giorno:', error);
          if (isCurrent) {
            setImageState({
              watchId: selectedWatch.id,
              imageUrl: null,
              isLoading: false,
              error: 'La foto di questo orologio non è al momento disponibile.',
            });
          }
        });
    }

    return () => {
      isCurrent = false;
    };
  }, [isVisible, selectedWatch]);

  if (!isVisible || !selectedWatch) {
    return null;
  }

  const currentImageState = imageState.watchId === selectedWatch.id
    ? imageState
    : { imageUrl: null, isLoading: Boolean(selectedWatch.image || selectedWatch.imageUrl), error: null };
  const watchForDisplay = {
    ...selectedWatch,
    imageUrl: currentImageState.imageUrl,
  };

  return (
    <div className="modal-overlay" onClick={() => setIsVisible(false)}>
      <div className="day-watch-modal watch-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-content watch-detail-card" role="dialog" aria-modal="true" aria-labelledby="day-watch-title">
          <header className="watch-detail-heading">
            <div>
              <span className="watch-detail-eyebrow">SELEZIONE DEL GIORNO</span>
              <h2 id="day-watch-title">{modalTitle || 'Orologio del giorno'}</h2>
              <p className="watch-detail-subtitle">{selectedWatch.name}</p>
            </div>
          </header>

          {currentImageState.isLoading && (
            <p role="status">Caricamento della foto…</p>
          )}
          {currentImageState.error && (
            <p role="status">{currentImageState.error}</p>
          )}
          <WatchDetails
            watch={watchForDisplay}
            imageLoading="eager"
            onImageError={() => {
              setImageState((current) => ({
                ...current,
                error: 'La foto non è riuscita a caricarsi. Riprova tra poco.',
              }));
            }}
          />

          <footer className="watch-detail-footer">
            <button type="button" className="funzioniButton" onClick={() => setIsVisible(false)}>Chiudi</button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default DayWatchModal;
