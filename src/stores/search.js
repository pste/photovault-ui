import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';
import useLoadingStore from '@/stores/loading';

const PAGE_SIZE = 200;

const useSearchStore = defineStore('search', () => {
    const filters = ref({ q: '', kind: '', tag: '', from: '', to: '' });
    const media = ref([]);
    const total = ref(0);
    const page = ref(0);
    const ran = ref(false);

    // Vedi browse.js: ogni run() apre una generazione, e le risposte di una
    // ricerca superata si scartano invece di sovrascrivere quella nuova.
    let generation = 0;

    const hasMore = computed(() => media.value.length < total.value);

    async function fetchPage(pageNumber, append) {
        const current = generation;
        const data = await api.get('/search', {
            ...filters.value,
            page: pageNumber,
            size: PAGE_SIZE,
        });
        if (current !== generation) {
            return;
        }
        page.value = pageNumber;
        total.value = data.total;
        media.value = append ? media.value.concat(data.media) : data.media;
        ran.value = true;
    }

    async function run(newFilters) {
        const loading = useLoadingStore();
        loading.start();
        try {
            if (newFilters) {
                filters.value = { ...filters.value, ...newFilters };
            }
            generation++;
            await fetchPage(0, false);
        }
        finally {
            loading.stop();
        }
    }

    async function loadMore() {
        if (!hasMore.value) {
            return;
        }
        await fetchPage(page.value + 1, true);
    }

    function reset() {
        generation++;
        filters.value = { q: '', kind: '', tag: '', from: '', to: '' };
        media.value = [];
        total.value = 0;
        page.value = 0;
        ran.value = false;
    }

    // Vedi browse.forget: si toglie dalla lista locale invece di ricaricare.
    function forget(mediaIds) {
        const gone = new Set(mediaIds);
        media.value = media.value.filter((m) => !gone.has(m.media_id));
        total.value = Math.max(0, total.value - gone.size);
    }

    return { filters, media, total, ran, hasMore, run, loadMore, reset, forget };
});

export default useSearchStore;
