<script setup>
import { computed } from 'vue';
import { thumbURL } from '@/plugins/api';

const props = defineProps({
    item: { type: Object, required: true },
});

defineEmits(['open']);

// La thumbnail esiste solo quando il job l'ha generata: finche' e' pendente si
// mostra un segnaposto invece di un'immagine rotta.
const hasThumb = computed(() => props.item.thumb_status === 'done');

const duration = computed(() => {
    if (props.item.media_kind !== 'video' || !props.item.duration_s) {
        return null;
    }
    const total = Math.round(Number(props.item.duration_s));
    const mm = Math.floor(total / 60);
    const ss = String(total % 60).padStart(2, '0');
    return `${mm}:${ss}`;
});
</script>

<template>
    <div class="media-tile clickable" :title="item.file_name" @click="$emit('open', item)">
        <img
            v-if="hasThumb"
            :src="thumbURL(item.media_id, 's', item.v)"
            :alt="item.file_name"
            loading="lazy"
            decoding="async"
            width="320"
            height="320"
        />
        <div v-else class="media-placeholder">
            <i :class="item.media_kind === 'video' ? 'pi pi-video' : 'pi pi-image'"></i>
        </div>

        <span v-if="duration" class="media-badge">{{ duration }}</span>
    </div>
</template>
