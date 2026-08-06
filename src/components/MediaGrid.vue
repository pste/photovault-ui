<script setup>
import { ref, computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import MediaTile from '@/components/MediaTile.vue';
import { api } from '@/plugins/api';
import { useInfiniteScroll } from '@/composables/useInfiniteScroll';

const props = defineProps({
    items: { type: Array, required: true },
    hasMore: { type: Boolean, default: false },
    onLoadMore: { type: Function, default: null },
});

const emit = defineEmits(['open', 'trashed']);

const confirm = useConfirm();
const toast = useToast();

// La selezione vive qui e non nelle pagine: Sfoglia e Ricerca mostrano la
// stessa griglia, e duplicare lo stato in due posti significherebbe due
// comportamenti che divergono alla prima modifica.
const selecting = ref(false);
const selected = ref(new Set());

const count = computed(() => selected.value.size);

function toggle(item) {
    // Set non e' reattivo sulle mutazioni: si sostituisce l'oggetto.
    const next = new Set(selected.value);
    if (!next.delete(item.media_id)) {
        next.add(item.media_id);
    }
    selected.value = next;
}

function stopSelecting() {
    selecting.value = false;
    selected.value = new Set();
}

function confirmTrash() {
    const n = count.value;
    confirm.require({
        header: 'Sposta nel cestino',
        message: `${n} ${n === 1 ? 'file verra' : 'file verranno'} spostati in .photovault/trash/.
            I file non vengono cancellati: restano sul NAS finche' non scade la ritenzione.`,
        icon: 'pi pi-trash',
        acceptLabel: 'Cestina',
        rejectLabel: 'Annulla',
        accept: trashSelected,
    });
}

async function trashSelected() {
    const media_ids = [...selected.value];
    const res = await api.post('/trash', { media_ids });
    toast.add({
        severity: 'success',
        summary: 'Spostati nel cestino',
        detail: `${res.cestinati} file in coda: il job trashapply li sposta entro un quarto d'ora.`,
        life: 5000,
    });
    stopSelecting();
    emit('trashed', media_ids);
}

// La sentinella carica la pagina successiva solo se c'e' altro da caricare.
const { sentinel } = useInfiniteScroll(async () => {
    if (props.hasMore && props.onLoadMore) {
        await props.onLoadMore();
    }
});
</script>

<template>
    <div>
        <div class="grid-toolbar">
            <Button
                v-if="!selecting"
                label="Seleziona"
                icon="pi pi-check-square"
                text
                @click="selecting = true"
            />
            <template v-else>
                <span class="grid-toolbar-count">{{ count }} selezionati</span>
                <Button
                    label="Cestina"
                    icon="pi pi-trash"
                    severity="danger"
                    :disabled="count === 0"
                    @click="confirmTrash"
                />
                <Button label="Annulla" icon="pi pi-times" text @click="stopSelecting" />
            </template>
        </div>

        <div class="tile-grid">
            <MediaTile
                v-for="item in items"
                :key="item.media_id"
                :item="item"
                :selecting="selecting"
                :selected="selected.has(item.media_id)"
                @open="emit('open', $event)"
                @toggle="toggle"
            />
        </div>
        <div ref="sentinel" class="sentinel"></div>

        <ConfirmDialog />
    </div>
</template>
