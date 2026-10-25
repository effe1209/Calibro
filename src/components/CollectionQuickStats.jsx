import { useMemo } from 'react';
import { Clock, Zap } from 'lucide-react';

const CollectionQuickStats = ({ watches = [] }) => {
  const stats = useMemo(() => {
    const latest = watches.reduce((currentLatest, watch) => {
      const createdAt = Date.parse(watch.created_at || '');
      if (!Number.isFinite(createdAt)) return currentLatest;
      return !currentLatest || createdAt > currentLatest.createdAt
        ? { watch, createdAt }
        : currentLatest;
    }, null);

    return {
      automatic: watches.filter((watch) => watch.movement === 'Automatico').length,
      quartz: watches.filter((watch) => watch.movement === 'Quarzo').length,
      latestWatch: latest?.watch || null,
      latestCreatedAt: latest?.createdAt || null,
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
    }).format(stats.latestCreatedAt)
    : null;
  return (
    <section className="collection-quick-stats" aria-label="Statistiche della collezione">
      <div className="collection-quick-stats__stack">
        <div className="collection-quick-stats__panel" aria-label="Statistiche della collezione">
          <div
            className="collection-quick-stats__circle collection-quick-stats__circle--total"
            role="img"
            aria-label={`${watches.length} orologi in totale`}
          >
            <strong>{watches.length}</strong>
            <span>Tot</span>
          </div>

          <div
            className="collection-quick-stats__circle collection-quick-stats__circle--automatic"
            role="img"
            aria-label={`${stats.automatic} orologi automatici`}
          >
            <strong>{stats.automatic}</strong>
            <span>Auto</span>
          </div>

          <div
            className="collection-quick-stats__circle collection-quick-stats__circle--quartz"
            role="img"
            aria-label={`${stats.quartz} orologi al quarzo`}
          >
            <strong>{stats.quartz}</strong>
            <span>Qrz</span>
            <span className="collection-quick-stats__zap">
              <Zap size={14} aria-hidden="true" />
            </span>
          </div>
        </div>

        <div className="collection-quick-stats__latest-card">
          <div className="collection-quick-stats__latest-info">
            <span className="collection-quick-stats__clock">
              <Clock size={16} aria-hidden="true" />
            </span>
            <div className="collection-quick-stats__latest">
              <span>{latestWatchName ? 'Ultimo aggiunto' : 'La tua collezione'}</span>
              <strong>{latestWatchName || 'Nessun orologio aggiunto'}</strong>
            </div>
          </div>
          {latestDate && (
            <time dateTime={new Date(stats.latestCreatedAt).toISOString()}>
              {latestDate}
            </time>
          )}
        </div>
      </div>
    </section>
  );
};

export default CollectionQuickStats;
