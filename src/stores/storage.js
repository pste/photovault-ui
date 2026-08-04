import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';

// Stato della share. Serve a distinguere in UI "manca il file" da "manca il NAS":
// la navigazione dei metadati continua a funzionare anche a NAS spento, perche'
// vive nel database, ma le immagini no.
const useStorageStore = defineStore('storage', () => {
    const status = ref(null);
    const available = computed(() => status.value === null || status.value.status === 'ok');

    async function check() {
        try {
            status.value = await api.get('/health/storage');
        }
        catch {
            status.value = { status: 'unavailable' };
        }
        return status.value;
    }

    return { status, available, check };
});

export default useStorageStore;
