<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useSearchStore from '@/stores/search';
import MediaGrid from '@/components/MediaGrid.vue';
import Lightbox from '@/components/Lightbox.vue';

const route = useRoute();
const router = useRouter();
const search = useSearchStore();

const kinds = [
    { label: 'Tutto', value: '' },
    { label: 'Foto', value: 'image' },
    { label: 'Video', value: 'video' },
];

const openedId = computed(() => {
    const id = parseInt(route.query.m, 10);
    return Number.isNaN(id) ? null : id;
});

function openMedia(item) {
    router.push({ query: { ...route.query, m: item.media_id } });
}

function closeMedia() {
    const query = { ...route.query };
    delete query.m;
    router.push({ query });
}

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

        <MediaGrid
            v-if="search.media.length > 0"
            :items="search.media"
            :has-more="search.hasMore"
            :on-load-more="search.loadMore"
            @open="openMedia"
            @trashed="search.forget"
        />

        <div v-else-if="search.ran" class="empty-state">Nessun risultato.</div>
        <div v-else class="empty-state">Scrivi qualcosa nella barra in alto.</div>

        <Lightbox :media-id="openedId" :items="search.media" @close="closeMedia" @navigate="(id) => router.replace({ query: { ...route.query, m: id } })" />
    </div>
</template>
