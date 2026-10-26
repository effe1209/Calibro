import React, { useState, useEffect } from 'react';

// Componente bottone riutilizzabile con animazione
const FavoriteButton = ({ isFavorite, onToggle }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (!isFavorite) {
      setIsAnimating(true);
    }
    onToggle();
  };

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  const animationClass = isAnimating ? 'is-animating' : '';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`favoriteButton__button ${animationClass}`}
      aria-label={isFavorite ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
    >
      {isFavorite ? '⭐️' : '☆'}
    </button>
  );
};

export default FavoriteButton;
