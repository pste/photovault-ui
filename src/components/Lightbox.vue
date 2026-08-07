<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { api, thumbURL, originalURL } from '@/plugins/api';

const props = defineProps({
    mediaId: { type: [Number, null], default: null },
    // Elenco corrente, per navigare avanti e indietro senza uscire dal visore.
    items: { type: Array, default: () => [] },
});

const emit = defineEmits(['close', 'navigate']);

const detail = ref(null);

const visible = computed({
    get: () => props.mediaId !== null,
    set: (value) => { if (!value) { emit('close'); } },
});

const index = computed(() => props.items.findIndex((m) => m.media_id === props.mediaId));
const isVideo = computed(() => detail.value?.media_kind === 'video');

async function load(id) {
    detail.value = null;
    if (id === null) {
        return;
    }
    detail.value = await api.get(`/media/${id}`);
}

function step(delta) {
    const next = index.value + delta;
    if (next >= 0 && next < props.items.length) {
        emit('navigate', props.items[next].media_id);
    }
}

function onKey(event) {
    if (props.mediaId === null) {
        return;
    }
    if (event.key === 'ArrowRight') {
        step(1);
    }
    else if (event.key === 'ArrowLeft') {
        step(-1);
    }
}

function formatSize(bytes) {
    if (!bytes) {
        return '';
    }
    const mb = Number(bytes) / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
}

function formatDate(value) {
    if (!value) {
        return '';
    }
    return new Date(value).toLocaleString('it-IT');
}

watch(() => props.mediaId, load, { immediate: true });

onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<template>
    <!-- La misura sta in style.css e non qui: da telefono la finestra diventa
         piena e la foto cede altezza ai dati, e una regola inline non potrebbe
         cambiare al variare della larghezza. -->
    <Dialog v-model:visible="visible" maximizable modal :header="detail?.file_name || ''" class="lightbox-dialog">
        <div class="flex flex-column h-full">
            <div class="lightbox-body flex-1">
                <video v-if="isVideo" :src="originalURL(mediaId)" controls autoplay></video>
                <img
                    v-else-if="detail && detail.thumb_status === 'done'"
                    :src="thumbURL(mediaId, 'm', detail.v)"
                    :alt="detail.file_name"
                />
                <div v-else class="empty-state">Anteprima non ancora generata</div>
            </div>

            <div v-if="detail" class="lightbox-info">
                <dl>
                    <dt>Cartella</dt><dd>{{ detail.folder_path }}</dd>
                    <dt>Scatto</dt><dd>{{ formatDate(detail.capture_ts) }}</dd>
                    <dt>Dimensioni</dt>
                    <dd>{{ detail.width }} × {{ detail.height }} — {{ formatSize(detail.file_size) }}</dd>
                    <dt v-if="detail.camera_model">Fotocamera</dt>
                    <dd v-if="detail.camera_model">{{ detail.camera_make }} {{ detail.camera_model }}</dd>
                    <dt v-if="detail.tags?.length">Tag</dt>
                    <dd v-if="detail.tags?.length">
                        <Chip v-for="t in detail.tags" :key="t.tag_id" :label="t.display_name" class="mr-1" />
                    </dd>
                </dl>
            </div>
        </div>

        <template #footer>
            <Button icon="pi pi-chevron-left" text :disabled="index <= 0" @click="step(-1)" />
            <span class="mx-2">{{ index + 1 }} / {{ items.length }}</span>
            <Button icon="pi pi-chevron-right" text :disabled="index < 0 || index >= items.length - 1" @click="step(1)" />
            <a :href="originalURL(mediaId)" target="_blank" rel="noopener">
                <Button icon="pi pi-download" text label="Originale" />
            </a>
        </template>
    </Dialog>
</template>
