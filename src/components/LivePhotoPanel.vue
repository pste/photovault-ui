<script setup>
import { ref, computed, onMounted } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { api, thumbURL } from '@/plugins/api';
import { formatSize } from '@/plugins/format';

const confirm = useConfirm();
const toast = useToast();

const items = ref([]);
const total = ref(0);
const bytes = ref(0);
const aperto = ref(false);

// Le prime dodici bastano a capire di cosa si tratta: chi vuole controllarle
// tutte lo fa dalla griglia, non da un elenco di 525 righe.
const ANTEPRIME = 12;

const spazio = computed(() => formatSize(bytes.value));
const anteprime = computed(() => items.value.slice(0, ANTEPRIME));

async function load() {
    const data = await api.get('/livephotos', { size: ANTEPRIME });
    items.value = data.items;
    total.value = data.total;
    bytes.value = data.bytes_video;
}

function conferma() {
    confirm.require({
        header: 'Cestina i video, tieni le foto',
        message: `I ${total.value} video verranno spostati in .photovault/trash/, le foto
            restano dove sono. Come ogni cestinamento non è definitivo: i file restano sulla
            share fino alla scadenza della ritenzione e si recuperano con un mv.`,
        icon: 'pi pi-trash',
        acceptLabel: 'Cestina i video',
        rejectLabel: 'Annulla',
        accept: cestina,
    });
}

onMounted(load);

async function cestina() {
    const res = await api.post('/livephotos/trash-videos');
    await load();
    toast.add({
        severity: 'success',
        summary: 'Video in coda di cestinamento',
        detail: `${res.cestinati} video: il job trashapply li sposta entro un quarto d'ora.`,
        life: 6000,
    });
}
</script>

<template>
    <div v-if="total > 0" class="live-panel">
        <div class="live-head">
            <i class="pi pi-bolt"></i>
            <div>
                <div class="live-title">{{ total.toLocaleString('it-IT') }} Live Photo</div>
                <div class="live-note">
                    Ogni scatto è sulla share come foto <strong>e</strong> come video di
                    pochi secondi, quindi nella griglia occupa due riquadri.
                    I video pesano {{ spazio }} in tutto.
                </div>
            </div>
            <span class="flex-1"></span>
            <Button :label="aperto ? 'Nascondi' : 'Guarda'" text @click="aperto = !aperto" />
            <Button label="Cestina i video, tieni le foto" icon="pi pi-trash"
                    severity="danger" outlined @click="conferma" />
        </div>

        <div v-if="aperto" class="live-preview">
            <div v-for="row in anteprime" :key="row.video_id" class="live-pair">
                <img v-if="row.thumb_status === 'done'"
                     :src="thumbURL(row.still_id, 's', row.updated)" :alt="row.still_name" />
                <div v-else class="live-pair-empty"><i class="pi pi-image"></i></div>
                <div class="live-pair-name">{{ row.still_name }}</div>
                <div class="live-pair-meta">{{ Number(row.duration_s).toFixed(1) }} s di video</div>
            </div>
            <div v-if="total > anteprime.length" class="live-pair live-pair-more">
                + altre {{ (total - anteprime.length).toLocaleString('it-IT') }}
            </div>
        </div>

        <!-- Il pannello si porta dietro il proprio ConfirmDialog: la pagina che
             lo ospita non deve sapere che ne ha bisogno. Senza, il pulsante non
             faceva niente -- verificato cliccandolo. In fondo al template e non
             in mezzo, perche' fra un v-if e un v-else-if rompe la compilazione. -->
        <ConfirmDialog />
    </div>
</template>
