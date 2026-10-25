import React, { lazy, Suspense, useState, useEffect, useRef, useTransition, useMemo, useCallback } from "react";
import { createPortal } from 'react-dom';
import imageCompression from 'browser-image-compression';
// Import Supabase e servizi (invariati)
import { supabase } from './components/supabaseClient';
import { addWatchService } from './components/watchService';
import {
  getWatchImageUrl,
  getWatchImageUrls,
  removeWatchImage,
  uploadWatchImage,
} from './components/imageService';
import { downloadFullBackup, parseBackupFile, restoreFullBackup } from './components/backupService';
import AuthForm from './components/AuthForm';
import GlassSurface from './components/GlassSurface';
import TiltedCard from './components/TiltedCard';
import { SpeedInsights } from "@vercel/speed-insights/react";
import LogoLoop from './components/LogoLoop';

// Importa i componenti dock e le icone VSC
import Dock from './components/Dock'; 
// *** FIX IMPORT DELLE ICONE VSC ***
import { VscHome, VscArchive, VscAccount, VscSettingsGear } from 'react-icons/vsc';


// Import dei nuovi componenti creati
import UserProfile from './components/UserProfile';
import NotificationSettings from './components/NotificationSettings';
import DarkModeSwitch from './components/DarkModeSwitch';
import WatchList from './components/WatchList';
import CollectionQuickStats from './components/CollectionQuickStats';
import AddWatchForm from './components/AddWatchForm';
import FunctionsSection from './components/FunctionsSection';
import DayWatchModal from './components/DayWatchModal';
import OutfitModal from './components/OutfitModal';
import ModifyWatchModal from './components/ModifyWatchModal';
import InfoWatchModal from './components/InfoWatchModal';
import { matchesOutfitFilters } from './components/outfitPreferences';

// Stili (invariati)
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import "./App.css";

const FloatingLines = lazy(() => import('./components/FloatingLines'));
const InfiniteGridModal = lazy(() => import('./components/InfiniteGridModal'));
const StatsModal = lazy(() => import('./components/StatsModal'));

