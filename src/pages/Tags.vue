<script setup>
import { ref, computed, onMounted } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import useTagsStore from '@/stores/tags';

const store = useTagsStore();
const confirm = useConfirm();
const toast = useToast();

// Le categorie proposte nel menu di modifica. Non sono un vincolo del database
// -- kind e' una stringa libera -- ma un elenco di quelle che i job producono
// piu' quella che serve per correggerli: "Martin" e' una persona, non una citta'.
const KINDS = [
    { label: 'Luogo', value: 'place' },
    { label: 'Persona', value: 'person' },
    { label: 'Scena', value: 'scene' },
    { label: 'Soggetto', value: 'subject' },
    { label: 'Altro', value: 'other' },
];

const editing = ref(null);
const editName = ref('');
const editKind = ref(null);
const merging = ref(null);
const mergeInto = ref(null);

const kindOptions = computed(() => [
    { label: 'Tutte le categorie', value: null },
    ...store.kinds.map((k) => ({ label: `${labelOf(k.kind)} (${k.tags})`, value: k.kind })),
]);

// I candidati alla fusione sono gli altri tag non bloccati: fondere dentro una
// lapide rimetterebbe le foto su un tag che nessun job puo' piu' assegnare.
const mergeCandidates = computed(() => store.items
    .filter((t) => !t.blocked && t.tag_id !== merging.value?.tag_id)
    .map((t) => ({ label: `${t.display_name} (${t.usage})`, value: t.tag_id })));

function labelOf(kind) {
    return KINDS.find((k) => k.value === kind)?.label || kind;
}

function openEdit(tag) {
    editing.value = tag;
    editName.value = tag.display_name;
    editKind.value = tag.kind;
}

async function saveEdit() {
    await store.update(editing.value.tag_id, {
        display_name: editName.value,
        kind: editKind.value,
    });
    toast.add({ severity: 'success', summary: 'Tag aggiornato', life: 3000 });
    editing.value = null;
}

function openMerge(tag) {
    merging.value = tag;
    mergeInto.value = null;
}

async function saveMerge() {
    const from = merging.value;
    const res = await store.merge(from.tag_id, mergeInto.value);
    merging.value = null;
    toast.add({
        severity: 'success',
        summary: 'Tag fusi',
        detail: `${res.moved} foto spostate. "${from.display_name}" resta bloccato, altrimenti il job lo ricreerebbe.`,
        life: 6000,
    });
}

function confirmClear(tag) {
    confirm.require({
        header: 'Elimina il tag',
        message: `Le ${tag.usage} assegnazioni di "${tag.display_name}" verranno tolte e il tag
            resterà bloccato: nessun job potrà più assegnarlo. La riga non si cancella, perché
            è proprio quella a impedire che il tag torni al prossimo giro.`,
        icon: 'pi pi-trash',
        acceptLabel: 'Elimina e blocca',
        rejectLabel: 'Annulla',
        accept: async () => {
            const res = await store.clear(tag.tag_id);
            toast.add({
                severity: 'success',
                summary: 'Tag eliminato',
                detail: `${res.removed} assegnazioni rimosse.`,
                life: 5000,
            });
        },
    });
}

async function toggleBlock(tag) {
    await store.update(tag.tag_id, { blocked: !tag.blocked });
    toast.add({
        severity: 'success',
        summary: tag.blocked ? 'Tag sbloccato' : 'Tag bloccato',
        detail: tag.blocked
            ? 'I job possono tornare ad assegnarlo.'
            : 'Nessun job potrà più assegnarlo. Le foto che ce l\'hanno già lo tengono.',
        life: 5000,
    });
}

onMounted(store.load);
</script>

