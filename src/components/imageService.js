import imageCompression from 'browser-image-compression';
import { supabase } from './supabaseClient';

export const PRIVATE_WATCH_PHOTO_BUCKET = 'watch-photos-private';
const LEGACY_WATCH_PHOTO_BUCKET = 'fotoWatch';
const SIGNED_URL_LIFETIME_SECONDS = 60 * 60 * 24;
const WATCH_THUMBNAIL_TRANSFORM = {
  width: 480,
  height: 480,
  resize: 'contain',
  quality: 72,
};

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

export const getWatchImageUrls = async (imageValues) => {
  const storageObjects = imageValues.map(getStorageObject);
  const privatePaths = [...new Set(storageObjects
    .filter((storageObject) => storageObject?.bucket === PRIVATE_WATCH_PHOTO_BUCKET)
    .map((storageObject) => storageObject.path))];
  const signedUrlsByPath = new Map();

  if (privatePaths.length > 0) {
    const privateBucket = supabase.storage.from(PRIVATE_WATCH_PHOTO_BUCKET);
    for (let offset = 0; offset < privatePaths.length; offset += 100) {
      const pathBatch = privatePaths.slice(offset, offset + 100);
      const { data, error } = await privateBucket.createSignedUrls(
        pathBatch,
        SIGNED_URL_LIFETIME_SECONDS
      );
      if (error) throw error;

      data.forEach(({ error: signingError, path, signedUrl }) => {
        if (signingError || !path || !signedUrl) {
          throw new Error(signingError || `Impossibile firmare la foto ${path || 'richiesta'}.`);
        }
        signedUrlsByPath.set(path, signedUrl);
      });
    }
  }

  return storageObjects.map((storageObject) => {
    if (!storageObject) return null;
    if (storageObject.url) return storageObject.url;
    if (storageObject.bucket === PRIVATE_WATCH_PHOTO_BUCKET) {
      const signedUrl = signedUrlsByPath.get(storageObject.path);
      if (!signedUrl) throw new Error(`URL firmato non restituito per la foto ${storageObject.path}.`);
      return signedUrl;
    }
    return supabase.storage.from(LEGACY_WATCH_PHOTO_BUCKET).getPublicUrl(storageObject.path).data.publicUrl;
  });
};

export const getWatchImageUrl = async (imageValue) => {
  const [imageUrl] = await getWatchImageUrls([imageValue]);
  return imageUrl;
};

export const getWatchThumbnailUrl = async (imageValue) => {
  const storageObject = getStorageObject(imageValue);
  if (!storageObject) return null;
  if (storageObject.url) return storageObject.url;

  if (storageObject.bucket === PRIVATE_WATCH_PHOTO_BUCKET) {
    if (/\.svg$/i.test(storageObject.path)) {
      return getWatchImageUrl(imageValue);
    }

    const { data, error } = await supabase.storage
      .from(PRIVATE_WATCH_PHOTO_BUCKET)
      .createSignedUrl(storageObject.path, SIGNED_URL_LIFETIME_SECONDS, {
        transform: WATCH_THUMBNAIL_TRANSFORM,
      });
    if (error) throw error;
    return data.signedUrl;
  }

  return supabase.storage
    .from(LEGACY_WATCH_PHOTO_BUCKET)
    .getPublicUrl(storageObject.path, { transform: WATCH_THUMBNAIL_TRANSFORM })
    .data.publicUrl;
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
