import React from 'react';

const WatchDetails = ({ watch, imageLoading = 'lazy', onImageError }) => {
  const features = Array.isArray(watch.caratteristiche)
    ? watch.caratteristiche.filter(Boolean)
    : [];
  const formattedPrice = watch.money !== null && watch.money !== undefined && watch.money !== ''
    ? `${Number(watch.money).toLocaleString('it-IT')} €`
    : 'N/D';
  const formattedDeclaredValue = watch.declared_value !== null && watch.declared_value !== undefined && watch.declared_value !== ''
    ? `${Number(watch.declared_value).toLocaleString('it-IT')} €`
    : 'N/D';
  const formatDate = (date) => date
    ? new Date(`${date}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const equipment = [
    watch.has_box && 'Scatola originale',
    watch.has_papers && 'Documenti e libretti',
    watch.accessories?.trim(),
  ].filter(Boolean);

  return (
    <div className="watch-detail-body">
      <div className="watch-detail-image-frame">
        <img
          src={watch.imageUrl || 'orologio_back.svg'}
          alt={watch.name || 'Orologio della collezione'}
          className="watch-detail-image"
          loading={imageLoading}
          onError={(event) => {
            onImageError?.(event);
            event.currentTarget.src = 'orologio_back.svg';
          }}
        />
      </div>

      <dl className="watch-detail-grid">
        <div className="watch-detail-item">
          <dt>Marca</dt>
          <dd>{watch.brand || 'N/D'}</dd>
        </div>
        <div className="watch-detail-item">
          <dt>Anno</dt>
          <dd>{watch.year || 'N/D'}</dd>
        </div>
        <div className="watch-detail-item">
          <dt>Condizione</dt>
          <dd>{watch.condition_rating ? `${watch.condition_rating}/10` : 'Non valutata'}</dd>
        </div>
        <div className="watch-detail-item">
          <dt>Movimento</dt>
          <dd>{watch.movement || 'N/D'}</dd>
        </div>
        <div className="watch-detail-item">
          <dt>Colore</dt>
          <dd>{watch.color || 'N/D'}</dd>
        </div>
        <div className="watch-detail-item">
          <dt>Prezzo di acquisto</dt>
          <dd>{formattedPrice}</dd>
        </div>
        <div className="watch-detail-item">
          <dt>Data di acquisto</dt>
          <dd>{formatDate(watch.purchase_date) || 'N/D'}</dd>
        </div>
        <div className="watch-detail-item">
          <dt>Valore dichiarato</dt>
          <dd>{formattedDeclaredValue}</dd>
        </div>
        <div className="watch-detail-item">
          <dt>Dotazione</dt>
          <dd>{equipment.length ? equipment.join(' · ') : 'Nessuna dotazione indicata'}</dd>
        </div>
        <div className="watch-detail-item">
          <dt>Garanzia</dt>
          <dd>
            {watch.has_warranty ? (
              <span>
                {watch.warranty_provider || 'Attiva'}
                {watch.warranty_start && <> · dal {formatDate(watch.warranty_start)}</>}
                {watch.warranty_end && <> · fino al {formatDate(watch.warranty_end)}</>}
              </span>
            ) : 'Non indicata'}
          </dd>
        </div>
        <div className="watch-detail-item watch-detail-item--wide">
          <dt>Caratteristiche aggiuntive</dt>
          <dd>
            {features.length > 0 ? (
              <ul className="watch-detail-features">
                {features.map((feature, index) => (
                  <li key={feature.id_caratteristica || `${feature.nome_caratteristica}-${index}`}>
                    {feature.nome_caratteristica}
                  </li>
                ))}
              </ul>
            ) : 'Nessuna'}
          </dd>
        </div>
        <div className="watch-detail-item watch-detail-item--wide">
          <dt>Note</dt>
          <dd>{watch.note || 'Nessuna nota'}</dd>
        </div>
      </dl>
    </div>
  );
};

export default WatchDetails;
