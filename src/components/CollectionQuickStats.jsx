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
      year: 'numeric',
    }).format(stats.latestCreatedAt)
    : null;
  const ringCircumference = 2 * Math.PI * 25;
  const quartzProgress = watches.length ? stats.quartz / watches.length : 0;

  return (
    <section className="collection-quick-stats" aria-label="Statistiche della collezione">
      <div className="collection-quick-stats__panel">
        <div className="collection-quick-stats__latest">
          <div className="collection-quick-stats__latest-label">
            <Clock size={14} aria-hidden="true" />
            <span>{latestWatchName ? 'Ultimo aggiunto' : 'La tua collezione'}</span>
          </div>
          <strong>{latestWatchName || 'Nessun orologio aggiunto'}</strong>
          {latestDate && (
            <time dateTime={new Date(stats.latestCreatedAt).toISOString()}>
              {latestDate}
            </time>
          )}
        </div>

        <div className="collection-quick-stats__circles" aria-label="Riepilogo orologi">
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
            <svg viewBox="0 0 56 56" aria-hidden="true">
              <circle className="collection-quick-stats__ring-track" cx="28" cy="28" r="25" />
              <circle
                className="collection-quick-stats__ring-progress"
                cx="28"
                cy="28"
                r="25"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringCircumference * (1 - quartzProgress)}
              />
            </svg>
            <strong>{stats.quartz}</strong>
            <span>Qrz</span>
            <span className="collection-quick-stats__zap">
              <Zap size={12} aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollectionQuickStats;
