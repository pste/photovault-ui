<script setup>
import { ref, computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { thumbURL } from '@/plugins/api';

const props = defineProps({
    group: { type: Object, required: true },
});

const emit = defineEmits(['resolve']);

// Il keeper proposto dall'API e' solo una proposta: qui diventa una scelta
// dell'utente, modificabile prima di confermare.
const keeper = ref((props.group.members.find((m) => m.is_keeper) || props.group.members[0]).media_id);

const toTrash = computed(() => props.group.members.filter((m) => m.media_id !== keeper.value));

// Sopra i 256 MB il pod dedup confronta solo inizio e fine del file: due video
// della stessa lunghezza che differiscono nel mezzo -- un montaggio, un tratto
// ricodificato -- risultano "identici". Il gruppo si presenta come probabile,
// e il cestino chiede conferma.
const partial = computed(() => props.group.kind === 'exact'
    && props.group.members.some((m) => m.hash_kind === 'sha256-partial'));

const kindLabel = computed(() => {
    if (props.group.kind === 'similar') {
        return 'simili';
    }
    return partial.value ? 'probabilmente identici' : 'identici';
});

const confirm = useConfirm();

function trashOthers() {
    const resolve = () => emit('resolve', { groupId: props.group.dup_group_id, keeper: keeper.value, action: 'trash' });
    if (!partial.value) {
        resolve();
        return;
    }
    // Gruppo dedicato: sulla pagina c'e' anche il ConfirmDialog del pannello
    // Live Photo, e senza gruppo risponderebbero entrambi.
    confirm.require({
        group: 'dup-partial',
        header: 'Confronto parziale',
        message: `Di questi file sono stati confrontati solo l'inizio e la fine. Se differiscono
            nel mezzo non sono copie. Cestinare comunque gli altri ${toTrash.value.length}?`,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Cestina',
        rejectLabel: 'Annulla',
        accept: resolve,
    });
}

function formatSize(bytes) {
    const mb = Number(bytes) / (1024 * 1024);
    if (mb < 1) {
        return `${Math.round(Number(bytes) / 1024)} KB`;
    }
    return `${mb.toFixed(1)} MB`;
}

function formatDate(value) {
    if (!value) {
        return '';
    }
    return new Date(value).toLocaleDateString('it-IT');
}
</script>

<template>
    <div class="dup-card">
        <div class="dup-header">
            <Tag :value="kindLabel"
                 :severity="group.kind === 'exact' && !partial ? 'danger' : 'warn'" />
            <span class="dup-title">{{ group.member_count }} file</span>
            <span class="dup-saving">recuperabili {{ formatSize(group.bytes_wasted) }}</span>
        </div>

        <p v-if="partial" class="dup-note">
            File oltre 256 MB: confrontati solo inizio e fine. Guardali prima di cestinare.
        </p>

        <div class="dup-members">
            <label v-for="member in group.members" :key="member.media_id"
                   class="dup-member clickable" :class="{ 'is-keeper': member.media_id === keeper }">
                <img v-if="member.thumb_status === 'done'"
                     :src="thumbURL(member.media_id, 's', member.v)"
                     :alt="member.file_name" loading="lazy" width="160" height="160" />
                <div v-else class="media-placeholder"><i class="pi pi-image"></i></div>

                <div class="dup-info">
                    <RadioButton v-model="keeper" :value="member.media_id" :input-id="`k${member.media_id}`" />
                    <div class="dup-meta">
                        <div class="dup-name" :title="member.folder_path + member.file_name">
                            {{ member.file_name }}
                        </div>
                        <div class="dup-path" :title="member.folder_path">{{ member.folder_path }}</div>
                        <div class="dup-numbers">
                            {{ member.width }}×{{ member.height }} · {{ formatSize(member.file_size) }}
                            <span v-if="member.capture_ts"> · {{ formatDate(member.capture_ts) }}</span>
                            <span v-if="group.kind === 'similar'"> · scarto {{ member.distance }}</span>
                        </div>
                    </div>
                </div>
            </label>
        </div>

        <div class="dup-actions">
            <Button
                :label="`Cestina gli altri ${toTrash.length}`"
                icon="pi pi-trash"
                severity="danger"
                size="small"
                :disabled="toTrash.length === 0"
                @click="trashOthers"
            />
            <Button
                label="Ignora questo gruppo"
                icon="pi pi-eye-slash"
                severity="secondary"
                size="small"
                outlined
                @click="emit('resolve', { groupId: group.dup_group_id, keeper, action: 'ignore' })"
            />
        </div>
    </div>
</template>
