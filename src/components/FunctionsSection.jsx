import React from 'react';
import { OUTFIT_COLOR_FAMILIES, OUTFIT_OCCASIONS } from './outfitPreferences';
import ExternalImageProcessingNotice from './ExternalImageProcessingNotice';

// Raggruppa i bottoni delle "Funzioni"
const FunctionsSection = ({
  onDayWatchClick,
  onOutfitImageChange,
  fileInputRefOutfit,
  outfitOccasion,
  setOutfitOccasion,
  outfitColorFamily,
  setOutfitColorFamily,
  onRebuildOutfitEmbeddings,
  outfitMissingEmbeddingCount,
  isRebuildingOutfit,
  outfitRebuildProgress,
}) => {
  return (
    <div className="functionButton">
      <article className="function-card function-card--daily">
        <div className="function-card__copy">
          <span className="function-card__eyebrow">SELEZIONE DEL GIORNO</span>
          <h4>Orologio del giorno</h4>
          <p>Lascia scegliere alla collezione il protagonista di oggi.</p>
        </div>
        <button type="button" className="function-card__action" onClick={onDayWatchClick}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7v5l3.2 2" />
          </svg>
          <span>Mostra l'orologio</span>
          <span className="function-card__arrow" aria-hidden="true">↗</span>
        </button>
      </article>

      <article className="function-card function-card--outfit">
        <div className="function-card__copy">
          <span className="function-card__eyebrow">ABBINAMENTO PERSONALE</span>
          <h4>Completa l'outfit</h4>
          <p>Carica una foto nitida dell’outfit: cercherò gli abbinamenti nella tua collezione.</p>
          <ExternalImageProcessingNotice />
        </div>

        <div className="outfit-preferences">
          <label>
            <span>Occasione</span>
            <select value={outfitOccasion} onChange={(event) => setOutfitOccasion(event.target.value)}>
              <option value="all">Tutte le occasioni</option>
              {OUTFIT_OCCASIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Colore dell’orologio</span>
            <select value={outfitColorFamily} onChange={(event) => setOutfitColorFamily(event.target.value)}>
              <option value="all">Tutti i colori</option>
              {OUTFIT_COLOR_FAMILIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <p className="outfit-preferences__help">Per filtrare per occasione, assegna i tag d’uso nelle schede degli orologi.</p>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={onOutfitImageChange}
          ref={fileInputRefOutfit}
          className="hidden-input"
          id="file-upload-outfit"
        />
        <button
          type="button"
          className="function-card__action function-card__action--secondary"
          onClick={() => fileInputRefOutfit.current?.click()}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
            <circle cx="9" cy="10" r="1.5" />
            <path d="m5 17 4.5-4.5 3 3L15 13l4 4" />
          </svg>
          <span>Carica una foto</span>
          <span className="function-card__arrow" aria-hidden="true">↗</span>
        </button>
        {(outfitMissingEmbeddingCount > 0 || isRebuildingOutfit) && (
          <div className="outfit-rebuild-control">
            <button
              type="button"
              className="outfit-rebuild-button"
              onClick={onRebuildOutfitEmbeddings}
              disabled={isRebuildingOutfit}
            >
              {isRebuildingOutfit
                ? 'Preparo gli orologi…'
                : `Prepara ${outfitMissingEmbeddingCount} ${outfitMissingEmbeddingCount === 1 ? 'orologio' : 'orologi'} per gli abbinamenti`}
            </button>
            {outfitRebuildProgress && <p className="outfit-rebuild-progress" role="status">{outfitRebuildProgress}</p>}
          </div>
        )}
      </article>
    </div>
  );
};

export default FunctionsSection;