function App() {
  // --- STATO (Resta qui) ---
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedWatch, setSelectedWatch] = useState(null);
  const modifyBackHandlerRef = useRef(null);
  const watchFetchRequestRef = useRef(0);
  const fileInputRef = useRef(null);
  const fileInputRefOutfit = useRef(null);
  const backupInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [watches, setWatches] = useState([]);
  const [missingOutfitEmbeddingIds, setMissingOutfitEmbeddingIds] = useState([]);
  const missingOutfitEmbeddingCount = missingOutfitEmbeddingIds.length;
  const [maintenanceRefreshKey, setMaintenanceRefreshKey] = useState(0);
  const [watchConsigliati, setWatchConsigliati] = useState([]);
  const [outfitOccasion, setOutfitOccasion] = useState('all');
  const [outfitColorFamily, setOutfitColorFamily] = useState('all');
  const [outfitFiltersRelaxed, setOutfitFiltersRelaxed] = useState(false);
  const [outfitFeedbackByWatch, setOutfitFeedbackByWatch] = useState({});
  const [outfitFeedbackMessage, setOutfitFeedbackMessage] = useState('');
  const [isRebuildingOutfit, setIsRebuildingOutfit] = useState(false);
  const [outfitRebuildProgress, setOutfitRebuildProgress] = useState('');
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresError, setFeaturesError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const addWatchSectionRef = useRef(null);
  const [newWatch, setNewWatch] = useState({
    name: "",
    brand: "",
    year: "",
    condition_rating: null,
    image: "",
    movement: "",
    color: "",
    occasions: [],
    isFavorite: false,
    money: null,
    purchase_date: null,
    declared_value: null,
    features: [],
    note: "",
    has_box: false,
    has_papers: false,
    accessories: '',
    has_warranty: false,
    warranty_start: null,
    warranty_end: null,
    warranty_provider: '',
  });
  const [loading, setLoading] = useState(false);
  const [isStatisticheVisible, setIsStatisticheVisible] = useState(false);
  const [isDetailsMenuOpen, setIsDetailsMenuOpen] = useState(false);
  const [isInfoVisible, setIsInfoVisible] = useState(false);
  const [isModifyVisible, setIsModifyVisible] = useState(false);
  const [modifyWatch, setModifyWatch] = useState(null);
  const [modifyWatchBaseline, setModifyWatchBaseline] = useState(null);
  const [isBackupBusy, setIsBackupBusy] = useState(false);
  const [allFeaturesList, setAllFeaturesList] = useState([]);
  const [, startTransition] = useTransition();
  const [modalTitle, setModalTitle] = useState(""); 
  const [isCarouselVisible, setIsCarouselVisible] = useState(false);
  const [isInfiniteGridVisible, setIsInfiniteGridVisible] = useState(false);

  const registerModifyBackHandler = useCallback((handler) => {
    modifyBackHandlerRef.current = handler;
  }, []);

  const handleBackGesture = useCallback(() => {
    if (loading) return;

    if (isInfiniteGridVisible) {
      setIsInfiniteGridVisible(false);
    } else if (isStatisticheVisible) {
      setIsStatisticheVisible(false);
    } else if (isInfoVisible) {
      setIsInfoVisible(false);
    } else if (isModifyVisible) {
      modifyBackHandlerRef.current?.();
    } else if (isModalVisible) {
      setIsModalVisible(false);
    } else if (isCarouselVisible) {
      setIsCarouselVisible(false);
      if (fileInputRefOutfit.current) fileInputRefOutfit.current.value = "";
      setWatchConsigliati([]);
    } else if (isDetailsMenuOpen) {
      setIsDetailsMenuOpen(false);
    } else if (showForm) {
      setShowForm(false);
    }
  }, [
    isInfiniteGridVisible,
    isStatisticheVisible,
    isInfoVisible,
    isModifyVisible,
    isModalVisible,
    isCarouselVisible,
    isDetailsMenuOpen,
    showForm,
    loading,
  ]);

  useEffect(() => {
    let touchStart = null;

    const handleTouchStart = (event) => {
      if (event.touches.length !== 1) {
        touchStart = null;
        return;
      }

      const touch = event.touches[0];
      touchStart = touch.clientX <= 24
        ? { x: touch.clientX, y: touch.clientY }
        : null;
    };

    const handleTouchEnd = (event) => {
      if (!touchStart || event.changedTouches.length !== 1) {
        touchStart = null;
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = Math.abs(touch.clientY - touchStart.y);
      touchStart = null;

      if (deltaX >= 80 && deltaX > deltaY * 1.4) handleBackGesture();
    };

    const clearTouchStart = () => {
      touchStart = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    window.addEventListener('touchend', handleTouchEnd, { capture: true, passive: true });
    window.addEventListener('touchcancel', clearTouchStart, { capture: true, passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart, true);
      window.removeEventListener('touchend', handleTouchEnd, true);
      window.removeEventListener('touchcancel', clearTouchStart, true);
    };
  }, [handleBackGesture]);

  const toggleAddWatchForm = () => setShowForm((isVisible) => !isVisible);

  useEffect(() => {
    if (!showForm) return undefined;

    const scrollFrame = window.requestAnimationFrame(() => {
      addWatchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(scrollFrame);
  }, [showForm]);

  // --- NUOVO: Stato per tracciare la sezione attiva nel Dock ---
  const [activeSection, setActiveSection] = useState('Home'); 

  // --- NUOVO: Configurazione Elementi del Dock ---
  // Definiamo qui gli items per poter passare la funzione di scroll specifica
  const items = [
    { icon: <VscHome size={18} />, label: 'Home', onClick: () => scrollToSection('home-section') },
    { icon: <VscAccount size={18} />, label: 'Profile', onClick: () => scrollToSection('profile-section') },
    { icon: <VscSettingsGear size={18} />, label: 'Functions', onClick: () => scrollToSection('function-section') },
    { icon: <VscArchive size={18} />, label: 'Watches', onClick: () => scrollToSection('watch-list-section') },
  ];

  // --- NUOVO: Helper per lo Scroll Fluido ---
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const labelMap = {
        'home-section': 'Home',
        'watch-list-section': 'Watches',
        'profile-section': 'Profile',
        'function-section': 'Functions'
      };
      setActiveSection(labelMap[id]);
    }
  };

  useEffect(() => {
    if (!user) return;

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id === 'home-section') setActiveSection('Home');
          if (id === 'profile-section') setActiveSection('Profile');
          if (id === 'function-section') setActiveSection('Functions');
          if (id === 'watch-list-section') setActiveSection('Watches');
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', 
      threshold: 0
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    const sections = ['home-section', 'profile-section', 'function-section', 'watch-list-section'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [user]);


  // Effetti di scroll e anchor link
  useEffect(() => {
    const anchors = document.querySelectorAll('a[href^="#"]');
    const handleClick = (e) => {
      e.preventDefault();
      const target = document.querySelector(e.currentTarget.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    };
    anchors.forEach(anchor => anchor.addEventListener("click", handleClick));

    return () => {
      anchors.forEach(anchor => anchor.removeEventListener("click", handleClick));
    };
  }, []);

  // Test connessione, fetch utente e caricamento email/nickname
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setEmail(session.user.email || '');
        fetchWatches(session.user.id); 
      }
    };
    
    fetchUser();

    const savedNickname = localStorage.getItem('nickname');
    if (savedNickname) setNickname(savedNickname);
  }, []);

  // Salva nickname
  useEffect(() => {
    if(nickname) {
      localStorage.setItem("nickname", nickname);
    }
  }, [nickname]);

  // Le policy del database possono richiedere una sessione: carica le
  // caratteristiche quando l'utente è autenticato e aggiorna gli stati in modo esplicito.
  useEffect(() => {
    let isCurrentRequest = true;

    if (!user?.id) {
      setAllFeaturesList([]);
      setFeaturesError('');
      setFeaturesLoading(false);
      return () => { isCurrentRequest = false; };
    }

    const loadFeatures = async () => {
      setFeaturesLoading(true);
      setFeaturesError('');

      try {
        const { data, error } = await supabase.from('caratteristiche').select('*');
        if (error) throw error;
        if (isCurrentRequest) setAllFeaturesList(data ?? []);
      } catch (error) {
        console.error("ERRORE NEL CARICARE LE CARATTERISTICHE:", error.message);
        if (isCurrentRequest) {
          setAllFeaturesList([]);
          setFeaturesError(error.message || "Errore nel recupero delle caratteristiche.");
        }
      } finally {
        if (isCurrentRequest) setFeaturesLoading(false);
      }
    };

    loadFeatures();
    return () => { isCurrentRequest = false; };
  }, [user?.id]);

  // --- LOGICA DATI E AUTH (Invariata) ---

  const handleRegister = async () => {
    setLoading(true);
    try {
      if (!email || !password) {
        setMessage("Email e password sono obbligatori.");
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: nickname.trim() } },
      });
      if (error) throw error;
      if (data.session && data.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({ id: data.user.id, username: nickname.trim() }, { onConflict: 'id' });
        if (profileError) throw profileError;
      }

      setMessage("Registrazione avvenuta con successo! Controlla la tua email per confermare l'account.");
    } catch (error) {
      setMessage("Errore: " + (error.message || "Si è verificato un errore."));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('invalid_credentials')) {
          setMessage('Credenziali non valide. Controlla email e password.');
        } else {
          setMessage('Errore nel login. ' + error.message);
        }
        throw error;
      }

      if (data.user) {
        setUser(data.user);
        setEmail(data.user.email || '');
        setPassword('');
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('id', data.user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error("Errore nel recupero del nome utente:", profileError);
        } else {
          const username = userProfile?.username || data.user.user_metadata?.username || '';
          setNickname(username);
          if (!userProfile && username) {
            const { error: profileInsertError } = await supabase
              .from('user_profiles')
              .upsert({ id: data.user.id, username }, { onConflict: 'id' });
            if (profileInsertError) {
              console.error("Errore nel salvataggio del nome utente:", profileInsertError);
            }
          }
        }
        
        setMessage("Accesso effettuato con successo!");
        fetchWatches(data.user.id);
      } else {
        setMessage("Accesso non riuscito: Nessun utente trovato.");
      }
    } catch (error) {
      console.error("Errore durante il login:", error);
    } finally {
      setLoading(false);
    }
  }; 

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      watchFetchRequestRef.current += 1;
      setUser(null);
      setWatches([]);
      setMissingOutfitEmbeddingIds([]);
      setEmail('');
      setPassword('');
      setNickname('');
      let storageWarning = false;
      try {
        localStorage.removeItem('email');
        localStorage.removeItem('nickname');
      } catch (storageError) {
        storageWarning = true;
        console.error('Sessione chiusa, ma non è stato possibile cancellare i dati locali:', storageError);
      }
      setMessage(storageWarning
        ? 'Disconnessione effettuata, ma non è stato possibile cancellare i dati salvati nel browser.'
        : 'Disconnessione effettuata su questo dispositivo.');
    } catch (error) {
      console.error('Errore durante la disconnessione:', error);
      setMessage(`Disconnessione non riuscita: ${error.message || 'riprova.'}`);
    }
  };

const handleAddWatch = async () => {
  const stateOptions = {
    newWatch,
    user,
    setLoading,
    setWatches,
    setNewWatch,
    setMessage, 
    allFeaturesList,
  };

  try {
    const added = await addWatchService(stateOptions);
    if (!added) return;

    let outfitEmbeddingWarning = false;
    if (newWatch.image instanceof File && added.id) {
      setLoading(true);
      setMessage('Orologio salvato. Lo preparo anche per gli abbinamenti outfit…');
      try {
        const embedding = await getOptimizedOutfitEmbedding(newWatch.image);
        const { error: embeddingError } = await supabase
          .from('watches')
          .update({ embedding })
          .eq('id', added.id);
        if (embeddingError) throw embeddingError;
      } catch (error) {
        console.error('Impossibile preparare l’orologio per gli abbinamenti outfit:', error);
        outfitEmbeddingWarning = true;
      } finally {
        setLoading(false);
      }
    }

    setMessage(outfitEmbeddingWarning
      ? 'Orologio aggiunto. Non è stato possibile includerlo negli abbinamenti outfit: riprova più tardi.'
      : 'Orologio aggiunto con successo!');
    handleCancel();
    await fetchWatches(user.id);
  } catch (error) {
    console.error("Errore (da addWatchService):", error);
    setMessage(error.message || "Errore durante l'aggiunta dell'orologio.");
    setLoading(false);
  }
};

  const uploadImage = async (file) => {
    if (!file) return null;

    try {
      return await uploadWatchImage(file, { maxWidthOrHeight: 1920 });
    } catch (error) {
      console.error("Errore durante la compressione o l'upload:", error);
      setMessage("Errore durante il caricamento dell'immagine: " + error.message);
      throw error;
    }
  };

  const deleteImage = async (imagePath) => removeWatchImage(imagePath);

  const handleDeleteWatch = async (id, imagePath) => {
    const isConfirmed = window.confirm("Sei sicuro di voler eliminare questo orologio?");
    if (!isConfirmed) return false;
    try {
      const { error } = await supabase.from("watches").delete().eq("id", id);
      if (error) throw error;
      watchFetchRequestRef.current += 1;
      setWatches(prevWatches => prevWatches.filter(watch => watch.id !== id));
      setMissingOutfitEmbeddingIds((currentIds) => (
        currentIds.filter((missingId) => String(missingId) !== String(id))
      ));
      let cleanupWarning = false;
      if (imagePath) {
        try {
          await deleteImage(imagePath);
        } catch (imageError) {
          cleanupWarning = true;
          console.error("Orologio eliminato, ma la foto non è stata rimossa:", imageError);
        }
      }
      setMessage(cleanupWarning
        ? "Orologio eliminato, ma non è stato possibile rimuovere la foto dal deposito."
        : "Orologio eliminato con successo!");
      return true;
    } catch (error) {
      setMessage("Errore durante l'eliminazione: " + error.message);
      return false;
    }
  };

