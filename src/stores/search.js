import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';
import useLoadingStore from '@/stores/loading';
import { useLatest } from '@/composables/useLatest';

const PAGE_SIZE = 200;

// Il DatePicker restituisce un Date, e URLSearchParams lo spediva come
// "Fri Sep 25 2026 00:00:00 GMT+0200 (Central European Summer Time)", che
// PostgreSQL non sa leggere. Si mandano istanti ISO calcolati sull'ora locale:
// da inizio del primo giorno a fine dell'ultimo, cosi' "fino al 25" comprende
// il 25 -- a mezzanotte lo escludeva.
function dayStart(value) {
    if (!value) {
        return null;
    }
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

function dayEnd(value) {
    if (!value) {
        return null;
    }
    const d = new Date(value);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
}

const useSearchStore = defineStore('search', () => {
    const filters = ref({ q: '', kind: '', tag: '', from: '', to: '' });
    const media = ref([]);
    const total = ref(0);
    const page = ref(0);
    const ran = ref(false);

    // Le risposte di una ricerca superata si scartano invece di sovrascrivere
    // quella nuova.
    const latest = useLatest();

    const hasMore = computed(() => media.value.length < total.value);

    async function fetchPage(pageNumber, append) {
        const token = latest.peek();
        const data = await api.get('/search', {
            ...filters.value,
            from: dayStart(filters.value.from),
            to: dayEnd(filters.value.to),
            page: pageNumber,
            size: PAGE_SIZE,
        });
        if (!latest.isCurrent(token)) {
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
            latest.start();
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
        latest.start();
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
