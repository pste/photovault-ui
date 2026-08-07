<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { api } from '@/plugins/api';

const stats = ref(null);
const others = ref(null);
let timer = null;

// Le fasi della pipeline, ognuna con quanto è fatto e su quanto.
//
// La barra è il punto della pagina: "242.256 da fare" non dice se manca tanto o
// poco, mentre una barra al 28% lo dice senza far fare un conto. Per lo stesso
// motivo accanto compare il numero in errore: una barra che si ferma al 98% e
// non arriva mai a 100 è incomprensibile finché non si vede che il resto non è
// in coda, è fallito.
const fasi = computed(() => {
    if (!stats.value) {
        return [];
    }
    const s = stats.value;
    return [
        {
            key: 'thumb',
            label: 'Anteprime',
            done: s.thumb_done,
            total: s.media_total,
            error: s.thumb_error,
            nota: 'Generate dal job thumbs. Sono il presupposto di duplicati simili ed etichette.',
        },
        {
            key: 'hash',
            label: 'Hash esatti (sha256)',
            done: s.hash_done,
            total: s.media_total,
            error: 0,
            nota: 'Servono a trovare i duplicati identici. Il job dedup li calcola leggendo gli originali.',
        },
        {
            key: 'dhash',
            label: 'Hash percettivi (dHash)',
            done: s.dhash_done,
            total: s.dhash_total,
            error: 0,
            nota: 'Solo immagini, e solo dopo l\'anteprima: è dalla thumbnail che si calcolano.',
        },
        {
            key: 'place',
            label: 'Luoghi',
            done: s.place_done,
            total: s.media_total,
            error: 0,
            nota: 'Dal GPS dell\'EXIF o dal nome delle cartelle. Non aspettano le anteprime.',
        },
        {
            key: 'label',
            label: 'Etichette di scena',
            done: s.label_done,
            total: s.media_total,
            error: 0,
            nota: 'CLIP sulla thumbnail media. Il job non è ancora in esercizio.',
        },
    ];
});

const riepilogo = computed(() => {
    if (!stats.value) {
        return [];
    }
    const s = stats.value;
    const righe = [
        { label: 'Media', value: format(s.media_total) },
        { label: 'Immagini', value: format(s.images) },
        { label: 'Video', value: format(s.videos) },
        { label: 'Spazio occupato', value: formatSize(s.bytes_total) },
    ];
    if (others.value) {
        righe.push({ label: 'File non gestiti', value: format(others.value.files) });
    }
    // Zero è il caso normale e non merita una riga: compare solo se c'è qualcosa
    // da guardare, cioè file che erano sulla share e non ci sono più.
    if (s.missing > 0) {
        righe.push({ label: 'Mancanti dalla share', value: format(s.missing), warn: true });
    }
    return righe;
});

function percent(fase) {
    if (!fase.total) {
        return 0;
    }
    return Math.round((fase.done / fase.total) * 1000) / 10;
}

function format(n) {
    return Number(n || 0).toLocaleString('it-IT');
}

// toFixed dà sempre il punto decimale, che in italiano è il separatore delle
// migliaia: "1.08 TB" accanto a "338.608 media" si legge come mille volte tanto.
function formatSize(bytes) {
    const n = Number(bytes || 0);
    if (n >= 1024 ** 4) {
        return `${decimali(n / 1024 ** 4, 2)} TB`;
    }
    if (n >= 1024 ** 3) {
        return `${decimali(n / 1024 ** 3, 1)} GB`;
    }
    return `${decimali(n / 1024 ** 2, 0)} MB`;
}

function decimali(n, cifre) {
    return n.toLocaleString('it-IT', { minimumFractionDigits: cifre, maximumFractionDigits: cifre });
}

async function load() {
    stats.value = await api.get('/stats');
    others.value = await api.get('/others/stats');
}

// Le code si svuotano mentre la pagina è aperta: senza un aggiornamento
// periodico si guarderebbe una fotografia vecchia di ore credendola attuale.
onMounted(() => {
    load();
    timer = setInterval(load, 30000);
});
onUnmounted(() => clearInterval(timer));
</script>

<template>
    <div>
        <div v-if="!stats" class="empty-state">Caricamento…</div>

        <template v-else>
            <div class="stat-summary">
                <div v-for="r in riepilogo" :key="r.label" class="stat-card">
                    <div class="stat-value" :class="{ 'is-warn': r.warn }">{{ r.value }}</div>
                    <div class="stat-label">{{ r.label }}</div>
                </div>
            </div>

            <h3 class="section-title">Avanzamento della pipeline</h3>

            <div v-for="fase in fasi" :key="fase.key" class="stat-row">
                <div class="stat-row-head">
                    <span class="stat-row-label">{{ fase.label }}</span>
                    <span class="stat-row-numbers">
                        {{ format(fase.done) }} / {{ format(fase.total) }}
                        <span v-if="fase.error > 0" class="stat-row-error">
                            · {{ format(fase.error) }} in errore
                        </span>
                    </span>
                </div>
                <ProgressBar :value="percent(fase)" />
                <div class="stat-row-note">{{ fase.nota }}</div>
            </div>
        </template>
    </div>
</template>
