import imageCompression from 'browser-image-compression';

export async function getOutfitEmbedding(fileOrBlob) {
  const formData = new FormData();

  if (fileOrBlob instanceof Blob && !fileOrBlob.name) {
    formData.append('file', fileOrBlob, 'image_from_db.jpg');
  } else {
    formData.append('file', fileOrBlob);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch('https://effe02-chroneapp-server.hf.space/embed-image', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error('Il servizio di analisi non è disponibile. Riprova tra poco.');
    }

    const data = await response.json();
    if (!Array.isArray(data.vector) || data.vector.length === 0) {
      throw new Error('L’analisi non ha prodotto un risultato. Prova con un’altra foto.');
    }
    return data.vector;
  } catch (error) {
    console.error('Dettaglio errore AI:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('L’analisi sta impiegando troppo tempo. Riprova con una foto più leggera.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function getOptimizedOutfitEmbedding(file) {
  const optimizedImage = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1280,
    initialQuality: 0.82,
    useWebWorker: true,
  });
  return getOutfitEmbedding(optimizedImage);
}
