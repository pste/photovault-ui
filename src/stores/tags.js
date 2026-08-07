import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';
import useLoadingStore from '@/stores/loading';

// Stato della pagina di gestione dei tag.
//
// Niente paginazione lato server, a differenza di "Altri file": i tag sono
// qualche centinaio, non decine di migliaia, e averli tutti in memoria permette
// di cercare e ordinare senza tornare all'API a ogni tasto.
const useTagsStore = defineStore('tags', () => {
    const items = ref([]);
    const kinds = ref([]);
    const kind = ref(null);
    const search = ref('');
    const showBlocked = ref(false);

    // I bloccati sono lapidi: servono a impedire il ritorno di un tag, non a
    // essere guardati tutti i giorni. Restano fuori finche' non si chiedono.
    const visible = computed(() => {
        const q = search.value.trim().toLowerCase();
        return items.value.filter((t) => {
            if (!showBlocked.value && t.blocked) {
                return false;
            }
            if (kind.value && t.kind !== kind.value) {
                return false;
            }
            return q.length === 0 || t.display_name.toLowerCase().includes(q);
        });
    });

    const totale = computed(() => visible.value.reduce((sum, t) => sum + t.usage, 0));

    async function load() {
        const loading = useLoadingStore();
        loading.start();
        try {
            items.value = await api.get('/tags/manage');
            kinds.value = await api.get('/tags/kinds');
        }
        finally {
            loading.stop();
        }
    }

    async function update(tag_id, changes) {
        await api.patch(`/tags/${tag_id}`, changes);
        await load();
    }

    async function merge(fromId, intoId) {
        const res = await api.post(`/tags/${fromId}/merge`, { into: intoId });
        await load();
        return res;
    }

    async function clear(tag_id) {
        const res = await api.post(`/tags/${tag_id}/clear`);
        await load();
        return res;
    }

    return { items, kinds, kind, search, showBlocked, visible, totale, load, update, merge, clear };
});

export default useTagsStore;
