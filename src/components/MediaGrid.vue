<script setup>
import MediaTile from '@/components/MediaTile.vue';
import { useInfiniteScroll } from '@/composables/useInfiniteScroll';

const props = defineProps({
    items: { type: Array, required: true },
    hasMore: { type: Boolean, default: false },
    onLoadMore: { type: Function, default: null },
});

const emit = defineEmits(['open']);

// La sentinella carica la pagina successiva solo se c'e' altro da caricare.
const { sentinel } = useInfiniteScroll(async () => {
    if (props.hasMore && props.onLoadMore) {
        await props.onLoadMore();
    }
});
</script>

<template>
    <div>
        <div class="tile-grid">
            <MediaTile
                v-for="item in items"
                :key="item.media_id"
                :item="item"
                @open="emit('open', $event)"
            />
        </div>
        <div ref="sentinel" class="sentinel"></div>
    </div>
</template>
