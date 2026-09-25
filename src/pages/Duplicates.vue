<script setup>
import { computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import useDuplicatesStore from '@/stores/duplicates';
import DupGroupCard from '@/components/DupGroupCard.vue';
import LivePhotoPanel from '@/components/LivePhotoPanel.vue';
import { formatSize } from '@/plugins/format';

const store = useDuplicatesStore();
const toast = useToast();

const statuses = [
    { label: 'Da decidere', value: 'open' },
    { label: 'Risolti', value: 'resolved' },
    { label: 'Ignorati', value: 'ignored' },
];

const kinds = [
    { label: 'Tutti', value: null },
    { label: 'Identici', value: 'exact' },
    { label: 'Simili', value: 'similar' },
];

const recuperabili = computed(() => formatSize(store.stats?.bytes_recuperabili));

const pages = computed(() => Math.ceil(store.total / 20));

async function onResolve({ groupId, keeper, action }) {
    await store.resolve(groupId, keeper, action);
    if (action === 'trash') {
        toast.add({
            severity: 'success',
            summary: 'Spostati nel cestino',
            detail: 'I file restano recuperabili fino allo svuotamento automatico.',
            life: 4000,
        });
    }
    else {
        toast.add({ severity: 'info', summary: 'Gruppo ignorato', life: 3000 });
    }
}

onMounted(() => store.load());
</script>

<template>
    <div>
        <!-- Sopra i duplicati veri: e' la stessa domanda -- lo stesso contenuto
             occupa due posti -- ma la risposta e' diversa, perche' qui il
             secondo file non e' una copia, e' il movimento. -->
        <LivePhotoPanel />

        <div class="flex align-items-center gap-3 mb-3 flex-wrap">
            <SelectButton
                :model-value="store.status"
                :options="statuses"
                option-label="label"
                option-value="value"
                @update:model-value="(v) => store.setFilter(v, store.kind)"
            />
            <SelectButton
                :model-value="store.kind"
                :options="kinds"
                option-label="label"
                option-value="value"
                @update:model-value="(v) => store.setFilter(store.status, v)"
            />
            <Button icon="pi pi-refresh" text @click="store.load()" />
        </div>

        <div v-if="store.stats" class="mb-4 flex gap-4 flex-wrap">
            <span><strong>{{ store.stats.aperti }}</strong> gruppi da decidere</span>
            <span><strong>{{ recuperabili }}</strong> recuperabili</span>
            <span>{{ store.stats.risolti }} risolti · {{ store.stats.ignorati }} ignorati</span>
        </div>

        <Message v-if="store.status === 'open' && store.total > 0" severity="info" :closable="false" class="mb-3">
            Scegli quale file tenere in ogni gruppo: gli altri finiscono nel cestino, da dove
            restano recuperabili fino allo svuotamento automatico.
        </Message>

        <DupGroupCard
            v-for="group in store.groups"
            :key="group.dup_group_id"
            :group="group"
            @resolve="onResolve"
        />

        <div v-if="store.groups.length === 0" class="empty-state">
            <p v-if="store.status === 'open'">Nessun duplicato da decidere.</p>
            <p v-else>Nessun gruppo in questo stato.</p>
            <p>Lancia il job <strong>dedup</strong> dalla pagina Job per cercarne di nuovi.</p>
        </div>

        <div v-if="pages > 1" class="flex align-items-center gap-2 mt-3">
            <Button icon="pi pi-chevron-left" text :disabled="store.page === 0"
                    @click="store.goToPage(store.page - 1)" />
            <span>pagina {{ store.page + 1 }} di {{ pages }}</span>
            <Button icon="pi pi-chevron-right" text :disabled="store.page >= pages - 1"
                    @click="store.goToPage(store.page + 1)" />
        </div>

        <!-- Conferma dei gruppi con hash parziale, vedi DupGroupCard. -->
        <ConfirmDialog group="dup-partial" />
    </div>
</template>
