import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const legacyBucket = 'fotoWatch';
const privateBucket = 'watch-photos-private';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Imposta SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nell’ambiente prima di avviare la migrazione.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const getLegacyPath = (image) => {
  const value = String(image || '').trim();
  const publicMarker = `/storage/v1/object/public/${legacyBucket}/`;

  if (value.includes(publicMarker)) {
    return decodeURIComponent(value.slice(value.indexOf(publicMarker) + publicMarker.length).split(/[?#]/)[0])
      .replace(/^\/+/, '');
  }
  if (/^https?:\/\//i.test(value)) return null;
  return value.replace(/^\/+/, '').replace(new RegExp(`^${legacyBucket}/`), '');
};

const extensionFor = (blob, oldPath) => {
  const subtype = String(blob.type || '').split('/')[1]?.split('+')[0]?.toLowerCase();
  const fromMime = ({ jpeg: 'jpg', 'svg+xml': 'svg', 'x-icon': 'ico' })[subtype]
    || subtype?.replace(/[^a-z0-9]/g, '');
  const filename = oldPath.split('/').pop() || '';
  const fromName = filename.includes('.') ? filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return fromMime || fromName || 'img';
};

const loadWatches = async () => {
  const watches = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('watches')
      .select('id, userid, image')
      .not('image', 'is', null)
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    watches.push(...(data || []));
    if (!data || data.length < pageSize) return watches;
  }
};

const listFolder = async (folder) => {
  const items = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.storage
      .from(legacyBucket)
      .list(folder, { limit: pageSize, offset });
    if (error) throw error;
    items.push(...(data || []));
    if (!data || data.length < pageSize) return items;
  }
};

const listUserObjects = async (folder, prefix = folder) => {
  const objects = [];
  const items = await listFolder(folder);
  for (const item of items) {
    const path = `${prefix}/${item.name}`;
    if (item.id === null) {
      objects.push(...await listUserObjects(`${folder}/${item.name}`, path));
    } else {
      objects.push(path);
    }
  }
  return objects;
};

const watches = await loadWatches();
let migrated = 0;
const cleanupFailures = [];
const referencedLegacyPaths = new Set();

for (const watch of watches) {
  const oldPath = getLegacyPath(watch.image);
  if (!oldPath) {
    console.warn(`Immagine esterna non migrata per l’orologio ${watch.id}; verifica manualmente l’URL.`);
    continue;
  }
  if (oldPath.includes('/private/')) {
    continue;
  }
  referencedLegacyPaths.add(oldPath);

  if (oldPath.split('/')[0] !== String(watch.userid)) {
    console.error(`Percorso immagine inatteso per l’orologio ${watch.id}; nessuna modifica eseguita.`);
    process.exitCode = 1;
    continue;
  }

  const { data: download, error: downloadError } = await supabase.storage
    .from(legacyBucket)
    .download(oldPath);
  if (downloadError) {
    console.error(`Download non riuscito per l’orologio ${watch.id}: ${downloadError.message}`);
    process.exitCode = 1;
    continue;
  }

  const newPath = `${watch.userid}/private/migrated-${watch.id}-${randomUUID()}.${extensionFor(download, oldPath)}`;
  const { error: uploadError } = await supabase.storage
    .from(privateBucket)
    .upload(newPath, download, {
      cacheControl: '3600',
      contentType: download.type || 'application/octet-stream',
      upsert: false,
    });
  if (uploadError) {
    console.error(`Caricamento privato non riuscito per l’orologio ${watch.id}: ${uploadError.message}`);
    process.exitCode = 1;
    continue;
  }

  const { error: updateError } = await supabase
    .from('watches')
    .update({ image: newPath })
    .eq('id', watch.id)
    .eq('userid', watch.userid);
  if (updateError) {
    const { error: cleanupError } = await supabase.storage.from(privateBucket).remove([newPath]);
    console.error(`Aggiornamento non riuscito per l’orologio ${watch.id}: ${updateError.message}`);
    if (cleanupError) {
      console.error(`Foto privata temporanea non rimossa (${newPath}): ${cleanupError.message}`);
    }
    process.exitCode = 1;
    continue;
  }

  const { error: removeError } = await supabase.storage.from(legacyBucket).remove([oldPath]);
  if (removeError) {
    cleanupFailures.push(oldPath);
    console.error(`Foto resa privata ma copia pubblica da rimuovere manualmente (${oldPath}): ${removeError.message}`);
    process.exitCode = 1;
    continue;
  }
  migrated += 1;
}

let orphanedMigrated = 0;
try {
  const rootItems = await listFolder('');
  const userFolders = rootItems.filter((item) => (
    item.id === null && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.name)
  ));
  for (const folder of userFolders) {
    for (const oldPath of await listUserObjects(folder.name)) {
      if (referencedLegacyPaths.has(oldPath)) continue;
      const { data: download, error: downloadError } = await supabase.storage
        .from(legacyBucket)
        .download(oldPath);
      if (downloadError) {
        console.error(`Download non riuscito per il file utente ${oldPath}: ${downloadError.message}`);
        process.exitCode = 1;
        continue;
      }

      const newPath = `${folder.name}/private/orphan-${randomUUID()}.${extensionFor(download, oldPath)}`;
      const { error: uploadError } = await supabase.storage
        .from(privateBucket)
        .upload(newPath, download, {
          cacheControl: '3600',
          contentType: download.type || 'application/octet-stream',
          upsert: false,
        });
      if (uploadError) {
        console.error(`Copia privata non riuscita per ${oldPath}: ${uploadError.message}`);
        process.exitCode = 1;
        continue;
      }

      const { error: removeError } = await supabase.storage.from(legacyBucket).remove([oldPath]);
      if (removeError) {
        cleanupFailures.push(oldPath);
        console.error(`Foto utente copiata privatamente ma copia pubblica da rimuovere (${oldPath}): ${removeError.message}`);
        process.exitCode = 1;
        continue;
      }
      orphanedMigrated += 1;
    }
  }
} catch (error) {
  console.error(`Scansione degli oggetti pubblici non completata: ${error.message}`);
  process.exitCode = 1;
}

console.log(`Immagini di orologi migrate: ${migrated}; oggetti utente senza scheda migrati: ${orphanedMigrated}.`);
if (cleanupFailures.length) {
  console.error(`Rimuovi queste copie rimaste nel bucket pubblico: ${cleanupFailures.join(', ')}`);
}
