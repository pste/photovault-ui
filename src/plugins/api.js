import logger from '@/plugins/logger';
import useErrorsStore from '@/stores/errors';
import useSessionStore from '@/stores/session';

// In produzione UI e API stanno sullo stesso host: l'ingress manda / alla UI e
// /api all'API, quindi un percorso relativo basta. In sviluppo il dev server di
// Vite e' su un'altra porta, e serve VITE_APIURL.
export const apiURL = import.meta.env.VITE_APIURL || '/api';

function buildURL(url, query) {
    let address = apiURL.replace(/\/$/, '') + url;
    if (query) {
        // I parametri non valorizzati non vanno spediti: l'API li tratta come
        // filtri spenti solo se sono assenti, non se sono stringa vuota.
        const clean = {};
        for (const [key, value] of Object.entries(query)) {
            if (value !== null && value !== undefined && value !== '') {
                clean[key] = value;
            }
        }
        const qs = new URLSearchParams(clean).toString();
        if (qs) {
            address += '?' + qs;
        }
    }
    return address;
}

// quiet: l'errore non diventa un toast. Serve agli aggiornamenti in
// background, che falliscono a ogni giro finche' l'API non torna: un toast ogni
// trenta secondi non aggiunge informazione, la copre.
async function request(method, url, { query, body, quiet } = {}) {
    const errors = useErrorsStore();
    const address = buildURL(url, query);

    try {
        // credentials include: in produzione UI e API stanno sullo stesso host e
        // il cookie partirebbe comunque, ma in sviluppo stanno su porte diverse.
        const res = await fetch(address, {
            method,
            credentials: 'include',
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        });

        // Sessione scaduta o chiusa: il momento di tornare al login. Ci pensa
        // App.vue, che guarda lo store.
        if (res.status === 401 && !quiet) {
            useSessionStore().expired();
        }

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const err = new Error(data.error || `Errore ${res.status}`);
            err.status = res.status;
            throw err;
        }
        return await res.json();
    }
    catch(err) {
        // Un 401 non e' un guasto: e' "non sei dentro", e se ne occupa il
        // ritorno al login. Ne' log ne' toast.
        if (err.status !== 401) {
            logger.error(`API ${method} ${address}`, err);
            if (!quiet) {
                errors.push(err.message);
            }
        }
        throw err;
    }
}

export const api = {
    get: (url, query, options) => request('GET', url, { query, ...options }),
    post: (url, body, options) => request('POST', url, { body, ...options }),
    patch: (url, body) => request('PATCH', url, { body }),
    del: (url) => request('DELETE', url),
};

// URL diretti verso i file: non passano da fetch, finiscono in <img> e <video>.
// La thumbnail porta ?v=<updated>, che rende corretta la cache immutable.
export function thumbURL(media_id, size, v) {
    return buildURL(`/thumb/${media_id}/${size}`, { v });
}

export function originalURL(media_id) {
    return buildURL(`/media/${media_id}/original`);
}

// Scaricare un file non gestito e' l'unico modo per sapere cosa sia: la pagina
// ne mostra percorso e dimensione, ma un .dat da 3 GB si giudica solo aprendolo.
export function otherDownloadURL(other_id) {
    return buildURL(`/others/${other_id}/download`);
}

export default {
    install: (app) => {
        app.provide('API', api);
    }
}
