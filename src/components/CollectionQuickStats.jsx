import { useMemo } from 'react';
import { ArrowUpRight, Target, Watch } from 'lucide-react';

const CollectionQuickStats = ({ watches = [] }) => {
  const stats = useMemo(() => {
    const automatic = watches.filter((watch) => watch.movement === 'Automatico').length;
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
      warranties,
      latestWatch: latestWatch?.watch || null,
    };
  }, [watches]);

  const warrantyProgress = watches.length ? stats.warranties / watches.length : 0;
  const latestWatchName = stats.latestWatch
    ? `${stats.latestWatch.brand ? `${stats.latestWatch.brand} ` : ''}${stats.latestWatch.name}`
    : null;
  const latestWatchDescription = stats.latestWatch?.note?.trim()
    || 'Il nuovo segnatempo della tua collezione.';

  return (
    <section className="collection-quick-stats" aria-label="Statistiche della collezione">
      <div className="collection-quick-stats__panel">
        <div className="collection-quick-stats__latest">
          <div className="collection-quick-stats__latest-heading">
            <Watch size={22} strokeWidth={1.8} aria-hidden="true" />
            <span>Ultimo arrivo</span>
          </div>
          <p>
            {latestWatchName || 'La tua collezione ti aspetta'}
            {latestWatchName && (
              <span className="collection-quick-stats__latest-description">
                {latestWatchDescription}
              </span>
            )}
          </p>
        </div>

        <div className="collection-quick-stats__indicators">
          <div
            className="collection-quick-stats__auto"
            role="img"
            aria-label={`${stats.automatic} orologi automatici`}
          >
            <strong>{stats.automatic}</strong>
            <span>AUTO</span>
            <ArrowUpRight
              className="collection-quick-stats__auto-arrow"
              size={15}
              aria-hidden="true"
            />
          </div>

          <div
            className="collection-quick-stats__warranty"
            role="img"
            aria-label={`${Math.round(warrantyProgress * 100)}% degli orologi con garanzia`}
          >
            <svg className="collection-quick-stats__progress" viewBox="0 0 80 80" aria-hidden="true">
              <circle className="collection-quick-stats__track" cx="40" cy="40" r="36" />
              <circle
                className="collection-quick-stats__value"
                cx="40"
                cy="40"
                r="36"
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={2 * Math.PI * 36 * (1 - warrantyProgress)}
              />
            </svg>
            <strong>{Math.round(warrantyProgress * 100)}%</strong>
            <Target
              className="collection-quick-stats__target"
              size={17}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollectionQuickStats;
