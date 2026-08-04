<script setup>
import { onMounted, ref } from 'vue';
import useJobsStore from '@/stores/jobs';
import { api } from '@/plugins/api';

const jobsStore = useJobsStore();
const stats = ref(null);

// I nomi corrispondono agli handler dei pod: scan/fullscan/thumbs stanno nel pod
// Go, dedup nel pod dedup, label nel pod Python.
const runnable = ['scan', 'fullscan', 'thumbs', 'dedup', 'label'];

const severity = {
    pending: 'secondary',
    running: 'info',
    done: 'success',
    error: 'danger',
};

function formatDate(value) {
    if (!value) {
        return '';
    }
    return new Date(value).toLocaleString('it-IT');
}

async function refresh() {
    await jobsStore.load();
    stats.value = await api.get('/stats');
}

onMounted(refresh);
</script>

<template>
    <div>
        <div class="flex align-items-center gap-2 mb-3 flex-wrap">
            <Button
                v-for="name in runnable"
                :key="name"
                :label="name"
                icon="pi pi-play"
                size="small"
                outlined
                @click="jobsStore.enqueue(name).then(refresh)"
            />
            <Button icon="pi pi-refresh" text @click="refresh" />
        </div>

        <div v-if="stats" class="mb-4 flex gap-4 flex-wrap">
            <span>{{ stats.media_total }} media</span>
            <span>{{ stats.videos }} video</span>
            <span>thumbnail da fare: {{ stats.thumb_pending }}</span>
            <span>hash da fare: {{ stats.hash_pending }}</span>
            <span>tag da fare: {{ stats.label_pending }}</span>
            <span v-if="stats.missing > 0">mancanti: {{ stats.missing }}</span>
        </div>

        <DataTable :value="jobsStore.jobs" size="small" striped-rows>
            <Column field="job_id" header="#" />
            <Column field="name" header="Job" />
            <Column header="Stato">
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="severity[data.status]" />
                </template>
            </Column>
            <Column header="Previsto">
                <template #body="{ data }">{{ formatDate(data.when) }}</template>
            </Column>
            <Column header="Concluso">
                <template #body="{ data }">{{ formatDate(data.ended) }}</template>
            </Column>
            <Column field="result" header="Esito" />
            <Column>
                <template #body="{ data }">
                    <Button icon="pi pi-trash" text severity="danger" @click="jobsStore.remove(data.job_id)" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
