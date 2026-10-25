import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from './supabaseClient';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCES_SAVED_EVENT,
  REMINDER_DAY_OPTIONS,
  normalizeNotificationPreferences,
} from './notificationPreferences';

const NotificationSettings = ({ userId, watches = [] }) => {
  const [preferences, setPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [draftPreferences, setDraftPreferences] = useState(DEFAULT_NOTIFICATION_PREFERENCES);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isCurrent = true;
    setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    setDraftPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    setErrorMessage('');

    if (!userId) {
      setIsLoading(false);
      return () => { isCurrent = false; };
    }

    setIsLoading(true);
    supabase
      .from('watch_notification_preferences')
      .select('maintenance_enabled, warranty_enabled, reminder_days_before')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isCurrent) return;
        if (error) {
          setErrorMessage('Non riesco a caricare le preferenze. Verifica di aver applicato la migrazione delle notifiche.');
          return;
        }
        const savedPreferences = normalizeNotificationPreferences(data || {});
        setPreferences(savedPreferences);
        setDraftPreferences(savedPreferences);
      })
      .catch(() => {
        if (isCurrent) setErrorMessage('Non riesco a caricare le preferenze delle notifiche.');
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => { isCurrent = false; };
  }, [userId]);

  const toggleSettings = () => {
    setDraftPreferences(preferences);
    setErrorMessage('');
    setIsOpen((open) => !open);
  };

  const savePreferences = async () => {
    if (!userId || isSaving) return;
    const normalizedPreferences = normalizeNotificationPreferences(draftPreferences);
    setIsSaving(true);
    setErrorMessage('');
    try {
      const { error } = await supabase
        .from('watch_notification_preferences')
        .upsert({
          user_id: userId,
          ...normalizedPreferences,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (error) throw error;

      setPreferences(normalizedPreferences);
      setDraftPreferences(normalizedPreferences);
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent(NOTIFICATION_PREFERENCES_SAVED_EVENT, {
        detail: { userId, preferences: normalizedPreferences },
      }));
    } catch {
      setErrorMessage('Salvataggio non riuscito. Applica la migrazione delle preferenze notifiche e riprova.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!userId) return null;

  const latestWatch = watches.reduce((latest, watch) => {
    const createdAt = Date.parse(watch.created_at || '');
    if (!Number.isFinite(createdAt)) return latest;
    return !latest || createdAt > latest.createdAt ? { watch, createdAt } : latest;
  }, null);
  const latestWatchName = latestWatch
    ? [latestWatch.watch.brand, latestWatch.watch.name]
      .filter((value) => typeof value === 'string' && value.trim())
      .join(' ')
    : null;
  const latestDate = latestWatch
    ? new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' }).format(latestWatch.createdAt)
    : null;

  return (
    <section className="notification-settings" aria-label="Impostazioni avvisi">
      <div className="notification-settings__summary">
        <div>
          <h5>Promemoria</h5>
          <p>Configura gli avvisi per revisioni e garanzie.</p>
        </div>
        <button
          className="notification-settings__toggle"
          type="button"
          onClick={toggleSettings}
          disabled={isLoading}
          aria-expanded={isOpen}
        >
          {isLoading ? 'Carico…' : isOpen ? 'Chiudi' : 'Impostazioni'}
        </button>
      </div>

      <div className="notification-settings__latest">
        <span className="notification-settings__latest-icon">
          <Clock size={16} aria-hidden="true" />
        </span>
        <div className="notification-settings__latest-copy">
          <span>{latestWatchName ? 'Ultimo aggiunto' : 'La tua collezione'}</span>
          <strong>{latestWatchName || 'Nessun orologio aggiunto'}</strong>
        </div>
        {latestDate && <time dateTime={new Date(latestWatch.createdAt).toISOString()}>{latestDate}</time>}
      </div>

      {isOpen && (
        <div className="notification-settings__panel">
          <label className="notification-settings__option">
            <input
              type="checkbox"
              checked={draftPreferences.maintenance_enabled}
              onChange={(event) => setDraftPreferences((current) => ({ ...current, maintenance_enabled: event.target.checked }))}
            />
            <span>Avvisi per le prossime revisioni</span>
          </label>
          <label className="notification-settings__option">
            <input
              type="checkbox"
              checked={draftPreferences.warranty_enabled}
              onChange={(event) => setDraftPreferences((current) => ({ ...current, warranty_enabled: event.target.checked }))}
            />
            <span>Avvisi per le garanzie in scadenza</span>
          </label>
          <label className="notification-settings__lead-time">
            <span>Avvisami con questo anticipo</span>
            <select
              value={draftPreferences.reminder_days_before}
              onChange={(event) => setDraftPreferences((current) => ({ ...current, reminder_days_before: Number(event.target.value) }))}
            >
              {REMINDER_DAY_OPTIONS.map((days) => <option key={days} value={days}>{days} giorni</option>)}
            </select>
          </label>
          {errorMessage && <p className="notification-settings__error" role="alert">{errorMessage}</p>}
          <div className="notification-settings__actions">
            <button type="button" onClick={() => {
              setDraftPreferences(preferences);
              setIsOpen(false);
              setErrorMessage('');
            }}>Annulla</button>
            <button type="button" className="notification-settings__save" onClick={savePreferences} disabled={isSaving}>
              {isSaving ? 'Salvo…' : 'Salva preferenze'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default NotificationSettings;