const fetchWatches = async (userid) => {
  const requestId = ++watchFetchRequestRef.current;
  try {
    const [
      { data, error },
      { data: watchesWithoutEmbeddings, error: embeddingsError },
    ] = await Promise.all([
      supabase
        .from("watches")
        .select("id, name, brand, movement, year, image, color, isFavorite, money, note, has_box, has_papers, accessories, has_warranty, warranty_start, warranty_end, warranty_provider, condition_rating, occasions, purchase_date, declared_value, created_at, Orologi_Caratteristiche(*, caratteristiche(*))")
        .eq("userid", userid),
      supabase
        .from("watches")
        .select("id")
        .eq("userid", userid)
        .not("image", "is", null)
        .neq("image", "")
        .is("embedding", null),
    ]);
    if (error) throw error;
    if (embeddingsError) throw embeddingsError;
    if (requestId !== watchFetchRequestRef.current) return false;

    const watchRows = data || [];
    const imageUrls = await getWatchImageUrls(watchRows.map((watch) => watch.image));
    if (requestId !== watchFetchRequestRef.current) return false;

    const userWatches = watchRows.map((watch, index) => {
      const features = (watch.Orologi_Caratteristiche || [])
        .map((joinEntry) => joinEntry?.caratteristiche)
        .filter(Boolean);
      return {
        ...watch,
        caratteristiche: features,
        imageUrl: imageUrls[index],
      };
    });
    setWatches(userWatches);
    setMissingOutfitEmbeddingIds((watchesWithoutEmbeddings || []).map((watch) => watch.id));
    return true;
  } catch (error) {
    if (requestId === watchFetchRequestRef.current) {
      setMessage("Errore durante il recupero degli orologi: " + error.message);
    }
    return false;
  }
};

  const handleCreateBackup = async () => {
    if (!user || isBackupBusy) return;
    setIsBackupBusy(true);
    setMessage('Preparazione del backup completo…');
    try {
      const counts = await downloadFullBackup(user.id);
      setMessage(`Backup scaricato: ${counts.watches} orologi, ${counts.maintenance} revisioni, preferenze outfit e avvisi, immagini incluse.`);
    } catch (error) {
      console.error('Errore durante la creazione del backup:', error);
      setMessage(`Backup non riuscito: ${error.message}`);
    } finally {
      setIsBackupBusy(false);
    }
  };

  const handleRestoreBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user || isBackupBusy) return;
    setIsBackupBusy(true);
    setMessage('Controllo del backup…');
    try {
      const backup = await parseBackupFile(file);
      const photos = backup.watches.filter((watch) => watch.image?.dataUrl).length;
      const shouldRestore = window.confirm(
        `Il backup contiene ${backup.watches.length} orologi, ${backup.maintenance.length} revisioni, ${backup.outfit_feedback.length} preferenze outfit, ${backup.notification_preferences ? 'preferenze notifiche' : 'nessuna preferenza notifiche'} e ${photos} immagini.\n\n` +
        'I dati saranno uniti alla collezione: gli orologi e le revisioni con lo stesso identificativo di backup verranno aggiornati; gli altri dati presenti resteranno invariati. Continuare?'
      );
      if (!shouldRestore) {
        setMessage('Ripristino annullato.');
        return;
      }

      const counts = await restoreFullBackup(backup, user.id);
      const refreshed = await fetchWatches(user.id);
      if (!refreshed) throw new Error('Dati ripristinati, ma la lista non si è aggiornata. Ricarica la pagina.');
      setMessage(
        `Ripristino completato: ${counts.watches} orologi, ${counts.maintenance} revisioni, ${counts.outfitFeedback} preferenze outfit${counts.notificationPreferences ? ' e preferenze notifiche' : ''} uniti alla collezione.`
        + (counts.cleanupWarnings ? ` Non è stato possibile rimuovere ${counts.cleanupWarnings} vecchie foto dal deposito.` : '')
      );
    } catch (error) {
      console.error('Errore durante il ripristino del backup:', error);
      setMessage(`Ripristino non riuscito: ${error.message} Le modifiche al database sono transazionali; se non sai se l’operazione è stata completata, importare di nuovo lo stesso backup è sicuro.`);
    } finally {
      event.target.value = '';
      setIsBackupBusy(false);
    }
  };

  const handleCancel = () => {
   setNewWatch({ 
      name: "", brand: "", year: "", image: "", movement: "", color: "",
      occasions: [],
      condition_rating: null,
      features: [], isFavorite: false, money: null, purchase_date: null, declared_value: null, note: "",
      has_box: false, has_papers: false, accessories: '', has_warranty: false,
      warranty_start: null, warranty_end: null, warranty_provider: '',
    });
    setMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsDetailsMenuOpen(false);
    setShowForm(false);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewWatch((prev) => ({ ...prev, image: file }));
    }
  };
  
  const handleDayWatch = async () => {
    try {
      if (watches && watches.length > 0) {
        const randomIndex = Math.floor(Math.random() * watches.length);
        const randomWatch = watches[randomIndex];
        setSelectedWatch(randomWatch);
        setModalTitle("Orologio del Giorno");
        setIsModalVisible(true);
      } else {
        setMessage('Nessun orologio trovato per selezionarne uno casuale.');
      }
    } catch (error) {
      console.error('Errore nel selezionare l\'orologio:', error.message);
    }
  };

  const collectionTotals = useMemo(() => {
    if (!watches || watches.length === 0) return { purchaseSpend: 0, declaredValue: 0 };
    return watches.reduce((totals, watch) => {
      const purchasePrice = Number(watch.money);
      const declaredValue = Number(watch.declared_value);
      if (watch.money !== null && watch.money !== undefined && watch.money !== '' && Number.isFinite(purchasePrice)) {
        totals.purchaseSpend += purchasePrice;
      }
      if (watch.declared_value !== null && watch.declared_value !== undefined && watch.declared_value !== '' && Number.isFinite(declaredValue)) {
        totals.declaredValue += declaredValue;
      }
      return totals;
    }, { purchaseSpend: 0, declaredValue: 0 });
  }, [watches]);

  const handleModifyWatch = async (watchToModify) => {
    const featureIDs = (watchToModify.caratteristiche || []).map(
      (feature) => feature.id_caratteristica
    );
    let imageUrl = null;
    try {
      imageUrl = await getWatchImageUrl(watchToModify.image || watchToModify.imageUrl);
    } catch (error) {
      console.error('Impossibile aprire la foto dell’orologio:', error);
      setMessage(`Impossibile caricare la foto: ${error.message}`);
    }

    const nextUpdatedWatch = {
      name: watchToModify.name,
      brand: watchToModify.brand,
      year: watchToModify.year,
      condition_rating: watchToModify.condition_rating ?? null,
      movement: watchToModify.movement,
      color: watchToModify.color || '',
      occasions: Array.isArray(watchToModify.occasions) ? watchToModify.occasions : [],
      image: watchToModify.image || watchToModify.imageUrl || '',
      imageUrl,
      isFavorite: watchToModify.isFavorite,
      money: watchToModify.money ?? null,
      purchase_date: watchToModify.purchase_date || null,
      declared_value: watchToModify.declared_value ?? null,
      features: featureIDs,
      note: watchToModify.note || "",
      has_box: Boolean(watchToModify.has_box),
      has_papers: Boolean(watchToModify.has_papers),
      accessories: watchToModify.accessories || '',
      has_warranty: Boolean(watchToModify.has_warranty),
      warranty_start: watchToModify.warranty_start || null,
      warranty_end: watchToModify.warranty_end || null,
      warranty_provider: watchToModify.warranty_provider || '',
    };
    setModifyWatch(watchToModify);
    setModifyWatchBaseline(nextUpdatedWatch);
    setIsModifyVisible(true);
  };

  const handleInfoWatch = (watchToShow) => {
    setSelectedWatch(watchToShow);
    setIsInfoVisible(true);
  };

  const handleMaintenanceChanged = () => {
    setMaintenanceRefreshKey((current) => current + 1);
  };

  const handleShowStats = () => {
    setIsStatisticheVisible(true);
  };

  const handleInfiniteGrid = () => {
    setIsInfiniteGridVisible(true);
  };
  
  const handleSaveChanges = async (updatedWatch) => {
    setLoading(true);
    let outfitEmbeddingWarning = false;
    let uploadedImagePath = null;
    let updateCommitted = false;
    try {
      const { features: selectedFeatures = [], image, ...watchData } = updatedWatch;
      delete watchData.imageUrl;
      const finalWatchData = { ...watchData };
      const oldImagePath = modifyWatch.image || modifyWatch.imageUrl;

      if (image instanceof File) {
        uploadedImagePath = await uploadImage(image);
        if (!uploadedImagePath) throw new Error("L'immagine non è stata caricata; le modifiche non sono state salvate.");
        finalWatchData.image = uploadedImagePath;

        setMessage('Aggiorno l’immagine e la preparo per gli abbinamenti outfit…');
        try {
          finalWatchData.embedding = await getOptimizedOutfitEmbedding(image);
        } catch (embeddingError) {
          console.error('Impossibile aggiornare il vettore outfit:', embeddingError);
          // Evita di abbinare la nuova foto usando il vettore della foto precedente.
          finalWatchData.embedding = null;
          outfitEmbeddingWarning = true;
        }
      } else {
        // Se non viene scelta una nuova foto, lascia invariato il valore salvato nel database.
        delete finalWatchData.image;
      }

      const { data: updatedData, error: updateError } = await supabase.rpc('update_watch_with_features', {
        p_watch_id: String(modifyWatch.id),
        p_watch_data: finalWatchData,
        p_features: selectedFeatures,
      });
      if (updateError) throw updateError;
      updateCommitted = true;

      const updatedFeatures = allFeaturesList.filter(f => selectedFeatures.includes(f.id_caratteristica));
      let imageUrl = null;
      let imageUrlWarning = false;
      try {
        imageUrl = await getWatchImageUrl(updatedData.image);
      } catch (imageError) {
        imageUrlWarning = true;
        console.error('Orologio aggiornato, ma non è stato possibile firmare la foto:', imageError);
      }

      const locallyUpdatedWatch = {
          ...modifyWatch,
          ...updatedData,
          caratteristiche: updatedFeatures,
          imageUrl
      };

      setWatches(prevWatches => 
        prevWatches.map(w => w.id === modifyWatch.id ? locallyUpdatedWatch : w)
      );
      if (image instanceof File) {
        setMissingOutfitEmbeddingIds((currentIds) => (
          finalWatchData.embedding == null
            ? currentIds.some((id) => String(id) === String(modifyWatch.id))
              ? currentIds
              : [...currentIds, modifyWatch.id]
            : currentIds.filter((id) => String(id) !== String(modifyWatch.id))
        ));
      }

      let imageCleanupWarning = false;
      if (uploadedImagePath && oldImagePath) {
        try {
          await deleteImage(oldImagePath);
        } catch (imageError) {
          imageCleanupWarning = true;
          console.error('La nuova foto è stata salvata, ma la vecchia non è stata rimossa:', imageError);
        }
      }

      setMessage(imageUrlWarning
        ? 'Orologio aggiornato, ma la foto non è disponibile. Controlla la migrazione del bucket privato.'
        : imageCleanupWarning
          ? 'Orologio aggiornato, ma la vecchia foto non è stata rimossa dal deposito.'
          : outfitEmbeddingWarning
            ? 'Orologio aggiornato. La foto non è ancora disponibile negli abbinamenti outfit.'
            : 'Orologio aggiornato con successo!');
      setIsModifyVisible(false);
      return true;
    } catch (error) {
      console.error("Errore durante il salvataggio delle modifiche:", error);
      let cleanupWarning = false;
      if (uploadedImagePath && !updateCommitted) {
        try {
          await deleteImage(uploadedImagePath);
        } catch (imageError) {
          cleanupWarning = true;
          console.error('La modifica non è stata confermata e la nuova foto non è stata rimossa:', imageError);
        }
      }
      setMessage(`Errore: ${error.message}${cleanupWarning ? ' La foto caricata non è stata rimossa automaticamente.' : ''}`);
      return false;
    } finally {
        setLoading(false);
    }
  };

