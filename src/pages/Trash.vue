<script setup>
import { computed, onMounted } from 'vue';
import useTrashStore from '@/stores/trash';
import useJobsStore from '@/stores/jobs';
import useParametersStore from '@/stores/parameters';

const store = useTrashStore();
const jobsStore = useJobsStore();
const parameters = useParametersStore();

const statuses = [
    { label: 'Nel cestino', value: 'done' },
    { label: 'In attesa', value: 'pending' },
    { label: 'Eliminati', value: 'purged' },
];

const occupati = computed(() => {
    const bytes = Number(store.stats?.bytes_nel_cestino || 0);
    return (bytes / (1024 * 1024)).toFixed(1);
});

const ritenzione = computed(() => parameters.params?.trash_retention_days ?? 30);

function formatSize(bytes) {
    return `${(Number(bytes) / 1024).toFixed(0)} KB`;
}

function formatDate(value) {
    if (!value) {
        return '';
    }
    return new Date(value).toLocaleString('it-IT');
}

onMounted(async () => {
    await parameters.load();
    await store.load();
});
</script>

<template>
    <div>
        <div class="flex align-items-center gap-3 mb-3 flex-wrap">
            <SelectButton
                :model-value="store.status"
                :options="statuses"
                option-label="label"
                option-value="value"
                @update:model-value="(v) => store.setStatus(v)"
            />
            <Button icon="pi pi-refresh" text @click="store.load()" />
            <Button label="Svuota adesso gli scaduti" icon="pi pi-play" size="small" outlined
                    @click="jobsStore.enqueue('trashpurge')" />
        </div>

        <div v-if="store.stats" class="mb-3 flex gap-4 flex-wrap">
            <span><strong>{{ store.stats.nel_cestino }}</strong> nel cestino ({{ occupati }} MB)</span>
            <span v-if="store.stats.in_attesa > 0">{{ store.stats.in_attesa }} in attesa di spostamento</span>
            <span>{{ store.stats.eliminati }} eliminati definitivamente</span>
        </div>

        <Message severity="info" :closable="false" class="mb-3">
            I file restano nel cestino <strong>{{ ritenzione }} giorni</strong>, poi il job
            <code>trashpurge</code> li elimina. Fino a quel momento sono ancora sulla share e si
            recuperano con un <code>mv</code>.
        </Message>

        <DataTable :value="store.items" size="small" striped-rows>
            <Column header="File">
                <template #body="{ data }">
                    <div>{{ data.original_path }}</div>
                </template>
            </Column>
            <Column header="Dimensione">
                <template #body="{ data }">{{ formatSize(data.file_size) }}</template>
            </Column>
            <Column header="Cestinato il">
                <template #body="{ data }">{{ formatDate(data.executed) }}</template>
            </Column>
            <Column v-if="store.status === 'done'" header="Giorni rimasti">
                <template #body="{ data }">
                    <Tag :value="String(data.giorni_rimasti)"
                         :severity="data.giorni_rimasti <= 3 ? 'danger' : 'secondary'" />
                </template>
            </Column>
            <Column field="result" header="Esito" />
        </DataTable>

        <div v-if="store.items.length === 0" class="empty-state">Il cestino è vuoto.</div>
    </div>
</template>
