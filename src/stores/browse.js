import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';
import useLoadingStore from '@/stores/loading';

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
    const page = ref(0);

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
        media.value = append ? media.value.concat(data.media) : data.media;
    }

    // folderId null = primo livello della root corrente.
    async function open(folderId) {
        const loading = useLoadingStore();
        loading.start();
        try {
            if (roots.value.length === 0) {
                await loadRoots();
            }
            page.value = 0;
            const data = await api.get('/browse/folder', {
                folder: folderId || null,
                root: folderId ? null : rootId.value,
                page: 0,
                size: PAGE_SIZE,
            });
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
        page.value += 1;
        const data = await api.get('/browse/folder', {
            folder: folder.value.folder_id,
            page: page.value,
            size: PAGE_SIZE,
        });
        applyPage(data, true);
    }

    return {
        roots, rootId, folder, breadcrumb, subfolders, media, total,
        hasMore, isEmpty,
        loadRoots, open, loadMore,
    };
});

export default useBrowseStore;
