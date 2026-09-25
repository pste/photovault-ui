import { ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';
import useLoadingStore from '@/stores/loading';
import { useLatest } from '@/composables/useLatest';

const PAGE_SIZE = 100;

const useTrashStore = defineStore('trash', () => {
    const items = ref([]);
    const stats = ref(null);
    const status = ref('done');

    // Cambiare stato mentre la risposta precedente e' in volo: vale l'ultima.
    const latest = useLatest();

    async function load() {
        const loading = useLoadingStore();
        const token = latest.start();
        loading.start();
        try {
            const newItems = await api.get('/trash', { status: status.value, size: PAGE_SIZE });
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
        await load();
    }

    return { items, stats, status, load, setStatus };
});

export default useTrashStore;
