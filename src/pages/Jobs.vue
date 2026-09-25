<script setup>
import { onMounted, ref } from 'vue';
import useJobsStore from '@/stores/jobs';
import { formatDateTime } from '@/plugins/format';

const jobsStore = useJobsStore();

// I nomi devono corrispondere **esattamente** agli handler dei pod, altrimenti
// il job resta pending per sempre: nessun pod lo reclama, perche' il claim
// filtra per i nomi che sa eseguire, e in pagina compare una riga che non parte
// mai senza spiegare perche'.
//
// C'erano due nomi inventati: "fullscan", che non e' mai esistito, e "label",
// mentre il pod Python espone "places". Verificati uno per uno leggendo i tre
// main dei pod.
const runnable = [
    'scan',       // pod scan: cammina la share e scrive le righe
    'thumbs',     // pod scan: genera le anteprime
    'livephoto',  // pod scan: riaccoppia foto e video delle Live Photo
    'dedup',      // pod dedup: sha256 + dHash + gruppi
    'dhash',      // pod dedup: solo dHash + gruppi, senza leggere gli originali
    'places',     // pod label: toponimi da GPS e nome cartella
];

const severity = {
    pending: 'secondary',
    running: 'info',
    done: 'success',
    error: 'danger',
};

async function refresh() {
    await jobsStore.load();
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

        <DataTable :value="jobsStore.jobs" size="small" striped-rows>
            <Column field="job_id" header="#" />
            <Column field="name" header="Job" />
            <Column header="Stato">
                <template #body="{ data }">
                    <Tag :value="data.status" :severity="severity[data.status]" />
                </template>
            </Column>
            <Column header="Previsto">
                <template #body="{ data }">{{ formatDateTime(data.when) }}</template>
            </Column>
            <Column header="Concluso">
                <template #body="{ data }">{{ formatDateTime(data.ended) }}</template>
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
