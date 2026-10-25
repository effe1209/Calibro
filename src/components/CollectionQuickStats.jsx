import { createElement, useMemo } from 'react';
import { BatteryCharging, Cog, ShieldCheck, Watch } from 'lucide-react';

const CollectionQuickStats = ({ watches = [] }) => {
  const stats = useMemo(() => {
    const automatic = watches.filter((watch) => watch.movement === 'Automatico').length;
    const quartz = watches.filter((watch) => watch.movement === 'Quarzo').length;
    const warranties = watches.filter((watch) => watch.has_warranty).length;
    const latestWatch = watches.reduce((latest, watch) => {
      const createdAt = Date.parse(watch.created_at || '');
      if (!Number.isFinite(createdAt)) return latest;
      return !latest || createdAt > latest.createdAt
        ? { watch, createdAt }
        : latest;
    }, null);

    return {
      automatic,
      quartz,
      warranties,
      latestWatch: latestWatch?.watch || null,
    };
  }, [watches]);

  const items = [
    { label: 'Orologi', value: watches.length, icon: Watch, progress: 1 },
    {
      label: 'Automatici',
      value: stats.automatic,
      icon: Cog,
      progress: watches.length ? stats.automatic / watches.length : 0,
    },
    {
      label: 'In garanzia',
      value: stats.warranties,
      icon: ShieldCheck,
      progress: watches.length ? stats.warranties / watches.length : 0,
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
      <div className="collection-quick-stats__panel">
        {items.map(({ label, value, icon, progress }) => (
          <article className="collection-quick-stats__item" key={label}>
            <div
              className="collection-quick-stats__circle"
              role="img"
              aria-label={`${label}: ${value}`}
            >
              <svg className="collection-quick-stats__progress" viewBox="0 0 64 64" aria-hidden="true">
                <circle className="collection-quick-stats__track" cx="32" cy="32" r="28" />
                <circle
                  className="collection-quick-stats__value"
                  cx="32"
                  cy="32"
                  r="28"
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - progress)}
                />
              </svg>
              <span className="collection-quick-stats__circle-content">
                {createElement(icon, { size: 19, strokeWidth: 1.8 })}
              </span>
            </div>
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
