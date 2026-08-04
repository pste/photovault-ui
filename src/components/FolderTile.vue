<script setup>
import { computed } from 'vue';
import { thumbURL } from '@/plugins/api';

const props = defineProps({
    folder: { type: Object, required: true },
});

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
    <RouterLink
        :to="{ name: 'folder', params: { folderId: folder.folder_id } }"
        class="folder-tile clickable block no-underline text-color"
    >
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
    </RouterLink>
</template>