const handleFavoriteToggle = async (watchId) => {
    // 1. Troviamo l'orologio attuale
    const currentWatch = watches.find(w => w.id === watchId);
    if (!currentWatch) return;
    
    // 2. Calcoliamo il nuovo stato
    const newFavoriteState = !currentWatch.isFavorite;

    // 3. AGGIORNAMENTO OTTIMISTICO (UI Immediata)
    startTransition(() => {
        // A. Aggiorna la lista principale
        setWatches(prevWatches =>
            prevWatches.map(watch =>
                watch.id === watchId
                    ? { ...watch, isFavorite: newFavoriteState }
                    : watch
            )
        );

        // B. Aggiorna la MODALE se è aperta e corrisponde all'orologio cliccato
        // (Spostato qui per essere istantaneo)
        if (selectedWatch && selectedWatch.id === watchId) {
            setSelectedWatch((prevWatch) => ({
                ...prevWatch,
                isFavorite: newFavoriteState
            }));
        }
    });

    // 4. Chiamata al Database
    const { error } = await supabase
        .from('watches')
        .update({ isFavorite: newFavoriteState })
        .eq('id', watchId); 

    // 5. Gestione Errori (Rollback)
    if (error) {
        console.error("Errore Supabase (ripristino UI):", error);
        
        // Se il DB fallisce, torniamo indietro allo stato precedente
        startTransition(() => {
          // A. Ripristina lista
          setWatches(prevWatches =>
              prevWatches.map(watch =>
                  watch.id === watchId
                      ? { ...watch, isFavorite: !newFavoriteState } 
                      : watch
              )
          );

          // B. Ripristina modale
          if (selectedWatch && selectedWatch.id === watchId) {
              setSelectedWatch((prevWatch) => ({
                  ...prevWatch,
                  isFavorite: !newFavoriteState
              }));
          }
        });
        
        setMessage("Errore nell'aggiornamento dei preferiti.");
    }
  };

