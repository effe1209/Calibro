
const featuresList = ["Datario", "Cronografo", "Impermeabile", "Automatico", "Subacqueo"];

function FeaturesDropdown({ newWatch, setNewWatch }) {
  const handleFeatureChange = (event) => {
    const { value, checked } = event.target;

    setNewWatch((prev) => {
      if (checked) {
        // Aggiungi la feature
        return { ...prev, features: [...prev.features, value] };
      } else {
        // Rimuovi la feature
        return { ...prev, features: prev.features.filter((f) => f !== value) };
      }
    });
  };

  return (
    <div className="details-menu">
      <h4>Seleziona Caratteristiche</h4>

      {featuresList.map((feature) => (
        <label key={feature} className="checkbox-label">
          <input
            type="checkbox"
            className="checkbox-input"
            value={feature}
            checked={newWatch.features.includes(feature)}
            onChange={handleFeatureChange}
          />
          {feature}
        </label>
      ))}
    </div>
  );
}

export default FeaturesDropdown;