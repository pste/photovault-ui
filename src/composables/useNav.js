import { ref } from 'vue';

// Stato del menu a scomparsa. Vive nel modulo e non dentro la funzione perche'
// il menu e' uno solo: lo apre TopBar e lo chiude SideMenu, che sono due
// componenti fratelli senza un genitore comune a cui appendere la proprieta'.
// Stesso motivo -- e stessa forma -- di useTheme.
const isOpen = ref(false);

export default function useNav() {
    function open() {
        isOpen.value = true;
    }

    function close() {
        isOpen.value = false;
    }

    return { isOpen, open, close };
}
