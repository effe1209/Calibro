import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import FavoriteButton from './FavoriteButton';
import { Share2 } from 'lucide-react';
import WatchDetails from './WatchDetails';
import MaintenanceLog from './MaintenanceLog';

const InfoWatchModal = ({ 
  isVisible, 
  setIsVisible, 
  selectedWatch, 
  handleDeleteWatch, 
  handleFavoriteToggle,
  onShareWatch,
  userId,
  onMaintenanceChanged,
}) => {

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isVisible]);

  if (!isVisible || !selectedWatch) {
    return null;
  }
  
  return createPortal(
    <div className="modal-overlay watch-detail-overlay" onClick={() => setIsVisible(false)}>
      <div className="infoView watch-detail-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-content watch-detail-card" role="dialog" aria-modal="true" aria-labelledby="watch-detail-title">
          <header className="watch-detail-heading">
            <div>
              <span className="watch-detail-eyebrow">DETTAGLIO COLLEZIONE</span>
              <h2 id="watch-detail-title">{selectedWatch.name}</h2>
            </div>
            <div className="watch-detail-actions">
              <button
                type="button"
                className="modal-share-btn"
                onClick={() => onShareWatch(selectedWatch)}
                aria-label={`Condividi ${selectedWatch.name}`}
              >
                <Share2 aria-hidden="true" size={20} />
              </button>
              <FavoriteButton
                isFavorite={selectedWatch.isFavorite}
                onToggle={() => handleFavoriteToggle(selectedWatch.id)}
              />
              <button
                type="button"
                className="modal-delete-btn"
                onClick={async () => {
                  const deleted = await handleDeleteWatch(selectedWatch.id, selectedWatch.imageUrl);
                  if (deleted) setIsVisible(false);
                }}
                aria-label="Elimina orologio"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </header>

          <WatchDetails watch={selectedWatch} />
          <MaintenanceLog
            watchId={selectedWatch.id}
            userId={userId}
            onMaintenanceChanged={onMaintenanceChanged}
          />

          <footer className="watch-detail-footer">
            <button type="button" className="funzioniButton" onClick={() => setIsVisible(false)}>Chiudi</button>
          </footer>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default InfoWatchModal;
