import { supabase } from './supabaseClient';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  REMINDER_DAY_OPTIONS,
  normalizeNotificationPreferences,
} from './notificationPreferences';
import {
  getWatchImageUrl,
  removeWatchImage,
  uploadWatchImageBlob,
} from './imageService';

const BACKUP_FORMAT = 'calibro-collection-backup';
const BACKUP_VERSION = 3;
const OUTFIT_OCCASION_VALUES = ['all', 'casual', 'elegante', 'sportivo', 'sera'];
const WATCH_OCCASION_VALUES = OUTFIT_OCCASION_VALUES.slice(1);
const OUTFIT_COLOR_VALUES = ['all', 'black', 'silver', 'blue', 'green', 'gold', 'brown', 'orange', 'red', 'purple'];
const WATCH_FIELDS = [
  'name', 'brand', 'year', 'condition_rating', 'money', 'purchase_date', 'declared_value', 'movement', 'color', 'occasions', 'note', 'isFavorite',
  'has_box', 'has_papers', 'accessories', 'has_warranty', 'warranty_start',
  'warranty_end', 'warranty_provider',
];
const MAINTENANCE_FIELDS = [
  'service_date', 'service_type', 'description', 'cost', 'provider', 'next_service_date',
];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const readImageAsDataUrl = async (imageUrl) => {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Impossibile scaricare una foto (${response.status}).`);
  const blob = await response.blob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`;
};

const imageToBlob = (dataUrl) => {
  const match = /^data:([^;,]+)?;base64,([\s\S]+)$/.exec(dataUrl || '');
  if (!match) throw new Error('Una foto nel backup non è in un formato valido.');
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: match[1] || 'application/octet-stream' });
};

const toPlainObject = (record, keys) => Object.fromEntries(
  keys.map((key) => [key, record[key] ?? null])
);

export const createFullBackup = async (userId) => {
  const { data: watches, error: watchesError } = await supabase
    .from('watches')
    .select('*, Orologi_Caratteristiche(*, caratteristiche(*))')
    .eq('userid', userId);
  if (watchesError) throw watchesError;

  const { data: notificationData, error: notificationError } = await supabase
    .from('watch_notification_preferences')
    .select('maintenance_enabled, warranty_enabled, reminder_days_before')
    .eq('user_id', userId)
    .maybeSingle();
  if (notificationError) throw notificationError;

  const watchIds = (watches || []).map((watch) => watch.id);
  let maintenance = [];
  let outfitFeedback = [];
  if (watchIds.length > 0) {
    const { data, error } = await supabase
      .from('watch_maintenance')
      .select('backup_uid, watch_id, service_date, service_type, description, cost, provider, next_service_date')
      .eq('user_id', userId)
      .in('watch_id', watchIds);
    if (error) throw error;
    maintenance = data || [];

    const { data: feedbackData, error: feedbackError } = await supabase
      .from('watch_outfit_feedback')
      .select('watch_id, occasion, color_family, feedback')
      .eq('user_id', userId)
      .in('watch_id', watchIds);
    if (feedbackError) throw feedbackError;
    outfitFeedback = feedbackData || [];
  }

  const backupWatches = await Promise.all((watches || []).map(async (watch) => {
    if (!watch.backup_uid) throw new Error('Manca un identificativo di backup: applica prima la migrazione del database.');
    const featureEntries = watch.Orologi_Caratteristiche || [];
    const features = featureEntries
      .map((entry) => entry?.caratteristiche?.nome_caratteristica)
      .filter(Boolean);
    const imageUrl = watch.image ? await getWatchImageUrl(watch.image) : null;
    return {
      backup_uid: watch.backup_uid,
      fields: toPlainObject(watch, WATCH_FIELDS),
      features,
      image: imageUrl ? {
        dataUrl: await readImageAsDataUrl(imageUrl),
      } : null,
    };
  }));

  const watchBackupUidById = new Map((watches || []).map((watch) => [watch.id, watch.backup_uid]));
  const backupMaintenance = maintenance.map((entry) => {
    const watchBackupUid = watchBackupUidById.get(entry.watch_id);
    if (!watchBackupUid) throw new Error('Una revisione non è collegata a un orologio incluso nel backup.');
    return {
      backup_uid: entry.backup_uid,
      watch_backup_uid: watchBackupUid,
      fields: toPlainObject(entry, MAINTENANCE_FIELDS),
    };
  });
  const backupOutfitFeedback = outfitFeedback.map((entry) => {
    const watchBackupUid = watchBackupUidById.get(entry.watch_id);
    if (!watchBackupUid) throw new Error('Una preferenza outfit non è collegata a un orologio incluso nel backup.');
    return {
      watch_backup_uid: watchBackupUid,
      occasion: entry.occasion,
      color_family: entry.color_family,
      feedback: entry.feedback,
    };
  });

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    created_at: new Date().toISOString(),
    watches: backupWatches,
    maintenance: backupMaintenance,
    outfit_feedback: backupOutfitFeedback,
    notification_preferences: normalizeNotificationPreferences(notificationData || DEFAULT_NOTIFICATION_PREFERENCES),
  };
};

