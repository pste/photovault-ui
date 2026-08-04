import { onMounted, onUnmounted, ref } from 'vue';

// Infinite scroll su un elemento sentinella.
//
// Non si usa VirtualScroller: in griglia il numero di elementi per riga cambia
// con la larghezza della finestra, quindi servirebbe un itemSize fisso e una
// sessantina di righe di ricalcolo sul resize. Con <img loading="lazy"> il
// browser non scarica comunque le immagini fuori schermo, quindi il costo di
// rete e' gia' limitato senza virtualizzare.
export function useInfiniteScroll(onLoadMore) {
    const sentinel = ref(null);
    let observer = null;
    let busy = false;

    async function trigger() {
        if (busy) {
            return;
        }
        busy = true;
        try {
            await onLoadMore();
        }
        finally {
            busy = false;
        }
    }

    onMounted(() => {
        observer = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) {
                trigger();
            }
        }, { rootMargin: '400px' });

        if (sentinel.value) {
            observer.observe(sentinel.value);
        }
    });

    onUnmounted(() => {
        if (observer) {
            observer.disconnect();
        }
    });

    return { sentinel };
}
