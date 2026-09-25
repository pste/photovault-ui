import { ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';

// Chi e' dentro. La sessione vera vive nel cookie, che la pagina non puo'
// leggere (e' HttpOnly): qui c'e' solo il nome, chiesto all'API con /me.
const useSessionStore = defineStore('session', () => {
    const user = ref(null);
    const checked = ref(false);

    // Una volta per caricamento della pagina: il router la chiama alla prima
    // navigazione. Un 401 qui non e' un errore, vuol dire "non sei dentro".
    async function load() {
        if (!checked.value) {
            try {
                user.value = await api.get('/me', null, { quiet: true });
            }
            catch {
                user.value = null;
            }
            checked.value = true;
        }
        return user.value;
    }

    async function login(username, password) {
        user.value = await api.post('/login', { username, password }, { quiet: true });
        checked.value = true;
        return user.value;
    }

    async function logout() {
        await api.post('/logout');
        user.value = null;
    }

    // L'API ha risposto 401 a una chiamata qualsiasi: la sessione e' scaduta
    // o e' stata chiusa (utente eliminato, logout da un'altra scheda).
    function expired() {
        user.value = null;
    }

    return { user, checked, load, login, logout, expired };
});

export default useSessionStore;
