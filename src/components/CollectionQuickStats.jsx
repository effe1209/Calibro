import { createElement, useMemo } from 'react';
import { BatteryCharging, Cog, Watch } from 'lucide-react';

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
    { label: 'Orologi', value: watches.length, icon: Watch, progress: watches.length ? 1 : 0 },
    {
      label: 'Automatici',
      value: stats.automatic,
      icon: Cog,
      progress: watches.length ? stats.automatic / watches.length : 0,
    },
    {
      label: 'Quarzi',
      value: stats.quartz,
      icon: BatteryCharging,
      progress: watches.length ? stats.quartz / watches.length : 0,
    },
  ];

  return (
    <section className="collection-quick-stats" aria-label="Statistiche della collezione">
      <div className="collection-quick-stats__grid">
        {items.map(({ label, value, icon, progress }) => (
          <article className="collection-quick-stats__item" key={label}>
            <span
              className="collection-quick-stats__ring"
              style={{ '--stat-progress': `${progress * 360}deg` }}
              aria-hidden="true"
            >
              {createElement(icon, { size: 21, strokeWidth: 1.8 })}
            </span>
            <strong>{value}</strong>
            <span className="collection-quick-stats__label">{label}</span>
          </article>
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
