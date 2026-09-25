import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';
import useLoadingStore from '@/stores/loading';
import { useLatest } from '@/composables/useLatest';

const PAGE_SIZE = 100;

// Stato della pagina "Altri file": i file che photovault non gestisce, cioe'
// tutto quello che sulla share non e' immagine ne' video. La paginazione e' lato
// server perche' su una share vera possono essere decine di migliaia.
const useOthersStore = defineStore('others', () => {
    const items = ref([]);
    const stats = ref(null);
    const total = ref(0);
    const page = ref(0);
    const ext = ref(null);
    const sort = ref('size');

    // Pagina, filtro e ordinamento cambiano a raffica: vale solo l'ultima.
    const latest = useLatest();

    const pageSize = PAGE_SIZE;
    const offset = computed(() => page.value * PAGE_SIZE);

    async function load() {
        const loading = useLoadingStore();
        const token = latest.start();
        loading.start();
        try {
            const data = await api.get('/others', {
                ext: ext.value,
                sort: sort.value,
                page: page.value,
                size: PAGE_SIZE,
            });
            const newStats = await api.get('/others/stats');
            if (!latest.isCurrent(token)) {
                return;
            }
            items.value = data.items;
            total.value = data.total;
            stats.value = newStats;
        }
        finally {
            loading.stop();
        }
    }

    async function goToPage(newPage) {
        page.value = newPage;
        await load();
    }

    async function filterByExt(newExt) {
        ext.value = newExt || null;
        page.value = 0;
        await load();
    }

    async function sortBy(newSort) {
        sort.value = newSort;
        page.value = 0;
        await load();
    }

    // Cestina e ricarica: l'API esclude gia' dalla lista cio' che ha una
    // richiesta pendente, quindi la pagina ricaricata e' subito quella giusta.
    async function trash(otherIds) {
        const res = await api.post('/trash', { other_ids: otherIds });
        await load();
        return res;
    }

    return {
        items, stats, total, page, ext, sort, pageSize, offset,
        load, goToPage, filterByExt, sortBy, trash,
    };
});

export default useOthersStore;
