import { ref, computed } from 'vue';

// Selezione multipla di cartelle e media.
//
// Sta in un composable e non dentro la griglia perche' da quando si possono
// selezionare anche le cartelle la selezione non e' piu' una proprieta' della
// griglia: e' una proprieta' della pagina, che mostra due elenchi diversi e
// deve contarli insieme.
export function useSelection() {
    const selecting = ref(false);
    const media = ref(new Set());
    const folders = ref(new Set());

    const count = computed(() => media.value.size + folders.value.size);

    // I Set si sostituiscono invece di mutarli: Vue non e' reattivo sulle
    // mutazioni di Set, e una add() non farebbe ridisegnare niente.
    function toggle(set, id) {
        const next = new Set(set.value);
        if (!next.delete(id)) {
            next.add(id);
        }
        set.value = next;
    }

    const toggleMedia = (item) => toggle(media, item.media_id);
    const toggleFolder = (folder) => toggle(folders, folder.folder_id);

    function start() {
        selecting.value = true;
    }

    function stop() {
        selecting.value = false;
        media.value = new Set();
        folders.value = new Set();
    }

    return { selecting, media, folders, count, toggleMedia, toggleFolder, start, stop };
}

export default useSelection;
