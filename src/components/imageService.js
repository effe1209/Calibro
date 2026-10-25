import imageCompression from 'browser-image-compression';
import { supabase } from './supabaseClient';

export const PRIVATE_WATCH_PHOTO_BUCKET = 'watch-photos-private';
const LEGACY_WATCH_PHOTO_BUCKET = 'fotoWatch';
const SIGNED_URL_LIFETIME_SECONDS = 60 * 60 * 24;

const getStorageObject = (value) => {
  const image = String(value || '').trim();
  if (!image) return null;
  if (/^(blob:|data:)/i.test(image)) return { url: image };

  if (/^https?:\/\//i.test(image)) {
    let pathname;
    try {
      pathname = new URL(image).pathname;
    } catch {
      return { url: image };
    }

    for (const bucket of [PRIVATE_WATCH_PHOTO_BUCKET, LEGACY_WATCH_PHOTO_BUCKET]) {
      const marker = `/object/`;
      const markerIndex = pathname.indexOf(marker);
      if (markerIndex < 0) continue;
      const objectRoute = pathname.slice(markerIndex + marker.length);
      const bucketPrefix = `${bucket}/`;
      const bucketIndex = objectRoute.indexOf(bucketPrefix);
      if (bucketIndex < 0) continue;
      const encodedPath = objectRoute.slice(bucketIndex + bucketPrefix.length);
      return {
        bucket,
        path: decodeURIComponent(encodedPath),
      };
    }
    return { url: image };
  }

  const normalizedPath = image.replace(/^\/+/, '').replace(/^fotoWatch\//, '');
  return {
    bucket: normalizedPath.includes('/private/')
      ? PRIVATE_WATCH_PHOTO_BUCKET
      : LEGACY_WATCH_PHOTO_BUCKET,
    path: normalizedPath,
  };
};

const makePrivateObjectPath = (userId, fileOrBlob) => {
  const subtype = String(fileOrBlob.type || '').split('/')[1]?.split('+')[0]?.toLowerCase();
  const extension = ({ jpeg: 'jpg', 'svg+xml': 'svg', 'x-icon': 'ico' })[subtype]
    || subtype?.replace(/[^a-z0-9]/g, '')
    || 'img';
  return `${userId}/private/${crypto.randomUUID()}.${extension}`;
};

export const getWatchImageUrl = async (imageValue) => {
  const storageObject = getStorageObject(imageValue);
  if (!storageObject) return null;
  if (storageObject.url) return storageObject.url;

  if (storageObject.bucket === PRIVATE_WATCH_PHOTO_BUCKET) {
    const { data, error } = await supabase.storage
      .from(PRIVATE_WATCH_PHOTO_BUCKET)
      .createSignedUrl(storageObject.path, SIGNED_URL_LIFETIME_SECONDS);
    if (error) throw error;
    return data.signedUrl;
  }

  return supabase.storage.from(LEGACY_WATCH_PHOTO_BUCKET).getPublicUrl(storageObject.path).data.publicUrl;
};

export const removeWatchImage = async (imageValue) => {
  const storageObject = getStorageObject(imageValue);
  if (!storageObject || storageObject.url) return;

  const { error } = await supabase.storage
    .from(storageObject.bucket)
    .remove([storageObject.path]);
  if (error) throw error;
};

export const uploadWatchImageBlob = async (fileOrBlob, userId) => {
  if (!fileOrBlob || !userId) throw new Error('Impossibile caricare la foto senza un utente autenticato.');

  const path = makePrivateObjectPath(userId, fileOrBlob);
  const { data, error } = await supabase.storage
    .from(PRIVATE_WATCH_PHOTO_BUCKET)
    .upload(path, fileOrBlob, {
      cacheControl: '3600',
      contentType: fileOrBlob.type || 'application/octet-stream',
      upsert: false,
    });
  if (error) throw error;
  return data.path;
};

export const uploadWatchImage = async (file, { maxWidthOrHeight = 1200 } = {}) => {
  if (!file) return null;

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Devi aver effettuato l’accesso per caricare immagini.');

  let fileToUpload = file;
  try {
    fileToUpload = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight,
      initialQuality: 0.8,
      useWebWorker: true,
    });
  } catch (error) {
    console.warn('Compressione immagine non riuscita; provo a caricare il file originale.', error);
  }

  return uploadWatchImageBlob(fileToUpload, user.id);
};
