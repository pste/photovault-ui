import logger from '@/plugins/logger';
import useErrorsStore from '@/stores/errors';

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

async function request(method, url, { query, body } = {}) {
    const errors = useErrorsStore();
    const address = buildURL(url, query);

    try {
        const res = await fetch(address, {
            method,
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `Errore ${res.status}`);
        }
        return await res.json();
    }
    catch(err) {
        logger.error(`API ${method} ${address}`, err);
        errors.push(err.message);
        throw err;
    }
}

export const api = {
    get: (url, query) => request('GET', url, { query }),
    post: (url, body) => request('POST', url, { body }),
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

export default {
    install: (app) => {
        app.provide('API', api);
    }
}
