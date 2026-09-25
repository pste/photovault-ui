<script setup>
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import useSearchStore from '@/stores/search';
import MediaGrid from '@/components/MediaGrid.vue';
import SelectionBar from '@/components/SelectionBar.vue';
import { useSelection } from '@/composables/useSelection';
import { useLightboxRoute } from '@/composables/useLightboxRoute';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { api } from '@/plugins/api';
import Lightbox from '@/components/Lightbox.vue';

const route = useRoute();
const search = useSearchStore();
const selection = useSelection();
const { openedId, openMedia, closeMedia, navigateMedia } = useLightboxRoute();
const confirm = useConfirm();
const toast = useToast();

// Nei risultati di ricerca si selezionano solo file: le cartelle non compaiono.
// La proposta di togliere la cartella svuotata resta a Sfoglia, dove si sa in
// quale cartella si e'.
function confirmTrash() {
    const n = selection.media.value.size;
    confirm.require({
        header: 'Sposta nel cestino',
        message: `${n} ${n === 1 ? 'file verra' : 'file verranno'} spostati in .photovault/trash/.
            Niente viene cancellato: resta sul NAS finche' non scade la ritenzione.`,
        icon: 'pi pi-trash',
        acceptLabel: 'Cestina',
        rejectLabel: 'Annulla',
        accept: async () => {
            const media_ids = [...selection.media.value];
            const res = await api.post('/trash', { media_ids });
            toast.add({
                severity: 'success',
                summary: 'Spostati nel cestino',
                detail: `${res.cestinati} file in coda: il job trashapply li sposta entro un quarto d'ora.`,
                life: 5000,
            });
            selection.stop();
            search.forget(media_ids);
        },
    });
}

const kinds = [
    { label: 'Tutto', value: '' },
    { label: 'Foto', value: 'image' },
    { label: 'Video', value: 'video' },
];

// La query nell'URL e' la fonte di verita': cosi' una ricerca e' condivisibile
// e il tasto Indietro riporta ai risultati precedenti.
function runFromRoute() {
    const q = route.query.q || '';
    if (q || search.filters.q) {
        search.run({ q });
    }
}

onMounted(runFromRoute);
watch(() => route.query.q, runFromRoute);
</script>

<template>
    <div>
        <div class="flex align-items-center gap-3 mb-3">
            <SelectButton
                v-model="search.filters.kind"
                :options="kinds"
                option-label="label"
                option-value="value"
                @change="search.run()"
            />
            <DatePicker v-model="search.filters.from" placeholder="Da" date-format="yy-mm-dd" show-icon @date-select="search.run()" />
            <DatePicker v-model="search.filters.to" placeholder="A" date-format="yy-mm-dd" show-icon @date-select="search.run()" />
            <Button label="Azzera" icon="pi pi-times" text @click="search.reset()" />
        </div>

        <h2 v-if="search.ran" class="section-title">{{ search.total }} risultati</h2>

        <SelectionBar
            v-if="search.media.length > 0"
            :selecting="selection.selecting.value"
            :media="selection.media.value.size"
            @start="selection.start"
            @stop="selection.stop"
            @trash="confirmTrash"
        />

        <MediaGrid
            v-if="search.media.length > 0"
            :items="search.media"
            :has-more="search.hasMore"
            :on-load-more="search.loadMore"
            :selecting="selection.selecting.value"
            :selected="selection.media.value"
            @open="openMedia"
            @toggle="selection.toggleMedia"
        />

        <div v-else-if="search.ran" class="empty-state">Nessun risultato.</div>
        <div v-else class="empty-state">Scrivi qualcosa nella barra in alto.</div>

        <ConfirmDialog />

        <Lightbox :media-id="openedId" :items="search.media" @close="closeMedia" @navigate="navigateMedia" />
    </div>
</template>
