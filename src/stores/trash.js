import { ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';
import useLoadingStore from '@/stores/loading';

const PAGE_SIZE = 100;

const useTrashStore = defineStore('trash', () => {
    const items = ref([]);
    const stats = ref(null);
    const status = ref('done');

    async function load() {
        const loading = useLoadingStore();
        loading.start();
        try {
            items.value = await api.get('/trash', { status: status.value, size: PAGE_SIZE });
            stats.value = await api.get('/trash/stats');
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
