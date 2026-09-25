<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { otherDownloadURL } from '@/plugins/api';
import useOthersStore from '@/stores/others';
import { formatSize, formatDate } from '@/plugins/format';

const store = useOthersStore();
const confirm = useConfirm();
const toast = useToast();

const selected = ref([]);

// La selezione vale per le righe che si vedono. Prima sopravviveva a cambi di
// pagina, filtro e ordinamento, e la conferma mostrava solo un numero: si
// cestinavano anche righe che non erano piu' sullo schermo.
watch(() => [store.page, store.ext, store.sort], () => {
    selected.value = [];
});

const sortOptions = [
    { label: 'Più grandi', value: 'size' },
    { label: 'Per percorso', value: 'path' },
];

const totalSize = computed(() => formatSize(store.stats?.bytes || 0));

function confirmTrash() {
    const n = selected.value.length;
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
    const res = await store.trash(selected.value.map((r) => r.other_id));
    selected.value = [];
    toast.add({
        severity: 'success',
        summary: 'Spostati nel cestino',
        detail: `${res.cestinati} file in coda: il job trashapply li sposta entro un quarto d'ora.`,
        life: 5000,
    });
}

onMounted(() => store.load());
</script>

<template>
    <div>
        <div class="flex align-items-center gap-3 mb-3 flex-wrap">
            <SelectButton
                :model-value="store.sort"
                :options="sortOptions"
                option-label="label"
                option-value="value"
                @update:model-value="(v) => v && store.sortBy(v)"
            />
            <Button
                label="Cestina selezionati"
                icon="pi pi-trash"
                severity="danger"
                :disabled="selected.length === 0"
                @click="confirmTrash"
            />
            <Button icon="pi pi-refresh" text @click="store.load()" />
        </div>

        <div v-if="store.stats" class="mb-3 flex gap-4 flex-wrap align-items-center">
            <span><strong>{{ store.stats.files }}</strong> file non gestiti, {{ totalSize }} occupati</span>
            <Button
                v-if="store.ext"
                :label="`estensione: ${store.ext}`"
                icon="pi pi-times"
                size="small"
                outlined
                @click="store.filterByExt(null)"
            />
        </div>

        <!-- Le estensioni piu' pesanti sono la scorciatoia vera: si fa pulizia
             per categoria, non file per file. -->
        <div v-if="store.stats && !store.ext" class="ext-chips mb-3">
            <button
                v-for="row in store.stats.by_ext"
                :key="row.ext"
                type="button"
                class="ext-chip clickable"
                @click="store.filterByExt(row.ext)"
            >
                <strong>.{{ row.ext }}</strong>
                <span>{{ row.files }} file · {{ formatSize(row.bytes) }}</span>
            </button>
        </div>

        <DataTable
            v-model:selection="selected"
            :value="store.items"
            data-key="other_id"
            size="small"
            striped-rows
        >
            <Column selection-mode="multiple" header-class="col-w-3" />
            <Column field="file_name" header="Nome" />
            <Column field="path" header="Cartella">
                <template #body="{ data }">
                    <span class="other-path" :title="data.path">{{ data.path || '/' }}</span>
                </template>
            </Column>
            <Column field="ext" header="Tipo" header-class="col-w-6">
                <template #body="{ data }">.{{ data.ext }}</template>
            </Column>
            <Column field="file_size" header="Dimensione" header-class="col-w-8">
                <template #body="{ data }">{{ formatSize(data.file_size) }}</template>
            </Column>
            <Column header="" header-class="col-w-4">
                <template #body="{ data }">
                    <a :href="otherDownloadURL(data.other_id)" :download="data.file_name">
                        <Button icon="pi pi-download" text rounded
                                v-tooltip.bottom="'Scarica per vedere cos\'è'" />
                    </a>
                </template>
            </Column>
            <Column field="modified" header="Modificato" header-class="col-w-9">
                <template #body="{ data }">{{ formatDate(data.modified) }}</template>
            </Column>
        </DataTable>

        <Paginator
            v-if="store.total > store.pageSize"
            :rows="store.pageSize"
            :total-records="store.total"
            :first="store.offset"
            class="mt-2"
            @page="(e) => store.goToPage(e.page)"
        />

        <div v-if="store.items.length === 0" class="empty-state">
            Nessun file estraneo alla libreria. La share contiene solo immagini e video.
        </div>

        <ConfirmDialog />
    </div>
</template>
