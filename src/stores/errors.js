import { ref } from 'vue';
import { defineStore } from 'pinia';

// Raccoglie gli errori delle chiamate API. App.vue li mostra come toast:
// cosi' nessun componente deve occuparsi di come si segnala un errore.
const useErrorsStore = defineStore('errors', () => {
    const last = ref(null);

    function push(message) {
        last.value = { message, at: Date.now() };
    }

    function clear() {
        last.value = null;
    }

    return { last, push, clear };
});

export default useErrorsStore;
