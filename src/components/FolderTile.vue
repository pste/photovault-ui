<script setup>
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { thumbURL } from '@/plugins/api';

const props = defineProps({
    folder: { type: Object, required: true },
    selecting: { type: Boolean, default: false },
    selected: { type: Boolean, default: false },
});

const emit = defineEmits(['toggle']);

// In modalita' selezione la tile smette di essere un link: diventa un div.
//
// Non basta un preventDefault sul click: il gestore interno di RouterLink gira
// per primo e la navigazione parte comunque -- verificato, la pagina cambiava
// cartella mentre si tentava di spuntarla. Cosi' invece il link non esiste
// proprio, che e' anche piu' onesto per chi naviga da tastiera: sparisce un
// bersaglio che non porterebbe da nessuna parte.
const tag = computed(() => (props.selecting ? 'div' : RouterLink));

function onClick() {
    if (props.selecting) {
        emit('toggle', props.folder);
    }
}

// Al massimo quattro anteprime: il mosaico e' 2x2.
const previews = computed(() => (props.folder.previews || []).slice(0, 4));

const meta = computed(() => {
    const parts = [];
    if (props.folder.sub_count > 0) {
        parts.push(`${props.folder.sub_count} cartelle`);
    }
    if (props.folder.media_count > 0) {
        parts.push(`${props.folder.media_count} file`);
    }
    return (parts.length > 0) ? parts.join(' · ') : 'vuota';
});
</script>

<template>
    <component
        :is="tag"
        :to="selecting ? undefined : { name: 'folder', params: { folderId: folder.folder_id } }"
        class="folder-tile clickable block no-underline text-color"
        :class="{ 'is-selected': selected }"
        @click="onClick"
    >
        <span v-if="selecting" class="media-check">
            <i :class="selected ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
        </span>

        <div v-if="previews.length > 0" class="folder-mosaic" :class="{ 'is-single': previews.length === 1 }">
            <div v-for="p in previews" :key="p.media_id" class="folder-mosaic-cell">
                <img :src="thumbURL(p.media_id, 's', p.v)" alt="" loading="lazy" decoding="async" />
            </div>
        </div>
        <div v-else class="folder-empty">
            <i class="pi pi-folder"></i>
        </div>

        <div class="folder-caption">
            <div class="folder-name" :title="folder.name">{{ folder.name }}</div>
            <div class="folder-meta">{{ meta }}</div>
        </div>
    </component>
</template>
