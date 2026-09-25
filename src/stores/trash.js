import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';
import useLoadingStore from '@/stores/loading';
import { useLatest } from '@/composables/useLatest';

const PAGE_SIZE = 100;

const useTrashStore = defineStore('trash', () => {
    const items = ref([]);
    const stats = ref(null);
    const status = ref('done');
    const page = ref(0);

    // Il totale per stato sta gia' nelle statistiche: nessuna richiesta in piu'.
    // Senza paginazione si vedevano solo i primi 100, e niente diceva che ce
    // n'erano altri.
    const totals = { done: 'nel_cestino', pending: 'in_attesa', purged: 'eliminati' };
    const total = computed(() => Number(stats.value?.[totals[status.value]] || 0));
    const pageSize = PAGE_SIZE;
    const offset = computed(() => page.value * PAGE_SIZE);

    // Cambiare stato mentre la risposta precedente e' in volo: vale l'ultima.
    const latest = useLatest();

    async function load() {
        const loading = useLoadingStore();
        const token = latest.start();
        loading.start();
        try {
            const newItems = await api.get('/trash', {
                status: status.value,
                page: page.value,
                size: PAGE_SIZE,
            });
            const newStats = await api.get('/trash/stats');
            if (!latest.isCurrent(token)) {
                return;
            }
            items.value = newItems;
            stats.value = newStats;
        }
        finally {
            loading.stop();
        }
    }

    async function setStatus(newStatus) {
        status.value = newStatus;
        page.value = 0;
        await load();
    }

    async function goToPage(newPage) {
        page.value = newPage;
        await load();
    }

    return { items, stats, status, total, pageSize, offset, load, setStatus, goToPage };
});

export default useTrashStore;
