import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Il visore non e' una rotta ma un parametro della query, ?m=<media_id>: cosi'
// l'immagine e' linkabile e il tasto Indietro chiude il visore invece di uscire
// dalla pagina. Sfoglia e Ricerca lo usano allo stesso modo.
export function useLightboxRoute() {
    const route = useRoute();
    const router = useRouter();

    const openedId = computed(() => {
        const id = parseInt(route.query.m, 10);
        return Number.isNaN(id) ? null : id;
    });

    function openMedia(item) {
        router.push({ query: { ...route.query, m: item.media_id } });
    }

    function closeMedia() {
        const query = { ...route.query };
        delete query.m;
        router.push({ query });
    }

    // replace e non push: scorrere con le frecce non deve riempire la
    // cronologia, altrimenti Indietro ripercorrerebbe foto per foto.
    function navigateMedia(media_id) {
        router.replace({ query: { ...route.query, m: media_id } });
    }

    return { openedId, openMedia, closeMedia, navigateMedia };
}
