import { ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';
import useLoadingStore from '@/stores/loading';

const PAGE_SIZE = 20;

const useDuplicatesStore = defineStore('duplicates', () => {
    const groups = ref([]);
    const total = ref(0);
    const stats = ref(null);
    const status = ref('open');
    const kind = ref(null);
    const page = ref(0);

    async function load() {
        const loading = useLoadingStore();
        loading.start();
        try {
            const data = await api.get('/duplicates', {
                status: status.value,
                kind: kind.value,
                page: page.value,
                size: PAGE_SIZE,
            });
            groups.value = data.groups;
            total.value = data.total;
            stats.value = await api.get('/duplicates/stats');
        }
        finally {
            loading.stop();
        }
    }

    async function setFilter(newStatus, newKind) {
        status.value = newStatus;
        kind.value = newKind;
        page.value = 0;
        await load();
    }

    async function goToPage(newPage) {
        page.value = newPage;
        await load();
    }

    // action: 'trash' sposta nel cestino tutto tranne keepMediaId,
    //         'ignore' archivia il gruppo senza toccare i file.
    async function resolve(groupId, keepMediaId, action) {
        await api.post(`/duplicates/${groupId}/resolve`, {
            keep_media_id: keepMediaId,
            action,
        });
        // Si ricarica invece di rimuovere la scheda a mano: il gruppo risolto
        // esce dal filtro 'open' e i conteggi cambiano.
        await load();
    }

    return { groups, total, stats, status, kind, page, load, setFilter, goToPage, resolve };
});

export default useDuplicatesStore;