// Modifica questa funzione in App.jsx
async function getOutfitEmbedding(fileOrBlob) {
  const formData = new FormData();
  
  // TRUCCO: Se è un Blob (e non un File da input), aggiungiamo manualmente un nome file.
  // Senza questo, il server Python riceve un file senza nome e può rifiutarlo.
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
    console.error("Dettaglio errore AI:", error);
    if (error.name === 'AbortError') {
      throw new Error('L’analisi sta impiegando troppo tempo. Riprova con una foto più leggera.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function getOptimizedOutfitEmbedding(file) {
  const optimizedImage = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1280,
    initialQuality: 0.82,
    useWebWorker: true,
  });
  return getOutfitEmbedding(optimizedImage);
}

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    setMessage('Seleziona un file immagine, ad esempio JPG, PNG o WebP.');
    event.target.value = '';
    return;
  }

  if (watches.length === 0) {
    setMessage('Aggiungi prima un orologio alla collezione per trovare un abbinamento.');
    event.target.value = '';
    return;
  }

  setLoading(true);
  setMessage('Ottimizzo la foto per l’analisi…');
  setOutfitFeedbackMessage('');
  setIsCarouselVisible(false);
  setWatchConsigliati([]);
  setOutfitFiltersRelaxed(false);
  
  try {
    let compressionProgress = -1;
    const optimizedFile = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1280,
      initialQuality: 0.82,
      useWebWorker: true,
      onProgress: (progress) => {
        const step = Math.floor(progress / 20) * 20;
        if (step !== compressionProgress) {
          compressionProgress = step;
          setMessage(`Ottimizzo la foto… ${step}%`);
        }
      },
    });

    setMessage('Analizzo lo stile della foto…');
    const vector = await getOutfitEmbedding(optimizedFile);

    setMessage('Cerco gli orologi più adatti nella tua collezione…');
    const hasActiveOutfitFilters = outfitOccasion !== 'all' || outfitColorFamily !== 'all';
    let { data: matchedWatches, error } = await supabase.rpc('match_watches', {
      query_embedding: vector, 
      match_threshold: hasActiveOutfitFilters ? -1 : 0.1,
      match_count: Math.max(watches.length, 1),
    });

    // Se la soglia larga dà errore o non trova vettori, riprova con la soglia standard.
    if (hasActiveOutfitFilters && (error || !matchedWatches || matchedWatches.length === 0)) {
      const fallbackMatch = await supabase.rpc('match_watches', {
        query_embedding: vector,
        match_threshold: 0.1,
        match_count: Math.max(watches.length, 1),
      });
      if (fallbackMatch.error) throw fallbackMatch.error;
      matchedWatches = fallbackMatch.data;
    } else if (error) {
      throw error;
    }

    if (matchedWatches && matchedWatches.length > 0) {
      const formattedWatches = await Promise.all(matchedWatches.map(async (watchMatch) => {
        const collectionWatch = watches.find((watch) => String(watch.id) === String(watchMatch.id));
        const image = watchMatch.image || collectionWatch?.image;
        const finalImageUrl = await getWatchImageUrl(image);

        return {
          ...collectionWatch,
          ...watchMatch,
          imageUrl: finalImageUrl,
        };
      }));
      const filteredWatches = formattedWatches.filter((watch) => (
        matchesOutfitFilters(watch, outfitOccasion, outfitColorFamily)
      ));
      const filtersRelaxed = hasActiveOutfitFilters && filteredWatches.length === 0;
      const candidates = filtersRelaxed ? formattedWatches : filteredWatches;
      setOutfitFiltersRelaxed(filtersRelaxed);

      const { data: savedFeedback, error: feedbackError } = await supabase
        .from('watch_outfit_feedback')
        .select('watch_id, feedback')
        .eq('user_id', user.id)
        .eq('occasion', outfitOccasion)
        .eq('color_family', outfitColorFamily)
        .in('watch_id', candidates.map((watch) => watch.id));

      if (feedbackError) console.error('Impossibile caricare le preferenze outfit:', feedbackError);
      const feedbackMap = Object.fromEntries(
        (savedFeedback || []).map((entry) => [String(entry.watch_id), entry.feedback])
      );
      setOutfitFeedbackByWatch(feedbackMap);
      setWatchConsigliati(
        candidates
          .sort((first, second) => (
            (feedbackMap[String(second.id)] || 0) - (feedbackMap[String(first.id)] || 0)
            || (Number(second.similarity) || 0) - (Number(first.similarity) || 0)
          ))
          .slice(0, 8)
      );
      setIsCarouselVisible(true);
      setMessage(filtersRelaxed
        ? 'Nessun orologio corrisponde a tutti i filtri: ti mostro i più vicini alla foto.'
        : 'Ecco gli abbinamenti dalla tua collezione.');
    } else {
      setOutfitFeedbackByWatch({});
      setWatchConsigliati([]);
      setMessage(missingOutfitEmbeddingCount > 0
        ? `Non ho trovato orologi preparati per l’abbinamento. ${missingOutfitEmbeddingCount} ${missingOutfitEmbeddingCount === 1 ? 'orologio ha' : 'orologi hanno'} una foto ma manca l’analisi AI: usa il pulsante qui sotto per prepararli.`
        : 'L’analisi è riuscita, ma non ha trovato un abbinamento. Prova una foto più nitida o controlla i filtri scelti.');
    }

  } catch (err) {
    console.error(err);
    setMessage("Errore: " + err.message);
  } finally {
    setLoading(false);
    if (fileInputRefOutfit.current) fileInputRefOutfit.current.value = "";
  }
};

