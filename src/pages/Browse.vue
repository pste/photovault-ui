<script setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useBrowseStore from '@/stores/browse';
import FolderTile from '@/components/FolderTile.vue';
import MediaGrid from '@/components/MediaGrid.vue';
import Lightbox from '@/components/Lightbox.vue';

const route = useRoute();
const router = useRouter();
const browse = useBrowseStore();

const folderId = computed(() => {
    const id = parseInt(route.params.folderId, 10);
    return Number.isNaN(id) ? null : id;
});

// Il visore non e' una rotta ma un parametro della query: cosi' l'immagine e'
// linkabile e il tasto Indietro chiude il visore invece di uscire dalla cartella.
const openedId = computed(() => {
    const id = parseInt(route.query.m, 10);
    return Number.isNaN(id) ? null : id;
});

// Briciole di pane: la radice della root e' sempre la prima voce.
const crumbs = computed(() => {
    const items = browse.breadcrumb.map((b) => ({
        label: b.name,
        route: { name: 'folder', params: { folderId: b.folder_id } },
    }));
    return items;
});

function openMedia(item) {
    router.push({ query: { ...route.query, m: item.media_id } });
}

function closeMedia() {
    const query = { ...route.query };
    delete query.m;
    router.push({ query });
}

function navigateMedia(media_id) {
    router.replace({ query: { ...route.query, m: media_id } });
}

watch(folderId, (id) => browse.open(id), { immediate: true });
</script>

<template>
    <div>
        <Breadcrumb
            v-if="crumbs.length > 0"
            :home="{ icon: 'pi pi-home', route: { name: 'browse' } }"
            :model="crumbs"
            class="mb-3"
        >
            <template #item="{ item }">
                <RouterLink v-if="item.route" :to="item.route" class="no-underline text-color">
                    <i v-if="item.icon" :class="item.icon"></i>
                    <span v-else>{{ item.label }}</span>
                </RouterLink>
            </template>
        </Breadcrumb>

        <div v-if="browse.subfolders.length > 0">
            <h2 class="section-title">Cartelle</h2>
            <div class="tile-grid mb-4">
                <FolderTile v-for="f in browse.subfolders" :key="f.folder_id" :folder="f" />
            </div>
        </div>

        <div v-if="browse.media.length > 0">
            <h2 class="section-title">{{ browse.total }} file</h2>
            <MediaGrid
                :items="browse.media"
                :has-more="browse.hasMore"
                :on-load-more="browse.loadMore"
                @open="openMedia"
                @trashed="browse.forget"
            />
        </div>

        <div v-if="browse.isEmpty" class="empty-state">
            <p>Questa cartella è vuota.</p>
            <p v-if="browse.roots.length === 0">
                Nessuna radice configurata: lancia una scansione dalla pagina Job.
            </p>
        </div>

        <Lightbox
            :media-id="openedId"
            :items="browse.media"
            @close="closeMedia"
            @navigate="navigateMedia"
        />
    </div>
</template>
