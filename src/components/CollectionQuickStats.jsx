import { useMemo } from 'react';
import { BatteryCharging, Cog, Watch } from 'lucide-react';

const CollectionQuickStats = ({ watches = [] }) => {
  const stats = useMemo(() => {
    const latestWatch = watches.reduce((latest, watch) => {
      const createdAt = Date.parse(watch.created_at || '');
      if (!Number.isFinite(createdAt)) return latest;
      return !latest || createdAt > latest.createdAt
        ? { watch, createdAt }
        : latest;
    }, null);

    return {
      automatic: watches.filter((watch) => watch.movement === 'Automatico').length,
      quartz: watches.filter((watch) => watch.movement === 'Quarzo').length,
      latestWatch: latestWatch?.watch || null,
      latestCreatedAt: latestWatch?.createdAt || null,
    };
  }, [watches]);

  const latestWatchName = stats.latestWatch
    ? [stats.latestWatch.brand, stats.latestWatch.name]
      .filter((value) => typeof value === 'string' && value.trim())
      .join(' ')
    : null;

  const latestDate = stats.latestCreatedAt
    ? new Intl.DateTimeFormat('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(stats.latestCreatedAt)
    : null;

  return (
    <section className="collection-quick-stats" aria-label="Statistiche della collezione">
      <div className="collection-quick-stats__panel">
        <div className="collection-quick-stats__heading">
          <Watch size={19} strokeWidth={1.8} aria-hidden="true" />
          <h2>La tua collezione</h2>
        </div>

        <div className="collection-quick-stats__metrics">
          <article className="collection-quick-stats__metric collection-quick-stats__metric--total">
            <strong>{watches.length}</strong>
            <span>Orologi</span>
          </article>
          <article className="collection-quick-stats__metric">
            <Cog size={17} strokeWidth={1.8} aria-hidden="true" />
            <strong>{stats.automatic}</strong>
            <span>Automatici</span>
          </article>
          <article className="collection-quick-stats__metric">
            <BatteryCharging size={17} strokeWidth={1.8} aria-hidden="true" />
            <strong>{stats.quartz}</strong>
            <span>Al quarzo</span>
          </article>
        </div>

        <div className="collection-quick-stats__latest">
          <span>{latestWatchName ? 'Ultimo aggiunto' : 'Inizia la tua collezione'}</span>
          <strong>{latestWatchName || 'Aggiungi il tuo primo orologio'}</strong>
          {latestDate && <time dateTime={new Date(stats.latestCreatedAt).toISOString()}>{latestDate}</time>}
        </div>
      </div>
    </section>
  );
};

export default CollectionQuickStats;