const handleOutfitFeedback = async (watchId, feedback) => {
  const feedbackRow = {
    user_id: user.id,
    watch_id: watchId,
    occasion: outfitOccasion,
    color_family: outfitColorFamily,
    feedback,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('watch_outfit_feedback')
    .upsert(feedbackRow, { onConflict: 'user_id,watch_id,occasion,color_family' });

  if (error) {
    console.error('Impossibile salvare il feedback outfit:', error);
    setOutfitFeedbackMessage('Non sono riuscito a salvare il voto. Riprova.');
    return;
  }

  setOutfitFeedbackByWatch((current) => ({ ...current, [String(watchId)]: feedback }));
  setOutfitFeedbackMessage(feedback === 1
    ? 'Preferenza salvata: terrò questo orologio più in alto con gli stessi filtri.'
    : 'Preferenza salvata: abbasserò questo orologio nei prossimi abbinamenti.');
};

// Aggiungilo in cima ad App.jsx o in un file separato
const LoadingModal = ({ message }) => {
  return (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <div className="loading-text">{message || "Caricamento in corso..."}</div>
      {/* Opzionale: piccolo testo per i tempi di attesa dell'AI */}
      <small style={{marginTop: "10px", opacity: 0.7, fontSize: "0.8rem"}}>
        Caricamento in corso...
      </small>
    </div>
  );
};

// Modifica questa funzione in App.jsx
const updateAllWatchEmbeddings = async () => {
  if (!user || isRebuildingOutfit || loading) return;
  setIsRebuildingOutfit(true);
  setLoading(true);
  setOutfitRebuildProgress('Preparo il ricalcolo degli orologi…');
  let successCount = 0;
  let failCount = 0;
  try {
    const { data: allWatches, error: watchesError } = await supabase
      .from('watches')
      .select('id, name, image, embedding')
      .not('image', 'is', null)
      .is('embedding', null);
    if (watchesError) throw watchesError;

    if (!allWatches?.length) {
      await fetchWatches(user.id);
      setOutfitRebuildProgress('Tutti gli orologi con una foto sono già pronti per gli abbinamenti.');
      setMessage('Tutti gli orologi con una foto sono già pronti per gli abbinamenti outfit.');
      return;
    }

    for (let index = 0; index < allWatches.length; index += 1) {
      const watch = allWatches[index];
      const progressMessage = `Ricalcolo ${index + 1}/${allWatches.length}: ${watch.name}…`;
      setOutfitRebuildProgress(progressMessage);
      setMessage(progressMessage);
      try {
        const imageUrl = await getWatchImageUrl(watch.image);
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) throw new Error(`Download foto non riuscito (${imageResponse.status}).`);
        const imageBlob = await imageResponse.blob();
        if (imageBlob.size < 100 || !imageBlob.type.startsWith('image/')) {
          throw new Error('Il file non è un’immagine valida.');
        }

        const embedding = await getOptimizedOutfitEmbedding(imageBlob);
        const { error: updateError } = await supabase
          .from('watches')
          .update({ embedding })
          .eq('id', watch.id);
        if (updateError) throw updateError;
        successCount += 1;
      } catch (error) {
        console.error(`Errore nel ricalcolo di ${watch.name}:`, error);
        failCount += 1;
      }
    }

    const refreshed = await fetchWatches(user.id);
    const summaryMessage = `Completato: ${successCount} orologi pronti${failCount ? `, ${failCount} non riusciti` : ''}${refreshed ? '.' : '. Ricarica la pagina per aggiornare la lista.'}`;
    setOutfitRebuildProgress(summaryMessage);
    setMessage(`Abbinamenti aggiornati: ${summaryMessage}`);
  } catch (error) {
    console.error('Errore nel ricalcolo degli abbinamenti outfit:', error);
    setOutfitRebuildProgress(`Ricalcolo non riuscito: ${error.message}`);
    setMessage(`Ricalcolo non riuscito: ${error.message}`);
  } finally {
    setLoading(false);
    setIsRebuildingOutfit(false);
  }
};

  // --- LOGICA FEATURES (Funzioni) ---
  const handleFeatureChange = (event) => {
    const { value, checked } = event.target;
    const numericValue = parseInt(value, 10); 
    setNewWatch((prev) => {
      if (checked) {
        return { ...prev, features: [...prev.features, numericValue] };
      } else {
        return { ...prev, features: prev.features.filter((f) => f !== numericValue) };
      }
    });
  };
  
  const [isDark, setIsDark] = useState(
    () => localStorage.getItem("theme") === "dark" 
  );
  const [isCompactViewport, setIsCompactViewport] = useState(
    () => window.matchMedia('(max-width: 720px)').matches
  );
  const [hoveredBrand, setHoveredBrand] = useState(null);

  useEffect(() => {
    const viewportQuery = window.matchMedia('(max-width: 720px)');
    const updateViewport = (event) => setIsCompactViewport(event.matches);

    if (viewportQuery.addEventListener) {
      viewportQuery.addEventListener('change', updateViewport);
      return () => viewportQuery.removeEventListener('change', updateViewport);
    }

    viewportQuery.addListener(updateViewport);
    return () => viewportQuery.removeListener(updateViewport);
  }, []);

//   const techLogos = [
//   { title: "React"},
//   { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
//   { node: <SiTypescript />, title: "TypeScript", href: "https://www.typescriptlang.org" },
//   { node: <SiTailwindcss />, title: "Tailwind CSS", href: "https://tailwindcss.com" },
// ];
const watchBrands = useMemo(() => [
  { name: 'Rolex', models: ['Submariner', 'Datejust'] },
  { name: 'Tissot', models: ['PRX', 'Seastar 1000'] },
  { name: 'Audemars Piguet', models: ['Royal Oak', 'Code 11.59'] },
  { name: 'Citizen', models: ['Tsuyosa', 'Promaster'] },
  { name: 'Casio', models: ['G-Shock', 'Edifice'] },
  { name: 'Orient', models: ['Bambino', 'Mako'] },
  { name: 'Hublot', models: ['Big Bang', 'Classic Fusion'] },
  { name: 'Tudor', models: ['Black Bay', 'Pelagos'] },
  { name: 'Oris', models: ['Aquis', 'Big Crown Pointer Date'] },
  { name: 'Alpina', models: ['Alpiner Extreme', 'Startimer Pilot'] },
  { name: 'Bulova', models: ['Lunar Pilot', 'Jet Star'] },
  { name: 'Patek Philippe', models: ['Nautilus', 'Calatrava'] },
  { name: 'Zenith', models: ['Chronomaster', 'Defy'] },
  { name: 'Cartier', models: ['Tank', 'Santos de Cartier'] },
  { name: 'Seiko', models: ['Prospex', 'Presage'] },
  { name: 'Omega', models: ['Speedmaster', 'Seamaster'] },
  { name: 'Longines', models: ['Spirit', 'Master Collection'] },
  { name: 'Mido', models: ['Ocean Star', 'Multifort'] },
  { name: 'Hamilton', models: ['Khaki Field', 'Jazzmaster'] },
  { name: 'IWC', models: ['Portugieser', "Pilot's Watch"] },
  { name: 'Swatch', models: ['MoonSwatch', 'Big Bold'] },
  { name: 'Maurice Lacroix', models: ['Aikon', 'Masterpiece'] },
  { name: 'Timex', models: ['Marlin', 'Q Timex'] },
  { name: 'Breitling', models: ['Navitimer', 'Superocean'] },
  { name: 'Panerai', models: ['Luminor', 'Radiomir'] },
  { name: 'Jaeger-LeCoultre', models: ['Reverso', 'Master Control'] },
  { name: 'Lorenz', models: ['Granpremio', 'DI300'] },
], []);

  const showBrandModels = (event, brand, itemKey) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipWidth = Math.min(260, window.innerWidth - 24);
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, tooltipWidth / 2 + 12),
      window.innerWidth - tooltipWidth / 2 - 12
    );
    const placement = rect.bottom + 84 <= window.innerHeight || rect.top < 92 ? 'below' : 'above';
    const top = placement === 'below' ? rect.bottom + 9 : rect.top - 9;

    setHoveredBrand({ brand, itemKey, left, top, placement });
  };

  useEffect(() => {
    if (!hoveredBrand) return undefined;

    const dismissTooltip = () => setHoveredBrand(null);
    window.addEventListener('scroll', dismissTooltip, true);
    window.addEventListener('resize', dismissTooltip);

    return () => {
      window.removeEventListener('scroll', dismissTooltip, true);
      window.removeEventListener('resize', dismissTooltip);
    };
  }, [hoveredBrand]);

  // 2. PORTA QUI L'EFFETTO (SIDE EFFECT)
  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark-mode");
      document.documentElement.setAttribute("style", "color-scheme:dark"); 
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      document.documentElement.setAttribute("style", "color-scheme:light");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Funzione helper per cambiare stato (opzionale, ma pulita)
  const toggleTheme = () => setIsDark(!isDark);

  const isOverlayOpen = loading
    || isModalVisible
    || isStatisticheVisible
    || isInfoVisible
    || isModifyVisible
    || isCarouselVisible
    || isInfiniteGridVisible;

  const floatingConfig = useMemo(() => (
    isDark
      ? { bg: "#091522", gradient: ["#F4C878"], blend: "screen" }
      : { bg: "#e9f0f4", gradient: ["#4f91a0", "#b56e93"], blend: "multiply" }
  ), [isDark]);


