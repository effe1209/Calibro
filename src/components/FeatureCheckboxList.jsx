import React from 'react';

// Un componente riutilizzabile per renderizzare la lista di checkbox
const FeatureCheckboxList = ({
  featuresList,
  selectedFeatures = [],
  onChange,
  isLoading = false,
  error = '',
}) => {
  
  if (isLoading) {
    return <p className="features-status" role="status">Caricamento caratteristiche...</p>;
  }

  if (error) {
    return (
      <p className="features-status features-status--error" role="alert">
        Impossibile caricare le caratteristiche. {error}
      </p>
    );
  }

  if (!featuresList || featuresList.length === 0) {
    return <p className="features-status">Nessuna caratteristica aggiuntiva disponibile.</p>;
  }

  return (
    <fieldset className="watch-feature-selector">
      <legend>Seleziona Caratteristiche</legend>
      <div className="watch-feature-selector__options">
        {featuresList.map((feature) => {
          const isChecked = selectedFeatures.includes(feature.id_caratteristica);
          return (
            <label key={feature.id_caratteristica} className={isChecked ? 'is-selected' : ''}>
              <input
                type="checkbox"
                value={feature.id_caratteristica}
                checked={isChecked}
                onChange={onChange}
              />
              {feature.nome_caratteristica}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default FeatureCheckboxList;
