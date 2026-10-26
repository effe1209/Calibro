// watchService.js

// 1. IMPORTA LE SUE DIPENDENZE ("TOOLS")
import { supabase } from './supabaseClient';
import {
  getWatchImageUrl,
  getWatchImageUrls,
  removeWatchImage,
  uploadWatchImage,
} from './imageService';
import { isValidWatch } from './validation';

export const getUserWatches = async (userId) => {
  const [
    { data, error },
    { data: watchesWithoutEmbeddings, error: embeddingsError },
  ] = await Promise.all([
    supabase
      .from('watches')
      .select('id, name, brand, movement, year, image, color, isFavorite, money, note, has_box, has_papers, accessories, has_warranty, warranty_start, warranty_end, warranty_provider, condition_rating, occasions, purchase_date, declared_value, created_at, Orologi_Caratteristiche(*, caratteristiche(*))')
      .eq('userid', userId),
    supabase
      .from('watches')
      .select('id')
      .eq('userid', userId)
      .not('image', 'is', null)
      .neq('image', '')
      .is('embedding', null),
  ]);

  if (error) throw error;
  if (embeddingsError) throw embeddingsError;

  const watchRows = data || [];
  const imageUrls = await getWatchImageUrls(watchRows.map((watch) => watch.image));
  const watches = watchRows.map((watch, index) => ({
    ...watch,
    caratteristiche: (watch.Orologi_Caratteristiche || [])
      .map((joinEntry) => joinEntry?.caratteristiche)
      .filter(Boolean),
    imageUrl: imageUrls[index],
  }));

  return {
    watches,
    missingOutfitEmbeddingIds: (watchesWithoutEmbeddings || []).map((watch) => watch.id),
  };
};

// 2. La firma della funzione non cambia
export const addWatchService = async (options) => {
  const {
    newWatch,
    setLoading,
    setWatches,
    setNewWatch,
    setMessage,
    allFeaturesList,
  } = options;

  setLoading(true);
  let uploadedImagePath = null;
  let watchSaved = false;
  try {
    if (!isValidWatch(newWatch)) {
      setMessage('Compila tutti i campi correttamente!');
      return false;
    }

    const { features, ...watchData } = newWatch;
    uploadedImagePath = newWatch.image
      ? await uploadWatchImage(newWatch.image)
      : null;
    const { data: savedWatch, error: watchError } = await supabase.rpc('create_watch_with_features', {
      p_watch: { ...watchData, image: uploadedImagePath },
      p_features: features || [],
    });
    if (watchError) throw watchError;
    if (!savedWatch?.id) throw new Error('Il database non ha restituito l’orologio appena creato.');
    watchSaved = true;

    let imageUrl = null;
    if (savedWatch.image) {
      try {
        imageUrl = await getWatchImageUrl(savedWatch.image);
      } catch (imageError) {
        console.error('L’orologio è stato salvato, ma non è stato possibile firmare la foto:', imageError);
      }
    }

    const normalizedNewWatch = {
      ...savedWatch,
      caratteristiche: (allFeaturesList || []).filter((feature) => (
        (features || []).includes(feature.id_caratteristica)
      )),
      imageUrl,
    };
    setWatches((prevWatches) => [...prevWatches, normalizedNewWatch]);
    if (savedWatch.image && !imageUrl) {
      setMessage('Orologio aggiunto, ma la foto non è disponibile. Controlla la migrazione del bucket privato.');
    }

    setNewWatch({
      name: '',
      brand: '',
      year: '',
      condition_rating: null,
      image: '',
      movement: '',
      color: '', // O il tuo colore default
      occasions: [],
      isFavorite: false,
      money: '',
      purchase_date: null,
      declared_value: null,
      features: [],
      has_box: false,
      has_papers: false,
      accessories: '',
      has_warranty: false,
      warranty_start: null,
      warranty_end: null,
      warranty_provider: '',
      note: '',
    });
    return normalizedNewWatch;

  } catch (error) {
    let cleanupError = null;
    if (uploadedImagePath && !watchSaved) {
      try {
        await removeWatchImage(uploadedImagePath);
      } catch (imageError) {
        cleanupError = imageError;
        console.error('Non è stato possibile rimuovere la foto dopo il mancato salvataggio:', imageError);
      }
    }
    console.error("Errore durante l'inserimento:", error);
    setMessage(
      `Errore durante l'inserimento: ${error.message || 'Si è verificato un errore.'}${cleanupError ? ' La foto caricata non è stata rimossa automaticamente.' : ''}`
    );
    throw error;
  } finally {
    setLoading(false);
  }
};