export const downloadFullBackup = async (userId) => {
  const backup = await createFullBackup(userId);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `calibro-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return {
    watches: backup.watches.length,
    maintenance: backup.maintenance.length,
    outfitFeedback: backup.outfit_feedback.length,
  };
};

export const parseBackupFile = async (file) => {
  let backup;
  try {
    backup = JSON.parse(await file.text());
  } catch {
    throw new Error('Il file selezionato non contiene un JSON valido.');
  }
  if (backup?.format !== BACKUP_FORMAT || ![1, 2, BACKUP_VERSION].includes(backup?.version)) {
    throw new Error('Formato o versione del backup non supportati.');
  }
  if (!Array.isArray(backup.watches) || !Array.isArray(backup.maintenance)) {
    throw new Error('Il backup non contiene gli elenchi di orologi e revisioni.');
  }
  if (backup.version === 1) backup.outfit_feedback = [];
  if (!Array.isArray(backup.outfit_feedback)) {
    throw new Error('Il backup contiene preferenze outfit non valide.');
  }
  if (backup.version >= 3) {
    const notificationPreferences = backup.notification_preferences;
    if (!notificationPreferences || typeof notificationPreferences !== 'object' || Array.isArray(notificationPreferences)) {
      throw new Error('Il backup contiene preferenze notifiche non valide.');
    }
    const reminderDays = Number(notificationPreferences.reminder_days_before);
    if (typeof notificationPreferences.maintenance_enabled !== 'boolean'
      || typeof notificationPreferences.warranty_enabled !== 'boolean'
      || !REMINDER_DAY_OPTIONS.includes(reminderDays)) {
      throw new Error('Il backup contiene preferenze notifiche non valide.');
    }
    backup.notification_preferences = normalizeNotificationPreferences(notificationPreferences);
  } else {
    backup.notification_preferences = null;
  }

  const watchUids = new Set();
  backup.watches.forEach((watch) => {
    if (!UUID_PATTERN.test(watch?.backup_uid || '') || watchUids.has(watch.backup_uid)) {
      throw new Error('Il backup contiene un orologio con identificativo mancante o duplicato.');
    }
    watchUids.add(watch.backup_uid);
    if (!watch.fields || typeof watch.fields !== 'object' || Array.isArray(watch.fields)) {
      throw new Error('Il backup contiene una scheda orologio non valida.');
    }
    if (watch.fields.occasions !== undefined
      && (!Array.isArray(watch.fields.occasions)
        || watch.fields.occasions.some((occasion) => !WATCH_OCCASION_VALUES.includes(occasion)))) {
      throw new Error('Il backup contiene occasioni d’uso non valide.');
    }
    if (watch.fields.purchase_date != null
      && !/^\d{4}-\d{2}-\d{2}$/.test(String(watch.fields.purchase_date))) {
      throw new Error('Il backup contiene una data di acquisto non valida.');
    }
    if (watch.fields.declared_value != null
      && (!Number.isFinite(Number(watch.fields.declared_value)) || Number(watch.fields.declared_value) < 0)) {
      throw new Error('Il backup contiene un valore dichiarato non valido.');
    }
    if (!Array.isArray(watch.features) || watch.features.some((name) => typeof name !== 'string')) {
      throw new Error('Il backup contiene caratteristiche non valide.');
    }
    if (watch.image && (typeof watch.image.dataUrl !== 'string' || !watch.image.dataUrl.startsWith('data:'))) {
      throw new Error('Il backup contiene una foto non valida.');
    }
  });

  const maintenanceUids = new Set();
  backup.maintenance.forEach((entry) => {
    if (!UUID_PATTERN.test(entry?.backup_uid || '') || maintenanceUids.has(entry.backup_uid)) {
      throw new Error('Il backup contiene una revisione con identificativo mancante o duplicato.');
    }
    maintenanceUids.add(entry.backup_uid);
    if (!watchUids.has(entry.watch_backup_uid)) {
      throw new Error('Una revisione fa riferimento a un orologio assente dal backup.');
    }
    if (!entry.fields || typeof entry.fields !== 'object' || Array.isArray(entry.fields)) {
      throw new Error('Il backup contiene una revisione non valida.');
    }
  });
  const outfitFeedbackKeys = new Set();
  backup.outfit_feedback.forEach((entry) => {
    if (!watchUids.has(entry?.watch_backup_uid)) {
      throw new Error('Una preferenza outfit fa riferimento a un orologio assente dal backup.');
    }
    if (!OUTFIT_OCCASION_VALUES.includes(entry.occasion)
      || !OUTFIT_COLOR_VALUES.includes(entry.color_family)
      || ![-1, 1].includes(entry.feedback)) {
      throw new Error('Il backup contiene una preferenza outfit non valida.');
    }
    const key = `${entry.watch_backup_uid}:${entry.occasion}:${entry.color_family}`;
    if (outfitFeedbackKeys.has(key)) throw new Error('Il backup ripete una preferenza outfit.');
    outfitFeedbackKeys.add(key);
  });
  return backup;
};

export const restoreFullBackup = async (backup, userId) => {
  const { data: catalog, error: catalogError } = await supabase
    .from('caratteristiche')
    .select('id_caratteristica, nome_caratteristica');
  if (catalogError) throw catalogError;
  const featureByName = new Map((catalog || []).map((feature) => [
    String(feature.nome_caratteristica || '').trim().toLocaleLowerCase('it'),
    feature.id_caratteristica,
  ]));
  const missingFeatures = [...new Set(backup.watches.flatMap((watch) => watch.features))]
    .filter((name) => !featureByName.has(name.trim().toLocaleLowerCase('it')));
  if (missingFeatures.length) {
    throw new Error(`Caratteristiche assenti in questa installazione: ${missingFeatures.join(', ')}.`);
  }

  const backupUids = backup.watches.map((watch) => watch.backup_uid);
  let previousImages = [];
  if (backupUids.length > 0) {
    const { data, error } = await supabase
      .from('watches')
      .select('backup_uid, image')
      .eq('userid', userId)
      .in('backup_uid', backupUids);
    if (error) throw error;
    previousImages = data || [];
  }

  const uploadedImages = [];
  const watchesForRestore = [];
  try {
    for (const watch of backup.watches) {
      let imagePath = null;
      if (watch.image?.dataUrl) {
        imagePath = await uploadWatchImageBlob(imageToBlob(watch.image.dataUrl), userId);
        uploadedImages.push(imagePath);
      }

      const watchFields = toPlainObject(watch.fields, WATCH_FIELDS);
      if (backup.version < 3) {
        watchFields.purchase_date = null;
        watchFields.declared_value = watchFields.money;
      }
      watchesForRestore.push({
        backup_uid: watch.backup_uid,
        fields: {
          ...watchFields,
          occasions: Array.isArray(watch.fields.occasions) ? watch.fields.occasions : [],
        },
        image: imagePath,
        feature_ids: watch.features.map((name) => featureByName.get(name.trim().toLocaleLowerCase('it'))),
      });
    }

    const { data: counts, error: restoreError } = await supabase.rpc('restore_watch_collection', {
      p_watches: watchesForRestore,
      p_maintenance: backup.maintenance,
      p_outfit_feedback: backup.outfit_feedback || [],
      p_notification_preferences: backup.notification_preferences
        ? normalizeNotificationPreferences(backup.notification_preferences)
        : null,
    });
    if (restoreError) throw restoreError;

    let cleanupWarnings = 0;
    const newImageByUid = new Map(watchesForRestore.map((watch) => [watch.backup_uid, watch.image]));
    for (const oldImage of previousImages) {
      if (!oldImage.image || oldImage.image === newImageByUid.get(oldImage.backup_uid)) continue;
      try {
        await removeWatchImage(oldImage.image);
      } catch (cleanupError) {
        cleanupWarnings += 1;
        console.error('Ripristino completato, ma una vecchia foto non è stata rimossa:', cleanupError);
      }
    }
    return { ...counts, cleanupWarnings };
  } catch (error) {
    const cleanupErrors = [];
    for (const imagePath of uploadedImages) {
      try {
        await removeWatchImage(imagePath);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
        console.error('Impossibile rimuovere una foto temporanea dopo il rollback del ripristino:', cleanupError);
      }
    }
    if (cleanupErrors.length) {
      throw new Error(`${error.message} ${cleanupErrors.length} foto temporanee non sono state rimosse automaticamente.`);
    }
    throw error;
  }
};
