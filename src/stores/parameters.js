import { ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';

const useParametersStore = defineStore('parameters', () => {
    const params = ref(null);

    // Caricamento pigro e idempotente: piu' componenti possono chiamarlo
    // senza doversi coordinare.
    async function load() {
        if (params.value) {
            return params.value;
        }
        params.value = await api.get('/parameters');
        return params.value;
    }

    async function save(values) {
        params.value = await api.post('/parameters', values);
        return params.value;
    }

    return { params, load, save };
});

export default useParametersStore;
