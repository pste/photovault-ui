<script setup>
import { onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import useParametersStore from '@/stores/parameters';

const store = useParametersStore();
const toast = useToast();
const form = ref({});

const fields = [
    { key: 'cron_scan', label: 'Cron scansione', type: 'text' },
    { key: 'cron_label', label: 'Cron etichettatura', type: 'text' },
    { key: 'cron_dedup', label: 'Cron duplicati', type: 'text' },
    { key: 'thumb_small_px', label: 'Thumbnail griglia (px)', type: 'number' },
    { key: 'thumb_medium_px', label: 'Thumbnail visore (px)', type: 'number' },
    { key: 'clip_min_score', label: 'Soglia minima CLIP', type: 'number' },
    { key: 'dedup_max_distance', label: 'Distanza massima duplicati', type: 'number' },
    { key: 'trash_retention_days', label: 'Giorni di permanenza nel cestino', type: 'number' },
    { key: 'page_size', label: 'Elementi per pagina', type: 'number' },
];

async function save() {
    await store.save(form.value);
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
                v-if="field.type === 'number'"
                :id="field.key"
                v-model="form[field.key]"
                class="w-full"
                :min-fraction-digits="0"
                :max-fraction-digits="3"
            />
            <InputText v-else :id="field.key" v-model="form[field.key]" class="w-full" />
        </div>

        <Button label="Salva" icon="pi pi-check" @click="save" />
    </div>
</template>
