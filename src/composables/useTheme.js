import { ref, watch } from 'vue';

// PrimeVue e' configurato con darkModeSelector: '.dark-mode' (src/plugins/index.js):
// tutto il tema, e tutte le variabili --p-* usate in style.css, cambiano insieme
// a questa singola classe sull'elemento <html>.
const STORAGE_KEY = 'photovault.theme';

// Scuro di default: e' un'app per guardare foto, e uno sfondo chiaro attorno a
// una griglia di immagini ne falsa i colori. La scelta dell'utente, se c'e',
// vince sempre.
const isDark = ref(localStorage.getItem(STORAGE_KEY) !== 'light');

// Lo stato vive nel modulo, non dentro la funzione: il tema e' uno solo per
// tutta l'applicazione, e questa riga viene eseguita al primo import, cioe'
// prima del mount. Cosi' la pagina non lampeggia in chiaro prima di diventare
// scura.
applyToDocument();

watch(isDark, () => {
    applyToDocument();
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light');
});

function applyToDocument() {
    document.documentElement.classList.toggle('dark-mode', isDark.value);
}

export default function useTheme() {
    function toggle() {
        isDark.value = !isDark.value;
    }

    return { isDark, toggle };
}
