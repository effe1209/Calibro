<div align="center">
  <img src="public/calibro_icon.svg" alt="Calibro Logo" width="120" height="120" />

  <h1>Calibro ⏱️</h1>
  
  <p>
    <strong>Il caveau digitale e intelligente per la tua collezione di orologi.</strong>
  </p>
  
  <p>
    Una piattaforma web moderna pensata per gli appassionati di orologeria che desiderano catalogare, monitorare e vivere la propria collezione attraverso un'interfaccia elegante e strumenti di analisi visiva avanzati.
  </p>
</div>

---

## 🚀 Funzionalità Principali

* **Gestione Completa del Catalogo:** Inserisci, modifica ed elimina i tuoi segnatempo con facilità. Alterna tra una vista a griglia (con selezione rapida dei preferiti) e una vista a carosello immersiva.
* **Schede Tecniche Dettagliate:** Traccia la condizione estetica e meccanica (scala 1-10), la data e il prezzo di acquisto, il valore di mercato stimato, la dotazione (scatola, documenti) e i dettagli del centro assistenza.
* **Motore di Ricerca e Filtri:** Trova rapidamente l'orologio perfetto filtrando per marca, anno, prezzo o stato "preferito". Esporta i risultati in formato CSV.
* **Registro Revisioni & Promemoria:** Archivia lo storico degli interventi di manutenzione (date, costi, fornitori). Ricevi avvisi in-app configurabili per garanzie e revisioni in scadenza, con anticipo personalizzabile.
* **Sistema di Backup Incrementale:** Esporta un file JSON autonomo contenente tutti i tuoi dati, incluse le immagini, le preferenze outfit e le notifiche. Il ripristino unisce i dati in modo intelligente senza sovrascrivere i record non interessati. Inoltre, un flusso automatizzato tramite GitHub Actions mantiene sempre reattivo il database del progetto.

## 🧠 Intelligenza Artificiale e Analisi

* **L'Abbinamento Perfetto (Completa l'Outfit):** Sfrutta l'analisi visiva tramite un modello AI ospitato su Hugging Face. Carica un'immagine del tuo look, imposta filtri per occasione o colore, e lascia che l'algoritmo valuti e metta a confronto i segnatempo della tua collezione (addestrando il sistema tramite feedback 👍/👎).
* **Orologio del Giorno:** Lasciati ispirare da una selezione casuale quotidiana, perfetta per sconfiggere l'indecisione mattutina.
* **Dashboard Finanziaria e Statistiche:** Monitora il Delta tra spesa totale e valore attuale della collezione. Visualizza grafici interattivi sulla distribuzione dei marchi, decenni di produzione, tipologia di movimento e andamento storico degli acquisti.

## 🔒 Storage Privato e Sicurezza

Le fotografie della tua collezione sono custodite in un bucket privato Supabase (`watch-photos-private`), garantendo la massima riservatezza (mentre gli sfondi restano accessibili pubblicamente). 

Le migrazioni SQL (inclusa la `20261025_security_hardening.sql`) blindano le transazioni di salvataggio. Uno script dedicato (`npm run migrate:watch-photos`) si occupa di trasferire i media esistenti in un ambiente protetto, aggiornare i riferimenti nel database e ripulire le vecchie copie pubbliche, richiedendo l'uso privilegiato della `SUPABASE_SERVICE_ROLE_KEY` in ambiente amministrativo.

## 🎨 Interfaccia e Performance

* **Design Adattivo:** Supporto nativo e transizione fluida tra Modalità Chiara e Scura.
* **Dettagli Estetici:** Effetto *frosted glass* sulla navigazione, brand scroller continui e un widget orologio analogico renderizzato in puro CSS e JavaScript.
* **Animazioni Fluide:** Utilizzo di Framer Motion per garantire un'esperienza reattiva (come l'effetto FLIP nel riordino dei preferiti).

## 🛠️ Stack Tecnologico

| Categoria | Tecnologia | Utilizzo |
| :--- | :--- | :--- |
| **Frontend** | React | Hooks avanzati (`useMemo`, `useTransition`) per performance ottimali. |
| **Styling & UI** | Framer Motion | Gestione delle animazioni fisiche e transizioni di layout. |
| **Componenti** | Swiper.js | Implementazione del carosello touch-friendly. |
| **Backend & DB** | Supabase | Auth, Database PostgreSQL e backend-as-a-service. |
| **Storage** | Supabase Storage | Gestione sicura e privata dei bucket fotografici. |

## 📸 Anteprima

* Home Page (Tema Chiaro)
![Home](./screenshot/home.png)
* Home Page (Tema Scuro)
![Home in modalità scura](./screenshot/homeBlack.png)
* Vista Collezione
![Collezione](./screenshot/collection.png)
* Scheda Dettaglio Orologio
![Dettaglio orologio](./screenshot/infoWatch.png)
* Motore di Abbinamento Outfit
![Completa l’outfit](./screenshot/outfitMatch.png)

## 📍 Roadmap

**Completato:**
- [x] Integrazione note aggiuntive, condizione (1-10) e selettore complicazioni.
- [x] Tracking dotazione, garanzia e registro completo revisioni con notifiche.
- [x] Backup/ripristino con immagini incluse.
- [x] Filtri di ricerca avanzati e dashboard statistiche responsive.
- [x] Suggerimenti outfit tramite intelligenza artificiale.
- [x] Tracking spesa d'acquisto vs valore dichiarato.

**In Sviluppo / Futuro:**
- [ ] Importazione CSV guidata con anteprima e rilevamento duplicati.
- [ ] Analisi granulare dei costi di manutenzione per singolo orologio.
- [ ] Archiviazione storica degli orologi venduti (mantenendo consultabili i dati e gli interventi passati).

## 📈 Contribuire

Contributi, segnalazioni e idee sono benvenuti. Per partecipare:
1. Effettua un Fork del repository.
2. Crea un branch per la tua feature (`git checkout -b feature/nuova-funzionalita`).
3. Effettua il commit dei cambiamenti (`git commit -m "Aggiunta nuova funzionalità"`).
4. Apri una Pull Request verso il branch principale.

## 👤 Maintainer

Progettato e sviluppato da **[effe1209](https://github.com/effe1209)**.

## 🫶 Ringraziamenti

* **Supabase** — per l'infrastruttura dati e storage
* **Framer Motion** — per le animazioni
* **Swiper.js** — per il carosello
