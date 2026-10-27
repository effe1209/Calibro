import React from 'react';
import FeatureCheckboxList from './FeatureCheckboxList'; // Importa il nuovo componente
import Stepper, { Step } from './Stepper';
import WatchOccasionSelector from './WatchOccasionSelector';
import ExternalImageProcessingNotice from './ExternalImageProcessingNotice';
import { triggerLightImpact } from './nativeFeedback';
import { useObjectUrl } from './useObjectUrl';


// Questo è solo il Form per aggiungere un orologio
// Riceve tutto lo stato e i gestori da App.jsx
const AddWatchForm = ({
  showForm,
  sectionRef,
  newWatch,
  setNewWatch,
  handleImageChange,
  fileInputRef,
  allFeaturesList,
  featuresLoading,
  featuresError,
  handleFeatureChange,
  handleAddWatch,
  handleCancel,
  isDark
}) => {
  const previewImageUrl = useObjectUrl(
    typeof Blob !== 'undefined' && newWatch.image instanceof Blob ? newWatch.image : null
  );

  // Se non dobbiamo mostrarlo, non renderizziamo nulla
  if (!showForm) {
    return null;
  }

  return (
    <section ref={sectionRef} className="add-watch-section" aria-labelledby="add-watch-title">
      <header className="add-watch-heading">
        <p className="add-watch-eyebrow">LA TUA COLLEZIONE</p>
        <h2 id="add-watch-title">Aggiungi un orologio</h2>
        <p>Completa la scheda un passaggio alla volta e arricchisci la tua collezione.</p>
      </header>
      <div className="form add-watch-form">
        <Stepper
          initialStep={1}
          onFinalStepCompleted={handleAddWatch}
          onCancel={handleCancel}
          backButtonText="Indietro"
          nextButtonText="Avanti"
          isDark={isDark}
        >
        <Step>
          <div className="add-watch-field">
            <label htmlFor="add-watch-name">Nome</label>
            <input
              id="add-watch-name"
              type="text"
              placeholder="Es. Speedmaster Professional"
              value={newWatch.name}
              onChange={(e) => setNewWatch({ ...newWatch, name: e.target.value })}
            />
          </div>
        </Step>
        <Step>
          <div className="add-watch-field">
            <label htmlFor="add-watch-brand">Marca</label>
            <input
              id="add-watch-brand"
              type="text"
              placeholder="Es. Omega"
              value={newWatch.brand}
              onChange={(e) => setNewWatch({ ...newWatch, brand: e.target.value })}
            />
          </div>
        </Step>
        <Step>
          <div className="add-watch-field">
            <label htmlFor="add-watch-year">Anno</label>
            <input
              id="add-watch-year"
              type="number"
              placeholder="Es. 2024"
              value={newWatch.year}
              onChange={(e) => setNewWatch({ ...newWatch, year: e.target.value })}
            />
          </div>
        </Step>
        <Step>
          <div className="add-watch-field">
            <label htmlFor="add-watch-price">Prezzo di acquisto</label>
            <input
              id="add-watch-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Importo in euro"
              value={newWatch.money ?? ''}
              onChange={(e) => setNewWatch({ ...newWatch, money: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </Step>
        <Step>
          <div className="add-watch-field">
            <label htmlFor="add-watch-purchase-date">Data di acquisto</label>
            <input
              id="add-watch-purchase-date"
              type="date"
              value={newWatch.purchase_date || ''}
              onChange={(event) => setNewWatch({ ...newWatch, purchase_date: event.target.value || null })}
            />
          </div>
        </Step>
        <Step>
          <div className="add-watch-field">
            <label htmlFor="add-watch-declared-value">Valore dichiarato attuale</label>
            <input
              id="add-watch-declared-value"
              type="number"
              min="0"
              step="0.01"
              placeholder="Valutazione attuale in euro"
              value={newWatch.declared_value ?? ''}
              onChange={(event) => setNewWatch({ ...newWatch, declared_value: event.target.value ? Number(event.target.value) : null })}
            />
            <small>Puoi aggiornare questa stima quando cambia il valore dell’orologio.</small>
          </div>
        </Step>
        <Step>
          <label className="add-watch-field condition-rating-field" htmlFor="add-watch-condition">
            <span>Condizione dell’orologio</span>
            <select
              id="add-watch-condition"
              value={newWatch.condition_rating ?? ''}
              onChange={(event) => setNewWatch({
                ...newWatch,
                condition_rating: event.target.value ? Number(event.target.value) : null,
              })}
            >
              <option value="">Non valutata</option>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => (
                <option key={rating} value={rating}>
                  {rating}{rating === 1 ? ' · Da revisionare' : rating === 10 ? ' · Pari al nuovo' : ''}
                </option>
              ))}
            </select>
            <small>1 = da revisionare · 10 = pari al nuovo</small>
          </label>
        </Step>

        <Step>
          <div className="add-watch-step-heading">
            <h3>Caratteristiche</h3>
            <p>Scegli il movimento e il colore del tuo orologio.</p>
          </div>
          <div className="add-watch-feature-fields">
            <div className="add-watch-control">
              <label htmlFor="add-watch-movement">Movimento</label>
              <select
                id="add-watch-movement"
                value={newWatch.movement}
                onChange={(e) => setNewWatch({ ...newWatch, movement: e.target.value })}
              >
                <option value="">Seleziona il movimento</option>
                <option value="Automatico">🌀 Automatico</option>
                <option value="Carica Manuale">🤏 Carica manuale</option>
                <option value="Quarzo">🔋 Quarzo</option>
              </select>
            </div>
            <div className="add-watch-control">
              <label htmlFor="add-watch-color">Colore</label>
              <div className="color-picker-container">
                <button
                  type="button"
                  className="color-picker-button"
                  style={{ backgroundColor: newWatch.color }}
                  tabIndex="-1"
                  aria-hidden="true"
                >
                  🎨 Scegli un colore
                </button>
                <input
                  type="color"
                  id="add-watch-color"
                  className="color-input-overlay"
                  aria-label="Seleziona il colore dell'orologio"
                  value={newWatch.color || '#ffffff'}
                  onChange={(e) => setNewWatch({ ...newWatch, color: e.target.value })}
                />
                {newWatch.color && <p className="selected-color">Colore selezionato: {newWatch.color}</p>}
              </div>
            </div>
          </div>
          <WatchOccasionSelector
            idPrefix="add-watch-occasion"
            value={newWatch.occasions}
            onChange={(occasions) => setNewWatch((currentWatch) => ({ ...currentWatch, occasions }))}
          />
        </Step>
        
      

        <Step>
          <div className="add-watch-step-heading">
            <h3>Immagine</h3>
            <p>Aggiungi una foto per riconoscere subito il tuo segnatempo.</p>
          </div>
          <div className="upload-container add-watch-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
              className="hidden-input"
              id="file-upload-add"
              multiple={false}
            />
            <button type="button" className="upload-button" onClick={() => {
              void triggerLightImpact();
              fileInputRef.current?.click();
            }}>
              📸 Seleziona un'immagine
            </button>
          </div>
          <ExternalImageProcessingNotice />
          {previewImageUrl && (
            <img
              src={previewImageUrl}
              alt="Anteprima dell'orologio"
              className="preview-image add-watch-preview"
            />
          )}
        </Step>
        <Step>
          <div className="add-watch-step-heading">
            <h3>Dettagli tecnici</h3>
            <p>Se vuoi, seleziona le caratteristiche che descrivono il tuo orologio.</p>
          </div>
          <FeatureCheckboxList
            featuresList={allFeaturesList}
            selectedFeatures={newWatch.features}
            onChange={handleFeatureChange}
            isLoading={featuresLoading}
            error={featuresError}
          />
        </Step>

        <Step>
          <div className="add-watch-step-heading">
            <h3>Dotazione e garanzia</h3>
            <p>Registra scatola, documenti e copertura del tuo orologio.</p>
          </div>
          <div className="watch-equipment-fields">
            <div className="watch-equipment-options watch-equipment-fields__wide">
              <label className={`watch-equipment-check${newWatch.has_box ? ' is-selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={Boolean(newWatch.has_box)}
                  onChange={(e) => setNewWatch({ ...newWatch, has_box: e.target.checked })}
                />
                <span>Scatola originale</span>
              </label>
              <label className={`watch-equipment-check${newWatch.has_papers ? ' is-selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={Boolean(newWatch.has_papers)}
                  onChange={(e) => setNewWatch({ ...newWatch, has_papers: e.target.checked })}
                />
                <span>Documenti e libretti</span>
              </label>
            </div>
            <label className="add-watch-field watch-equipment-fields__wide">
              <span>Altra dotazione</span>
              <input
                type="text"
                maxLength="500"
                placeholder="Es. maglie aggiuntive, certificato, astuccio"
                value={newWatch.accessories || ''}
                onChange={(e) => setNewWatch({ ...newWatch, accessories: e.target.value })}
              />
            </label>
            <label className={`watch-equipment-check watch-equipment-fields__wide${newWatch.has_warranty ? ' is-selected' : ''}`}>
              <input
                type="checkbox"
                checked={Boolean(newWatch.has_warranty)}
                onChange={(e) => setNewWatch({ ...newWatch, has_warranty: e.target.checked })}
              />
              <span>È coperto da garanzia</span>
            </label>
            {newWatch.has_warranty && (
              <>
                <label className="add-watch-field">
                  <span>Inizio garanzia</span>
                  <input type="date" value={newWatch.warranty_start || ''} onChange={(e) => setNewWatch({ ...newWatch, warranty_start: e.target.value || null })} />
                </label>
                <label className="add-watch-field">
                  <span>Scadenza garanzia</span>
                  <input type="date" value={newWatch.warranty_end || ''} onChange={(e) => setNewWatch({ ...newWatch, warranty_end: e.target.value || null })} />
                </label>
                <label className="add-watch-field watch-equipment-fields__wide">
                  <span>Rivenditore o centro assistenza</span>
                  <input type="text" maxLength="160" value={newWatch.warranty_provider || ''} onChange={(e) => setNewWatch({ ...newWatch, warranty_provider: e.target.value })} />
                </label>
              </>
            )}
          </div>
        </Step>

        <Step>
          <div className="add-watch-step-heading">
            <h3>Note personali</h3>
            <p>Annota la storia, la data di acquisto o altri dettagli che vuoi ricordare.</p>
          </div>
          <textarea
            placeholder="Note aggiuntive (es. data acquisto, storia, difetti...)"
            className="notes-textarea"
            value={newWatch.note}
            onChange={(e) => setNewWatch({ ...newWatch, note: e.target.value })}
            aria-label="Note aggiuntive sull'orologio"
          />
        </Step>
        </Stepper>
      </div>
    </section>
  );
};

export default AddWatchForm;
