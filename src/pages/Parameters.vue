<script setup>
import { onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import useParametersStore from '@/stores/parameters';

const store = useParametersStore();
const toast = useToast();
const form = ref({});

// Solo i parametri che qualcuno legge davvero. Gli intervalli sono gli stessi
// che l'API applica: fuori da li' risponde 400.
const fields = [
    { key: 'dedup_max_distance', label: 'Distanza massima duplicati', min: 0, max: 16 },
    { key: 'trash_retention_days', label: 'Giorni di permanenza nel cestino', min: 1, max: 3650 },
];

// Questi restano in database come documentazione, ma nessun componente li
// legge: modificarli qui non cambierebbe niente, quindi non si modificano.
const readOnly = [
    { key: 'cron_scan', label: 'Cron scansione', where: 'schedule del CronJob photovault-scan-nightly' },
    { key: 'cron_label', label: 'Cron etichettatura', where: 'schedule del CronJob photovault-label' },
    { key: 'cron_dedup', label: 'Cron duplicati', where: 'schedule del CronJob photovault-dedup' },
    { key: 'thumb_small_px', label: 'Thumbnail griglia (px)', where: 'THUMB_SMALL_PX del pod scan' },
    { key: 'thumb_medium_px', label: 'Thumbnail visore (px)', where: 'THUMB_MEDIUM_PX del pod scan' },
    { key: 'clip_min_score', label: 'Soglia minima CLIP', where: 'non ancora usata: arriva con CLIP' },
    { key: 'page_size', label: 'Elementi per pagina', where: 'fissato nella UI' },
];

async function save() {
    const values = {};
    for (const field of fields) {
        values[field.key] = form.value[field.key];
    }
    await store.save(values);
    toast.add({ severity: 'success', summary: 'Impostazioni salvate', life: 3000 });
}

onMounted(async () => {
    const params = await store.load();
    form.value = { ...params };
});
</script>

<template>
    <div class="max-w-30rem">
        <div v-for="field in fields" :key="field.key" class="mb-3">
            <label :for="field.key" class="block mb-1">{{ field.label }}</label>
            <InputNumber
                :input-id="field.key"
                v-model="form[field.key]"
                class="w-full"
                :min="field.min"
                :max="field.max"
                :use-grouping="false"
            />
        </div>

        <Button label="Salva" icon="pi pi-check" @click="save" />

        <h3 class="mt-5 mb-2">Solo consultazione</h3>
        <p class="mt-0 mb-3 text-color-secondary">
            Valori registrati in database ma letti da nessuno: si cambiano altrove.
        </p>
        <div v-for="field in readOnly" :key="field.key" class="mb-3">
            <div>{{ field.label }}: <strong>{{ form[field.key] }}</strong></div>
            <small class="text-color-secondary">{{ field.where }}</small>
        </div>
    </div>
</template>
