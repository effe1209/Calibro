import { useMemo } from 'react';

const CollectionQuickStats = ({ watches = [] }) => {
  const stats = useMemo(() => {
    const automatic = watches.filter((watch) => watch.movement === 'Automatico').length;
    const quartz = watches.filter((watch) => watch.movement === 'Quarzo').length;
    const latestWatch = watches.reduce((latest, watch) => {
      const createdAt = Date.parse(watch.created_at || '');
      if (!Number.isFinite(createdAt)) return latest;
      return !latest || createdAt > latest.createdAt
        ? { watch, createdAt }
        : latest;
    }, null);

    return { automatic, quartz, latestWatch: latestWatch?.watch || null };
  }, [watches]);

  const items = [
    { label: 'Orologi', value: watches.length },
    { label: 'Automatici', value: stats.automatic },
    { label: 'Quarzi', value: stats.quartz },
  ];

  return (
    <section className="collection-quick-stats" aria-label="Statistiche della collezione">
      <div className="collection-quick-stats__grid">
        {items.map(({ label, value }) => (
          <div className="collection-quick-stats__item" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className="collection-quick-stats__latest">
        {stats.latestWatch
          ? <>Ultimo arrivo: <strong>{stats.latestWatch.brand ? `${stats.latestWatch.brand} ` : ''}{stats.latestWatch.name}</strong></>
          : 'Aggiungi il tuo primo orologio'}
      </p>
    </section>
  );
};

export default CollectionQuickStats;
