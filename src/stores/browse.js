import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';
import useLoadingStore from '@/stores/loading';
import { useLatest } from '@/composables/useLatest';
import { appendMedia } from '@/plugins/lists';

const PAGE_SIZE = 200;

// Stato della pagina Sfoglia: cartella corrente, breadcrumb, sottocartelle e
// media caricati finora. I media si accumulano con l'infinite scroll, quindi
// vanno azzerati a ogni cambio di cartella.
const useBrowseStore = defineStore('browse', () => {
    const roots = ref([]);
    const rootId = ref(null);
    const folder = ref(null);
    const breadcrumb = ref([]);
    const subfolders = ref([]);
    const media = ref([]);
    const total = ref(0);

    // Senza, navigando veloce -- Indietro mentre si e' in fondo alla griglia --
    // il loadMore della cartella di prima accodava le sue foto a quella nuova,
    // breadcrumb compreso, e si poteva cestinare dalla cartella sbagliata.
    const latest = useLatest();

    const hasMore = computed(() => media.value.length < total.value);
    const isEmpty = computed(() => subfolders.value.length === 0 && media.value.length === 0);

    async function loadRoots() {
        roots.value = await api.get('/browse/roots');
        if (!rootId.value && roots.value.length > 0) {
            rootId.value = roots.value[0].root_id;
        }
        return roots.value;
    }

    function applyPage(data, append) {
        folder.value = data.folder;
        breadcrumb.value = data.breadcrumb;
        subfolders.value = data.subfolders;
        total.value = data.total;
        media.value = append ? appendMedia(media.value, data.media) : data.media;
    }

    // folderId null = primo livello della root corrente.
    async function open(folderId) {
        const loading = useLoadingStore();
        const token = latest.start();
        loading.start();
        try {
            if (roots.value.length === 0) {
                await loadRoots();
            }
            const data = await api.get('/browse/folder', {
                folder: folderId || null,
                root: folderId ? null : rootId.value,
                offset: 0,
                size: PAGE_SIZE,
            });
            if (!latest.isCurrent(token)) {
                return;
            }
            applyPage(data, false);
            if (data.folder) {
                rootId.value = data.folder.root_id;
            }
        }
        finally {
            loading.stop();
        }
    }

    async function loadMore() {
        if (!hasMore.value || !folder.value) {
            return;
        }
        const token = latest.peek();
        const folderId = folder.value.folder_id;
        // Si chiede "dal file N" con N quanti se ne hanno, non la pagina
        // successiva: dopo aver cestinato k file, che l'API esclude subito, la
        // pagina successiva partiva k righe troppo avanti e li saltava.
        const data = await api.get('/browse/folder', {
            folder: folderId,
            offset: media.value.length,
            size: PAGE_SIZE,
        });
        // Scartata se nel frattempo e' partita un'altra open(), anche se non
        // e' ancora finita: la cartella mostrata sta per cambiare.
        if (!latest.isCurrent(token) || !folder.value || folder.value.folder_id !== folderId) {
            return;
        }
        applyPage(data, true);
    }

    // Toglie dalla lista i file appena cestinati, senza rifare la richiesta.
    // L'API li escluderebbe comunque -- filtra le richieste di cestinamento
    // ancora pendenti -- ma ricaricare una pagina da 200 media per far sparire
    // due tile e' lavoro sprecato, e si vedrebbe.
    function forget(mediaIds) {
        const gone = new Set(mediaIds);
        media.value = media.value.filter((m) => !gone.has(m.media_id));
        total.value = Math.max(0, total.value - gone.size);
    }

    // Come forget, per le cartelle appena cestinate.
    function forgetFolders(folderIds) {
        const gone = new Set(folderIds);
        subfolders.value = subfolders.value.filter((f) => !gone.has(f.folder_id));
    }

    return {
        roots, rootId, folder, breadcrumb, subfolders, media, total,
        hasMore, isEmpty,
        loadRoots, open, loadMore, forget, forgetFolders,
    };
});

export default useBrowseStore;
