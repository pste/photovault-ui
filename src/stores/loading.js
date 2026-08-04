import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

// Contatore invece di un booleano: con piu' chiamate in volo, la prima che
// finisce spegnerebbe la barra mentre le altre stanno ancora caricando.
const useLoadingStore = defineStore('loading', () => {
    const pending = ref(0);
    const isLoading = computed(() => pending.value > 0);

    function start() {
        pending.value += 1;
    }

    function stop() {
        if (pending.value > 0) {
            pending.value -= 1;
        }
    }

    return { pending, isLoading, start, stop };
});

export default useLoadingStore;
