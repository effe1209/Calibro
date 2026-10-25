import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import { motion } from 'framer-motion';
import FavoriteButton from './FavoriteButton';
import TiltedCard from './TiltedCard';
import { useWatchThumbnail } from './useWatchThumbnail';
import MaintenanceReminderBanner from './MaintenanceReminderBanner';

// Importa gli stili di Swiper necessari
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const readSavedViewMode = () => {
  try {
    const savedView = JSON.parse(localStorage.getItem('viewMode') || 'false');
    return typeof savedView === 'boolean' ? savedView : false;
  } catch {
    return false;
  }
};

const getWatchFeatures = (watch) => {
  if (Array.isArray(watch.caratteristiche)) return watch.caratteristiche;
  if (!Array.isArray(watch.Orologi_Caratteristiche)) return [];
  return watch.Orologi_Caratteristiche
    .map((entry) => entry?.caratteristiche)
    .filter(Boolean);
};

const csvCell = (value) => {
  let text = String(value ?? '');
  let firstNonWhitespace = 0;
  while (firstNonWhitespace < text.length && text.charCodeAt(firstNonWhitespace) <= 0x20) {
    firstNonWhitespace += 1;
  }
  if (/[=+\-@]/.test(text[firstNonWhitespace] || '')) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const WatchCarouselImage = ({ watch }) => {
  const imageRef = useRef(null);
  const thumbnail = useWatchThumbnail(watch.image, watch.imageUrl, imageRef);

  return (
    <img
      ref={imageRef}
      src={thumbnail.imageSrc}
      alt={watch.name}
      className="watch-imageCarosel"
      loading="lazy"
      onError={(event) => thumbnail.handleImageError(event)}
    />
  );
};

// Questo componente gestisce la visualizzazione (lista o carosello)
// e l'ordinamento degli orologi
const WatchList = ({ 
  watches, 
  handleModifyWatch, 
  handleFavoriteToggle, 
  handleInfoWatch,
  handleShowStats,
  handleInfiniteGrid,
  onCreateBackup,
  onRestoreBackup,
  backupInputRef,
  isBackupBusy,
  userId,
  maintenanceRefreshKey,
}) => {
  const [isCarouselView, setIsCarouselView] = useState(readSavedViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('favorites');

  useEffect(() => {
    try {
      localStorage.setItem('viewMode', JSON.stringify(isCarouselView));
    } catch {
      // La modalità resta utilizzabile anche se il browser blocca lo storage.
    }
  }, [isCarouselView]);

  const toggleView = () => {
    setIsCarouselView(prevState => !prevState);
  };

  const closeExportMenu = (event) => {
    const menu = event.currentTarget.closest('details');
    if (menu) menu.open = false;
  };

  const brands = useMemo(() => {
    const uniqueBrands = new Map();
    watches.forEach((watch) => {
      const brand = String(watch.brand || '').trim();
      if (brand && !uniqueBrands.has(brand.toLocaleLowerCase('it'))) {
        uniqueBrands.set(brand.toLocaleLowerCase('it'), brand);
      }
    });
    return [...uniqueBrands.values()].sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
  }, [watches]);

  const sortedWatches = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('it');
    const filtered = watches.filter((watch) => {
      const price = Number(watch.money);
      const year = Number(watch.year);
      const hasYear = watch.year !== null && watch.year !== undefined && watch.year !== '' && Number.isFinite(year);
      const searchFields = [
        watch.name,
        watch.brand,
        watch.year,
        watch.purchase_date,
        watch.declared_value,
        watch.condition_rating,
        watch.movement,
        watch.color,
        watch.note,
        watch.accessories,
        watch.warranty_provider,
        watch.warranty_start,
        watch.warranty_end,
        ...getWatchFeatures(watch).map((feature) => feature.nome_caratteristica || feature.name),
      ];
      const matchesQuery = !normalizedQuery || searchFields
        .some((field) => String(field || '').toLocaleLowerCase('it').includes(normalizedQuery));
      const normalizedBrand = String(watch.brand || '').trim().toLocaleLowerCase('it');
      const matchesBrand = !brandFilter || normalizedBrand === brandFilter.toLocaleLowerCase('it');
      const matchesFavorites = !favoriteOnly || watch.isFavorite;
      const matchesMinYear = !minYear || (hasYear && year >= Number(minYear));
      const matchesMaxYear = !maxYear || (hasYear && year <= Number(maxYear));
      const hasPrice = watch.money !== null && watch.money !== undefined && watch.money !== '' && Number.isFinite(price);
      const matchesMinPrice = !minPrice || (hasPrice && price >= Number(minPrice));
      const matchesMaxPrice = !maxPrice || (hasPrice && price <= Number(maxPrice));

      return matchesQuery && matchesBrand && matchesFavorites
        && matchesMinYear && matchesMaxYear && matchesMinPrice && matchesMaxPrice;
    });

    const compareName = (a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'it', { sensitivity: 'base' });
    const compareNumber = (field, direction) => (a, b) => {
      const aValue = Number(a[field]);
      const bValue = Number(b[field]);
      const aHasValue = a[field] !== null && a[field] !== undefined && a[field] !== '' && Number.isFinite(aValue);
      const bHasValue = b[field] !== null && b[field] !== undefined && b[field] !== '' && Number.isFinite(bValue);
      if (!aHasValue) return bHasValue ? 1 : 0;
      if (!bHasValue) return -1;
      return (aValue - bValue) * direction;
    };

    return filtered.sort((a, b) => {
      if (sortBy === 'name') return compareName(a, b);
      if (sortBy === 'year-newest') return compareNumber('year', -1)(a, b);
      if (sortBy === 'year-oldest') return compareNumber('year', 1)(a, b);
      if (sortBy === 'price-low') return compareNumber('money', 1)(a, b);
      if (sortBy === 'price-high') return compareNumber('money', -1)(a, b);
      if (sortBy === 'brand') {
        return String(a.brand || '').localeCompare(String(b.brand || ''), 'it', { sensitivity: 'base' }) || compareName(a, b);
      }
      return Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)) || compareName(a, b);
    });
  }, [watches, searchQuery, brandFilter, favoriteOnly, minYear, maxYear, minPrice, maxPrice, sortBy]);

  const hasActiveFilters = Boolean(
    searchQuery || brandFilter || favoriteOnly || minYear || maxYear || minPrice || maxPrice || sortBy !== 'favorites'
  );

  const resetFilters = () => {
    setSearchQuery('');
    setBrandFilter('');
    setFavoriteOnly(false);
    setMinYear('');
    setMaxYear('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('favorites');
  };

  const exportVisibleWatches = () => {
    if (!sortedWatches.length) return;
    const rows = [
      ['Nome', 'Marca', 'Anno', 'Condizione (1-10)', 'Movimento', 'Prezzo di acquisto (€)', 'Data di acquisto', 'Valore dichiarato (€)', 'Colore', 'Preferito', 'Dotazione', 'Garanzia', 'Scadenza garanzia', 'Caratteristiche', 'Note', 'Immagine'],
      ...sortedWatches.map((watch) => [
        watch.name,
        watch.brand,
        watch.year,
        watch.condition_rating ?? '',
        watch.movement,
        watch.money,
        watch.purchase_date || '',
        watch.declared_value ?? '',
        watch.color,
        watch.isFavorite ? 'Sì' : 'No',
        [watch.has_box && 'Scatola originale', watch.has_papers && 'Documenti', watch.accessories].filter(Boolean).join(', '),
        watch.has_warranty ? (watch.warranty_provider || 'Attiva') : 'Non indicata',
        watch.warranty_end || '',
        getWatchFeatures(watch).map((feature) => feature.nome_caratteristica || feature.name || '').filter(Boolean).join(', '),
        watch.note,
        watch.imageUrl || watch.image,
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(';')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `calibro-collezione-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const emptyMessage = watches.length === 0
    ? 'La collezione è ancora vuota. Aggiungi un orologio per iniziare.'
    : 'Nessun orologio corrisponde ai filtri selezionati.';

  return (
    <div>
      <MaintenanceReminderBanner
        watches={watches}
        userId={userId}
        refreshKey={maintenanceRefreshKey}
        onOpenWatch={handleInfoWatch}
      />
      <div className="buttonView" id="listWatch">
        <button
          className="buttonView__stats"
          onClick={handleShowStats}
        >
          <span className="buttonView__stats-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 19.5h16M6.5 16V11m5.5 5V5m5.5 11V8" />
            </svg>
          </span>
          <span className="buttonView__stats-copy">
            <strong>Mostra statistiche</strong>
            <small>Analisi della collezione</small>
          </span>
          <span className="buttonView__stats-arrow" aria-hidden="true">↗</span>
        </button>
        <button
          type="button"
          className="buttonView__control buttonView__gallery galleriaInfinita"
          onClick={handleInfiniteGrid}
        >
          <span className="buttonView__control-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3.5" y="4" width="17" height="16" rx="3" />
              <circle cx="9" cy="9" r="1.5" />
              <path d="m5 17 4.5-4.5 3 3L15 13l4 4" />
            </svg>
          </span>
          <span>Galleria</span>
        </button>
        <button
          type="button"
          className="buttonView__control buttonView__toggle"
          onClick={toggleView}
          aria-label={isCarouselView ? 'Passa alla vista lista' : 'Passa alla vista carosello'}
        >
          <span className="buttonView__control-icon" aria-hidden="true">
            {isCarouselView ? (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3.5" y="4" width="7" height="7" rx="1.5" />
                <rect x="13.5" y="4" width="7" height="7" rx="1.5" />
                <rect x="3.5" y="13" width="7" height="7" rx="1.5" />
                <rect x="13.5" y="13" width="7" height="7" rx="1.5" />
              </svg>
            )}
          </span>
          <span>{isCarouselView ? 'Mostra lista' : 'Mostra carosello'}</span>
        </button>
      </div>

      <section className="collection-tools" aria-label="Ricerca e filtri della collezione">
        <div className="collection-tools__top-row">
          <label className="collection-search">
            <span className="collection-tools__label">Cerca nella collezione</span>
            <span className="collection-search__control">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.2 4.2" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Nome, marca, movimento, note..."
                aria-label="Cerca per nome, marca, movimento o note"
              />
            </span>
          </label>
          <div className="collection-tools__actions">
            <details className="collection-export-menu">
              <summary className="collection-export-button" aria-label="Backup completo o esportazione CSV">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" />
                </svg>
                {isBackupBusy ? 'Attendere…' : 'Backup / esporta'}
                <span className="collection-export-menu__chevron" aria-hidden="true">⌄</span>
              </summary>
              <div className="collection-export-menu__panel">
                <button
                  type="button"
                  onClick={(event) => {
                    closeExportMenu(event);
                    onCreateBackup();
                  }}
                  disabled={isBackupBusy}
                >
                  Backup completo
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    closeExportMenu(event);
                    exportVisibleWatches();
                  }}
                  disabled={sortedWatches.length === 0}
                  aria-label={`Esporta ${sortedWatches.length} orologi visibili in formato CSV`}
                >
                  Esporta CSV
                </button>
              </div>
            </details>
            <input
              ref={backupInputRef}
              className="hidden-input"
              type="file"
              accept=".json,application/json"
              onChange={onRestoreBackup}
              aria-label="Seleziona un file di backup Calibro da ripristinare"
            />
            <button
              type="button"
              className="collection-export-button collection-export-button--secondary"
              onClick={() => backupInputRef.current?.click()}
              disabled={isBackupBusy}
              aria-label="Ripristina un backup completo"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 15V3m0 0L8 7m4-4 4 4M5 14v6h14v-6" />
              </svg>
              Ripristina
            </button>
          </div>
        </div>
        <p className="collection-backup-note">Il backup completo include schede, revisioni, dotazione, garanzie e immagini.</p>

        <details className="collection-filters">
          <summary>Filtri e ordinamento</summary>
          <div className="collection-filters__grid">
            <label>
              <span className="collection-tools__label">Marca</span>
              <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
                <option value="">Tutte le marche</option>
                {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
              </select>
            </label>
            <label>
              <span className="collection-tools__label">Ordina per</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="favorites">Preferiti e nome</option>
                <option value="name">Nome A–Z</option>
                <option value="brand">Marca</option>
                <option value="year-newest">Anno: più recenti</option>
                <option value="year-oldest">Anno: più datati</option>
                <option value="price-low">Acquisto: crescente</option>
                <option value="price-high">Acquisto: decrescente</option>
              </select>
            </label>
            <label>
              <span className="collection-tools__label">Anno da</span>
              <input type="number" min="0" inputMode="numeric" value={minYear} onChange={(event) => setMinYear(event.target.value)} placeholder="Es. 1990" />
            </label>
            <label>
              <span className="collection-tools__label">Anno a</span>
              <input type="number" min="0" inputMode="numeric" value={maxYear} onChange={(event) => setMaxYear(event.target.value)} placeholder="Es. 2025" />
            </label>
            <label>
              <span className="collection-tools__label">Acquisto da (€)</span>
              <input type="number" min="0" step="0.01" inputMode="decimal" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Nessun minimo" />
            </label>
            <label>
              <span className="collection-tools__label">Acquisto a (€)</span>
              <input type="number" min="0" step="0.01" inputMode="decimal" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Nessun massimo" />
            </label>
            <label className="collection-favorites-filter">
              <input type="checkbox" checked={favoriteOnly} onChange={(event) => setFavoriteOnly(event.target.checked)} />
              <span>Solo preferiti</span>
            </label>
          </div>
        </details>
        <div className="collection-tools__summary" role="status" aria-live="polite">
          <span>{sortedWatches.length} di {watches.length} {watches.length === 1 ? 'orologio visibile' : 'orologi visibili'}</span>
          {hasActiveFilters && <button type="button" onClick={resetFilters}>Azzera filtri</button>}
        </div>
      </section>

      {/* VISTA LISTA */}
      {!isCarouselView && (
        <div className="watch-list">
          {sortedWatches.length === 0 ? <p className="watch-list-empty">{emptyMessage}</p> : sortedWatches.map((watch) => (
            <motion.div 
              key={watch.id} 
              className="watch-card"
              layout="position"
              layoutScroll
              transition={{ 
                type: "spring", // Spring è più naturale di linear per riordino
                stiffness: 200, 
                damping: 30 
              }}
            >
              <div className="GRID">
                  <FavoriteButton
                    isFavorite={watch.isFavorite}
                    onToggle={() => handleFavoriteToggle(watch.id)}
                  />
                {watch.imageUrl ? (
                  <TiltedCard
                    imageSrc={watch.imageUrl} // Usa imageUrl
                    imageValue={watch.image}
                    altText={watch.name}
                    containerHeight="260px"
                    containerWidth="100%"
                    imageHeight="100%"
                    imageWidth="100%"
                    loading="lazy"
                    onError={(e) => { e.target.src = "orologio_back.svg"; }}
                    rotateAmplitude={12}
                    scaleOnHover={1.2}
                    showMobileWarning={false}
                    showTooltip={false}
                    displayOverlayContent={true}
                  />
                ) : (
                  <img src="orologio_back.svg" alt={watch.name} className="watch-image"/>
                )}
                <div className="CaratteristicheCard">
                  <h3 className="textCard" style={{padding:"5px"}}>{watch.name}</h3>
                  {watch.condition_rating && (
                    <span className="watch-condition-rating">Condizione {watch.condition_rating}/10</span>
                  )}
                </div>
                
                <div className="cardBottoni">
                  <div className="modifyButton">
                    <button
                      className="modify-btn"
                      onClick={() => handleModifyWatch(watch)} // Passa l'intero oggetto
                    >
                      Modifica
                    </button>
                  </div>
                  
                  <div className="InfoButton">
                  <button
                    className="modify-btn"
                    onClick={() => handleInfoWatch(watch)} // Passa l'intero oggetto
                    >
                    Info
                  </button>
                </div>
                </div>
              </div>
            </motion.div>
            
            ))}
        </div>
      )}

      {/* VISTA CAROSELLO */}
      {isCarouselView && (
        sortedWatches.length > 0 ? (
          <Swiper
            className="watch-carousel"
            modules={[Navigation, Pagination, A11y]}
            spaceBetween={16}
            slidesPerView={1.08}
            speed={550}
            grabCursor
            watchOverflow
            noSwipingSelector="button"
            navigation={sortedWatches.length > 1}
            pagination={sortedWatches.length > 1
              ? { clickable: true, dynamicBullets: true, dynamicMainBullets: 5 }
              : false}
            breakpoints={{
              520: { slidesPerView: 1.45, spaceBetween: 18 },
              760: { slidesPerView: 2.1, spaceBetween: 18 },
              1120: { slidesPerView: 2.8, spaceBetween: 20 },
            }}
          >
            {sortedWatches.map((watch) => (
              <SwiperSlide key={watch.id}>
                <article className="watch-card carousel-card">
                  <FavoriteButton
                    isFavorite={watch.isFavorite}
                    onToggle={() => handleFavoriteToggle(watch.id)}
                  />
                  <div className="carousel-card__image">
                    {watch.imageUrl && <WatchCarouselImage watch={watch} />}
                    {!watch.imageUrl && (
                      <img src="orologio_back.svg" alt={watch.name} className="watch-imageCarosel" />
                    )}
                  </div>
                  <div className="watchName_Button">
                    <h3 className="textCard">{watch.name}</h3>
                    {watch.condition_rating && (
                      <span className="watch-condition-rating">Condizione {watch.condition_rating}/10</span>
                    )}
                    <div className="cardBottoni">
                      <div className="InfoButton">
                        <button className="modify-btn" onClick={() => handleInfoWatch(watch)}>
                          Info
                        </button>
                      </div>
                      <div className="modifyButton">
                        <button className="modify-btn" onClick={() => handleModifyWatch(watch)}>
                          Modifica
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="watch-carousel-empty">
            <strong>{emptyMessage}</strong>
            {watches.length === 0 && <span>Aggiungi un orologio per iniziare il tuo carosello.</span>}
          </div>
        )
      )}
    </div>
  );
};

export default WatchList;
