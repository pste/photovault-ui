# photovault-ui

Web app di photovault: Vue 3 + Vite + PrimeVue.

Interfaccia minimale, senza login: menu verticale a sinistra, barra di ricerca in alto,
navigazione dei media **a cartelle, come il file manager del PC**.

## Requisiti

- Node.js 24
- `photovault-api` in ascolto (in sviluppo su `http://localhost:3000`)

## Comandi

```bash
npm install
npm run dev       # dev server Vite
npm run build     # build di produzione in dist/
npm run preview   # anteprima locale della build
```

Il dev server resta acceso: non serve rilanciarlo se non è stato fermato.

## Struttura

```
src/
├── main.js
├── App.vue                shell: SideMenu + TopBar + RouterView + Toast
├── style.css              layout della shell e classi condivise
├── components/
│   ├── SideMenu.vue       menu verticale fisso a sinistra
│   ├── TopBar.vue         barra di ricerca sempre visibile
│   ├── FolderTile.vue     tile cartella con mosaico 2x2 delle prime 4 thumbnail
│   ├── MediaGrid.vue      griglia condivisa da Browse e Search, con infinite scroll
│   ├── MediaTile.vue      singolo media, img loading="lazy"
│   ├── Lightbox.vue       Dialog maximizable, non è una rotta
│   ├── DupGroupCard.vue   gruppo di duplicati, con scelta del file da tenere
│   └── StorageBanner.vue  avviso quando la share non risponde
├── pages/
│   ├── Browse.vue         /  e  /folder/:folderId — esploratore cartelle
│   ├── Search.vue         /search
│   ├── Duplicates.vue     /duplicates
│   ├── Trash.vue          /trash
│   ├── Jobs.vue           /jobs
│   └── Parameters.vue     /parameters
├── stores/                browse, search, duplicates, trash, jobs, parameters,
│                          storage, errors, loading
├── composables/           useInfiniteScroll
└── plugins/               index (registerPlugins), pinia, router, api, toast, logger
```

Da aggiungere nelle fasi successive: `TagChips.vue` per la gestione manuale dei tag e
l'albero cartelle lazy nel menu laterale.

### Duplicati e cestino

`Duplicates.vue` mostra un gruppo per scheda, coi membri affiancati e scorrevoli in
orizzontale: mandarli a capo spezzerebbe il confronto visivo, che è tutto il punto della
pagina. Il file da tenere è preselezionato secondo la proposta dell'API (più pixel, poi file
più grande, poi il più vecchio), ma resta una **proposta**: la scelta finale è un radio button.

Cestinare non cancella. `Trash.vue` mostra cosa c'è nel cestino e quanti giorni mancano allo
svuotamento automatico, così un ripensamento è sempre possibile finché il contatore non
arriva a zero.

## Convenzioni

- Ogni SFC nell'ordine **script → template → style scoped**.
- Niente CSS inline: si usano classi. Le classi riusate stanno in `style.css`, non duplicate
  negli scoped style dei singoli componenti.
- I componenti di PrimeVue sono auto-importati; **i componenti locali no**, vanno importati
  esplicitamente.
- Comunicazione tra componenti via store Pinia, o eventi emessi nei casi semplici.
- Ogni plugin ha il suo file in `src/plugins/`, registrato da `registerPlugins`.

## Scelte di interfaccia

**Il menu laterale è un elenco di link, non un componente PrimeVue.** Servono solo quattro
voci con lo stato attivo, e una lista di `RouterLink` con due classi CSS costa meno di
configurare `Menu` per ottenere lo stesso risultato. Quando si aggiungerà l'albero cartelle
navigabile, quello sì dovrà essere un `Tree` **lazy** (`@node-expand` che carica i figli): né
`PanelMenu` né `Menu` vanno bene, perché caricano tutto in una volta e con qualche migliaio di
cartelle bloccano il browser.

**Il lightbox non è una rotta**, è un overlay pilotato dal query param `?m=<media_id>`: così
l'immagine è linkabile e il tasto Indietro lo chiude invece di uscire dalla cartella.

**Cartelle con migliaia di foto: infinite scroll, non virtual scroll.** L'API pagina a 200,
la UI accoda su un sentinella `IntersectionObserver`, e `<img loading="lazy">` fa sì che il
browser non scarichi mai le immagini fuori schermo — il costo di rete è già limitato senza
virtualizzazione. Gli attributi `width`/`height` espliciti evitano il layout shift. Oltre
~2000 elementi caricati il sentinella lascia il posto a un "carica altro".

`VirtualScroller` di PrimeVue richiede un `itemSize` fisso, ma in griglia il numero di
elementi per riga cambia con la larghezza della finestra: costerebbe una sessantina di righe
di ricalcolo sul resize, per nulla.

**Da non portare da reimagined-disco**: `stores/session.js`, `stores/cache.js`,
`plugins/idxdb.js`, `useCacheFeeder`, e il plugin PWA. La cache HTTP `immutable` sulle
thumbnail li rende tutti superflui.

## Build

```bash
docker build -f .docker/Dockerfile -t photovault-ui:dev .
```

Build multi-stage: Vite compila, poi `nginx-unprivileged` serve `dist/` sulla porta **8080**
(l'immagine non gira da root, quindi la porta deve stare sopra la 1024).