<template>
    <div>
        <div class="flex flex-wrap align-items-center gap-2 mb-3">
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText v-model="store.search" placeholder="Filtra per nome…" />
            </IconField>
            <!-- Il placeholder non e' decorativo: con valore null il Select non
                 aggancia l'opzione null e la tendina resterebbe muta. -->
            <Select v-model="store.kind" :options="kindOptions" option-label="label"
                option-value="value" placeholder="Tutte le categorie" />
            <div class="flex align-items-center gap-2">
                <ToggleSwitch v-model="store.showBlocked" input-id="mostra-bloccati" />
                <label for="mostra-bloccati">Mostra i bloccati</label>
            </div>
            <span class="flex-1"></span>
            <span class="opacity-60">
                {{ store.visible.length }} tag · {{ store.totale.toLocaleString('it-IT') }} assegnazioni
            </span>
        </div>

        <DataTable :value="store.visible" data-key="tag_id" scrollable scroll-height="flex" size="small">
            <Column field="display_name" header="Tag" sortable>
                <template #body="{ data }">
                    <span :class="{ 'is-blocked': data.blocked }">{{ data.display_name }}</span>
                    <Tag v-if="data.blocked" value="bloccato" severity="danger" class="ml-2" />
                </template>
            </Column>

            <Column field="kind" header="Categoria" sortable>
                <template #body="{ data }">{{ labelOf(data.kind) }}</template>
            </Column>

            <!-- Il conteggio e' la ragione di questa pagina: e' cio' che smaschera
                 un falso positivo di massa, che dal nome non si distingue. -->
            <Column field="usage" header="Foto" sortable>
                <template #body="{ data }">{{ data.usage.toLocaleString('it-IT') }}</template>
            </Column>

            <Column header="Da dove">
                <template #body="{ data }">
                    <Tag v-for="s in data.sources" :key="s" :value="s" severity="secondary" class="mr-1" />
                </template>
            </Column>

            <Column header="" header-class="col-w-12">
                <template #body="{ data }">
                    <Button icon="pi pi-pencil" text rounded aria-label="Rinomina o cambia categoria"
                        v-tooltip.bottom="'Rinomina o cambia categoria'" @click="openEdit(data)" />
                    <Button icon="pi pi-sign-in" text rounded aria-label="Fondi in un altro tag"
                        v-tooltip.bottom="'Fondi in un altro tag'" :disabled="data.blocked || data.usage === 0" @click="openMerge(data)" />
                    <Button :icon="data.blocked ? 'pi pi-lock-open' : 'pi pi-ban'" text rounded
                        :aria-label="data.blocked ? 'Sblocca' : 'Blocca'"
                        v-tooltip.bottom="data.blocked ? 'Sblocca' : 'Blocca: nessun job potrà assegnarlo'"
                        @click="toggleBlock(data)" />
                    <Button icon="pi pi-trash" text rounded severity="danger"
                        aria-label="Elimina le assegnazioni e blocca"
                        v-tooltip.bottom="'Elimina le assegnazioni e blocca'"
                        :disabled="data.usage === 0" @click="confirmClear(data)" />
                </template>
            </Column>

            <template #empty>
                <div class="empty-state">Nessun tag con questi filtri.</div>
            </template>
        </DataTable>

        <Dialog v-model:visible="editing" modal header="Modifica il tag" class="dialog-narrow">
            <div class="flex flex-column gap-3">
                <div class="flex flex-column gap-1">
                    <label for="tag-nome">Nome visualizzato</label>
                    <InputText id="tag-nome" v-model="editName" />
                </div>
                <div class="flex flex-column gap-1">
                    <label for="tag-kind">Categoria</label>
                    <Select id="tag-kind" v-model="editKind" :options="KINDS"
                        option-label="label" option-value="value" />
                </div>
                <!-- Detto qui e non altrove: e' il punto in cui l'utente sta per
                     fare la correzione che il job disferebbe. -->
                <Message severity="warn" :closable="false">
                    Cambiare categoria non impedisce al job di riassegnare il tag: il nome resta
                    lo stesso e il job cerca per nome. Per fermarlo serve il blocco.
                </Message>
            </div>
            <template #footer>
                <Button label="Annulla" text @click="editing = null" />
                <Button label="Salva" :disabled="!editName.trim()" @click="saveEdit" />
            </template>
        </Dialog>

        <Dialog v-model:visible="merging" modal header="Fondi in un altro tag" class="dialog-narrow">
            <div class="flex flex-column gap-3">
                <p class="m-0">
                    Le {{ merging?.usage }} foto di <strong>{{ merging?.display_name }}</strong>
                    passeranno al tag scelto.
                </p>
                <Select v-model="mergeInto" :options="mergeCandidates" option-label="label"
                    option-value="value" filter placeholder="Scegli il tag di destinazione" />
            </div>
            <template #footer>
                <Button label="Annulla" text @click="merging = null" />
                <Button label="Fondi" :disabled="!mergeInto" @click="saveMerge" />
            </template>
        </Dialog>

        <ConfirmDialog />
    </div>
</template>
