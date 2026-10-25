import { useMemo } from 'react';
import { Zap } from 'lucide-react';

const CollectionQuickStats = ({ watches = [] }) => {
  const stats = useMemo(() => {
    return {
      automatic: watches.filter((watch) => watch.movement === 'Automatico').length,
      quartz: watches.filter((watch) => watch.movement === 'Quarzo').length,
    };
  }, [watches]);

  const ringCircumference = 2 * Math.PI * 28;
  const quartzProgress = watches.length ? stats.quartz / watches.length : 0;

  return (
    <section className="collection-quick-stats" aria-label="Statistiche della collezione">
      <div className="collection-quick-stats__panel">
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
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle className="collection-quick-stats__ring-track" cx="32" cy="32" r="28" />
            <circle
              className="collection-quick-stats__ring-progress"
              cx="32"
              cy="32"
              r="28"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringCircumference * (1 - quartzProgress)}
            />
          </svg>
          <strong>{stats.quartz}</strong>
          <span>Qrz</span>
          <span className="collection-quick-stats__zap">
            <Zap size={14} aria-hidden="true" />
          </span>
        </div>
      </div>
    </section>
  );
};

export default CollectionQuickStats;
