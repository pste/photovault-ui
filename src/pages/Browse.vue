<script setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import useBrowseStore from '@/stores/browse';
import FolderTile from '@/components/FolderTile.vue';
import MediaGrid from '@/components/MediaGrid.vue';
import SelectionBar from '@/components/SelectionBar.vue';
import Lightbox from '@/components/Lightbox.vue';
import { useSelection } from '@/composables/useSelection';
import { api } from '@/plugins/api';

const route = useRoute();
const router = useRouter();
const browse = useBrowseStore();
const confirm = useConfirm();
const toast = useToast();
const selection = useSelection();

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

function confirmTrash() {
    const folders = selection.folders.value.size;
    const media = selection.media.value.size;
    const pezzi = [];
    if (folders > 0) {
        pezzi.push(`${folders} ${folders === 1 ? 'cartella' : 'cartelle'} con tutto il loro contenuto`);
    }
    if (media > 0) {
        pezzi.push(`${media} file`);
    }

    confirm.require({
        header: 'Sposta nel cestino',
        message: `Verranno spostati in .photovault/trash/: ${pezzi.join(' e ')}.
            Niente viene cancellato: resta sul NAS finche' non scade la ritenzione.`,
        icon: 'pi pi-trash',
        acceptLabel: 'Cestina',
        rejectLabel: 'Annulla',
        accept: trashSelected,
    });
}

async function trashSelected() {
    const media_ids = [...selection.media.value];
    const folder_ids = [...selection.folders.value];
    const res = await api.post('/trash', { media_ids, folder_ids });

    toast.add({
        severity: 'success',
        summary: 'Spostati nel cestino',
        detail: `${res.cestinati ?? 0} file e ${res.cestinate ?? 0} cartelle in coda: il job trashapply li sposta entro un quarto d'ora.`,
        life: 5000,
    });

    selection.stop();
    browse.forget(media_ids);
    if (folder_ids.length > 0) {
        browse.forgetFolders(folder_ids);
    }
    if (media_ids.length > 0) {
        await proposeFolderRemoval();
    }
}

// Se la cartella corrente e' rimasta completamente vuota -- niente media,
// niente file estranei, nessuna sottocartella -- si propone di togliere anche
// lei. Solo in quel caso: una cartella con dentro dei .aae o una sottocartella
// non e' vuota, e cestinarla porterebbe via anche quelli senza dirlo.
async function proposeFolderRemoval() {
    if (!browse.folder || !browse.folder.folder_id || browse.folder.depth === 0) {
        return;
    }
    const contents = await api.get(`/folders/${browse.folder.folder_id}/contents`);
    if (contents.media > 0 || contents.others > 0 || contents.subfolders > 0) {
        return;
    }

    const gone = browse.folder;
    confirm.require({
        header: 'Cartella vuota',
        message: `La cartella "${gone.name}" e' rimasta vuota. Vuoi cestinare anche lei?`,
        icon: 'pi pi-folder-open',
        acceptLabel: 'Cestina la cartella',
        rejectLabel: 'Lasciala',
        accept: async () => {
            await api.post('/trash', { folder_ids: [gone.folder_id] });
            toast.add({
                severity: 'success',
                summary: 'Cartella nel cestino',
                detail: `"${gone.name}" verra' spostata al prossimo giro di trashapply.`,
                life: 5000,
            });
            router.push({ name: 'folder', params: { folderId: gone.parent_id } });
        },
    });
}

watch(folderId, (id) => {
    selection.stop();
    browse.open(id);
}, { immediate: true });
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

        <SelectionBar
            v-if="!browse.isEmpty"
            :selecting="selection.selecting.value"
            :folders="selection.folders.value.size"
            :media="selection.media.value.size"
            @start="selection.start"
            @stop="selection.stop"
            @trash="confirmTrash"
        />

        <div v-if="browse.subfolders.length > 0">
            <h2 class="section-title">Cartelle</h2>
            <div class="tile-grid mb-4">
                <FolderTile
                    v-for="f in browse.subfolders"
                    :key="f.folder_id"
                    :folder="f"
                    :selecting="selection.selecting.value"
                    :selected="selection.folders.value.has(f.folder_id)"
                    @toggle="selection.toggleFolder"
                />
            </div>
        </div>

        <div v-if="browse.media.length > 0">
            <h2 class="section-title">{{ browse.total }} file</h2>
            <MediaGrid
                :items="browse.media"
                :has-more="browse.hasMore"
                :on-load-more="browse.loadMore"
                :selecting="selection.selecting.value"
                :selected="selection.media.value"
                @open="openMedia"
                @toggle="selection.toggleMedia"
            />
        </div>

        <div v-if="browse.isEmpty" class="empty-state">
            <p>Questa cartella è vuota.</p>
            <p v-if="browse.roots.length === 0">
                Nessuna radice configurata: lancia una scansione dalla pagina Job.
            </p>
        </div>

        <ConfirmDialog />

        <Lightbox
            :media-id="openedId"
            :items="browse.media"
            @close="closeMedia"
            @navigate="navigateMedia"
        />
    </div>
</template>