const BackgroundLayer = useMemo(() => {
      return (
        <div className="ambient-background" style={{
            backgroundColor: floatingConfig.bg,
            transition: "background-color 0.6s ease",
        }}>
          {!isCompactViewport && (
            <Suspense fallback={null}>
              <FloatingLines
                linesGradient={floatingConfig.gradient}
                mixBlendMode={floatingConfig.blend}
                enabledWaves={['top', 'middle', 'bottom']}
                lineCount={[3, 3, 2]}
                lineDistance={[8, 6, 4]}
                animationSpeed={0.55}
                bendRadius={5.0}
                bendStrength={-0.5}
                interactive={false}
                parallax={false}
              />
            </Suspense>
          )}
        </div>
      );
    }, [isCompactViewport, floatingConfig]);

  // --- RENDER ---
  return (
    <>
    {loading && <LoadingModal message={message} />}
    {BackgroundLayer}
    {!isOverlayOpen && createPortal(
      <div className="slideWrap_Container">
        <GlassSurface
          width={user ? '100%' : 96}
          height={64}
          borderRadius={32}
          className={`my-custom-class global-navigation-glass theme-switch-glass navigation-glass${user ? ' has-navigation' : ''}`}
        >
          <div className="global-navigation-controls">
            <div className="global-navigation-theme">
              <DarkModeSwitch isDark={isDark} toggleTheme={toggleTheme} />
            </div>
            {user && (
              <Dock
                items={items}
                activeSection={activeSection}
                onLogout={handleLogout}
                onAddWatchToggle={toggleAddWatchForm}
                isFormVisible={showForm}
                baseItemSize={50}
                magnification={58}
              />
            )}
          </div>
        </GlassSurface>
      </div>,
      document.body
    )}

    {/* MAIN CONTENT LAYER */}
    <div
      className={`container ${!user ? 'login-page' : ''}`}
      id="home"
      style={{ position: 'relative', zIndex: 1 }} // Assicuro che il contenuto stia sopra
    >
      <SpeedInsights/>
      <div className="hero-account-backdrop">
        {/*
        Video della home disattivato per evitare download e decodifica durante il caricamento.
        Per riattivarlo, rimuovere questo commento e ripristinare il controllo isCompactViewport.
        {!isCompactViewport && (
          <div className="hero-account-video-mask" aria-hidden="true">
            <video className="hero-account-video" autoPlay loop muted playsInline preload="auto" tabIndex={-1}>
              <source src={`${import.meta.env.BASE_URL}w7-optimized.mp4`} type="video/mp4" />
              <source src={`${import.meta.env.BASE_URL}w7.webm`} type="video/webm" />
            </video>
          </div>
        )}
        */}
        <div className="hero-account-content">
      <div id="home-section" className="hero-section">
        <figure className={`hero-watch${isDark ? ' is-dark' : ''}`}>
          <img
            className="hero-watch-image hero-watch-image--light"
            src="/orologio_fin.png"
            alt={isDark ? '' : 'Orologio classico argentato inclinato, con quadrante romano'}
            aria-hidden={isDark ? 'true' : undefined}
            loading="eager"
            decoding="async"
            fetchPriority={isDark ? 'low' : 'high'}
          />
          <img
            className="hero-watch-image hero-watch-image--dark"
            src="/orologio_fin_dark.png"
            alt={isDark ? 'Orologio classico argentato inclinato, con quadrante romano in versione scura' : ''}
            aria-hidden={!isDark ? 'true' : undefined}
            loading="eager"
            decoding="async"
            fetchPriority={isDark ? 'high' : 'low'}
          />
        </figure>
        <svg
          className="hero-flow-overlay"
          viewBox="0 0 1000 650"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
          style={{ '--hero-flow-glint': isDark ? '#ffe8b5' : '#ffffff' }}
        >
          <defs>
            <linearGradient id="hero-flow-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={isDark ? '#e8bd72' : '#a8eaff'} stopOpacity="0.15" />
              <stop offset="34%" stopColor={isDark ? '#e8bd72' : '#9fe9ff'} />
              <stop offset="68%" stopColor={isDark ? '#fff0d2' : '#f4b1df'} />
              <stop offset="100%" stopColor={isDark ? '#d6a657' : '#9eeaff'} stopOpacity="0.72" />
            </linearGradient>
            <filter id="hero-flow-glow" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur stdDeviation="3.5" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path className="hero-flow-line hero-flow-line--upper" d="M-30 168 C145 184 217 274 384 292 S634 348 760 272 S927 154 1030 110" />
          <path className="hero-flow-line hero-flow-line--lower" d="M-30 214 C150 244 263 347 438 370 S682 448 828 384 S958 322 1030 334" />
          <path className="hero-flow-line hero-flow-line--orbit" d="M170 530 C315 450 330 270 520 255 S795 410 1030 210" />
          <path className="hero-flow-line hero-flow-line--orbit hero-flow-line--orbit-alt" d="M300 95 C420 245 460 525 650 490 S865 260 1030 355" />
          <path className="hero-flow-streak" pathLength="1000" d="M-30 214 C150 244 263 347 438 370 S682 448 828 384 S958 322 1030 334" />
          <path className="hero-flow-streak hero-flow-streak--secondary" pathLength="1000" d="M170 530 C315 450 330 270 520 255 S795 410 1030 210" />
        </svg>
        <div className="hero-copy">
          <div className="hero-brand-lockup" role="img" aria-label="Calibro">
            <img
              className="hero-brand-mark"
              src="./calibro_mark.webp"
              alt=""
              width="512"
              height="512"
              loading="eager"
              decoding="async"
              aria-hidden="true"
            />
            <span className="hero-brand-name-frame" aria-hidden="true">
              <img
                className="hero-brand-name"
                src="./name_icon_plain.svg"
                alt=""
                width="1500"
                height="1500"
                loading="eager"
                decoding="async"
              />
            </span>
          </div>
          <p className="hero-eyebrow"><span aria-hidden="true" /> IL TUO WATCH JOURNAL</p>
          <div className="titleList">
            <h1>La mia collezione<br />di orologi</h1>
          </div>
          <p className="hero-description">Ogni segnatempo custodisce un momento. Qui, la tua collezione prende forma.</p>
          <a className="hero-cta" href="#watch-list-section">
            Esplora la collezione <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <div className="brand-strip" aria-label="Marchi di orologi">
        <div className="brand-strip-heading">
          <span>Grandi nomi, storie senza tempo</span>
        </div>
        <LogoLoop
          logos={watchBrands}
          speed={34}
          direction="left"
          logoHeight={20}
          gap={24}
          pauseOnHover={false}
          ariaLabel="Marchi di orologi"
          renderItem={(brand, itemKey) => {
            const isHovered = hoveredBrand?.itemKey === itemKey;

            return (
              <button
                type="button"
                className={`brand-pill${isHovered ? ' is-active' : ''}`}
                aria-label={`${brand.name}, mostra i modelli`}
                aria-describedby={isHovered ? 'brand-models-tooltip' : undefined}
                onMouseEnter={(event) => showBrandModels(event, brand, itemKey)}
                onMouseLeave={() => setHoveredBrand(null)}
                onFocus={(event) => showBrandModels(event, brand, itemKey)}
                onBlur={() => setHoveredBrand(null)}
              >
                {brand.name}
              </button>
            );
          }}
        />
        {hoveredBrand && createPortal(
          <div
            className={`brand-models-tooltip${hoveredBrand.placement === 'above' ? ' is-above' : ''}`}
            id="brand-models-tooltip"
            role="tooltip"
            style={{ left: `${hoveredBrand.left}px`, top: `${hoveredBrand.top}px` }}
          >
            {hoveredBrand.brand.models.map((model) => (
              <span key={model}>{model}</span>
            ))}
          </div>,
          document.body
        )}
      </div>

      {message && <p className="message" onClick={() => setMessage(null)}>{message}</p>}
      {loading && <div className="loading-spinner"></div>} 
      <div style={{ marginBottom: "20px" }}></div>

      {!user ? (
        <AuthForm
          nickname={nickname}
          setNickname={setNickname}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          handleRegister={handleRegister}
          handleLogin={handleLogin}
          handleKeyDown={handleKeyDown}
          isDark={isDark} 
        />
      ) : (
        <div className="profile-info relative overflow-hidden" id="profile-section">
            <div className="profile-info-content relative z-10">
              <div className="circular-text-container">
                <div className="profile-picture">
                  <UserProfile email={email} nickname={nickname} isDark={isDark} />
                </div>
              </div>
              <h4 className="Saluti">Benvenuto, {nickname}</h4>
              <p className="profile-collection-value">
                <span>Valore dichiarato della collezione</span>
                <strong>{collectionTotals.declaredValue.toLocaleString('it-IT')} €</strong>
                <small>Spesa di acquisto: {collectionTotals.purchaseSpend.toLocaleString('it-IT')} €</small>
              </p>
              <NotificationSettings userId={user?.id} />
              <CollectionQuickStats watches={watches} />
            </div>
          </div>
      )}
        </div>
      </div>

      {user && (
        <>
          <AddWatchForm
            showForm={showForm}
            sectionRef={addWatchSectionRef}
            newWatch={newWatch}
            setNewWatch={setNewWatch}
            handleImageChange={handleImageChange}
            fileInputRef={fileInputRef}
            isDetailsMenuOpen={isDetailsMenuOpen}
            setIsDetailsMenuOpen={setIsDetailsMenuOpen}
            allFeaturesList={allFeaturesList}
            featuresLoading={featuresLoading}
            featuresError={featuresError}
            handleFeatureChange={handleFeatureChange}
            handleAddWatch={handleAddWatch}
            handleCancel={handleCancel}
            isDark={isDark} 
          />

          <div className="separator-container">
            <hr className="custom-separator" />
          </div>
          
          <div id="function-section">
            <h2 style={{paddingBottom:"2%"}} id="function">Funzioni</h2>
            <FunctionsSection
              onDayWatchClick={handleDayWatch}
              onOutfitImageChange={handleImageUpload}
              fileInputRefOutfit={fileInputRefOutfit}
              outfitOccasion={outfitOccasion}
              setOutfitOccasion={setOutfitOccasion}
              outfitColorFamily={outfitColorFamily}
              setOutfitColorFamily={setOutfitColorFamily}
              onRebuildOutfitEmbeddings={updateAllWatchEmbeddings}
              outfitMissingEmbeddingCount={missingOutfitEmbeddingCount}
              isRebuildingOutfit={isRebuildingOutfit}
              outfitRebuildProgress={outfitRebuildProgress}
            />
          </div>

          <OutfitModal
            key={watchConsigliati.map((watch) => watch.id).join('-')}
            isVisible={isCarouselVisible}
            watchConsigliati={watchConsigliati}
            occasion={outfitOccasion}
            colorFamily={outfitColorFamily}
            filtersRelaxed={outfitFiltersRelaxed}
            feedbackByWatch={outfitFeedbackByWatch}
            feedbackMessage={outfitFeedbackMessage}
            onFeedback={handleOutfitFeedback}
            onClose={() => {
              setIsCarouselVisible(false);
              if(fileInputRefOutfit.current) fileInputRefOutfit.current.value = "";
              setWatchConsigliati([]);
            }}
            onOpenWatch={(recommendedWatch) => {
              const fullWatch = watches.find((watch) => String(watch.id) === String(recommendedWatch.id)) || recommendedWatch;
              setIsCarouselVisible(false);
              setWatchConsigliati([]);
              handleInfoWatch(fullWatch);
            }}
          />
          
          <DayWatchModal
            isVisible={isModalVisible}
            setIsVisible={setIsModalVisible}
            selectedWatch={selectedWatch}
            modalTitle={modalTitle}
          />

          <ModifyWatchModal
            key={isModifyVisible ? modifyWatch?.id : 'closed'}
            isVisible={isModifyVisible}
            setIsVisible={setIsModifyVisible}
            onBackHandlerChange={registerModifyBackHandler}
            initialWatch={modifyWatchBaseline}
            fileInputRef={fileInputRef} 
            allFeaturesList={allFeaturesList}
            featuresLoading={featuresLoading}
            featuresError={featuresError}
            handleSaveChanges={handleSaveChanges}
          />

          <h2 id="watch-list">Lista Orologi</h2> 
          
          <div id="watch-list-section">
            <WatchList 
              watches={watches} 
              handleModifyWatch={handleModifyWatch} 
              handleFavoriteToggle={handleFavoriteToggle}
              handleInfoWatch={handleInfoWatch} 
              handleShowStats={handleShowStats}
              handleInfiniteGrid={handleInfiniteGrid}
              onCreateBackup={handleCreateBackup}
              onRestoreBackup={handleRestoreBackup}
              backupInputRef={backupInputRef}
              isBackupBusy={isBackupBusy}
              userId={user?.id}
              maintenanceRefreshKey={maintenanceRefreshKey}
            />
          </div>
        </>
      )}
          {isStatisticheVisible && (
            <Suspense fallback={null}>
              <StatsModal
                isVisible={isStatisticheVisible}
                setIsVisible={setIsStatisticheVisible}
                watches={watches}
                isDark={isDark}
              />
            </Suspense>
          )}
          <InfoWatchModal
            isVisible={isInfoVisible}
            setIsVisible={setIsInfoVisible}
            selectedWatch={selectedWatch}
            handleDeleteWatch={handleDeleteWatch}
            handleFavoriteToggle={handleFavoriteToggle}
            userId={user?.id}
            onMaintenanceChanged={handleMaintenanceChanged}
          />
          {isInfiniteGridVisible && (
            <Suspense fallback={null}>
              <InfiniteGridModal
                isVisible={isInfiniteGridVisible}
                setIsVisible={setIsInfiniteGridVisible}
                handleInfoWatch={handleInfoWatch}
                isDark={isDark}
                watches={watches}
                handleFavoriteToggle={handleFavoriteToggle}
              />
            </Suspense>
          )}
    </div>
    </>
  );
}

export default App;
