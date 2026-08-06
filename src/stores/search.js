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

    const hasMore = computed(() => media.value.length < total.value);

    async function fetchPage(append) {
        const data = await api.get('/search', {
            ...filters.value,
            page: page.value,
            size: PAGE_SIZE,
        });
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
            page.value = 0;
            await fetchPage(false);
        }
        finally {
            loading.stop();
        }
    }

    async function loadMore() {
        if (!hasMore.value) {
            return;
        }
        page.value += 1;
        await fetchPage(true);
    }

    function reset() {
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
