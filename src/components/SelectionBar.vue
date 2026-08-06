<script setup>
import { computed } from 'vue';

const props = defineProps({
    selecting: { type: Boolean, required: true },
    folders: { type: Number, default: 0 },
    media: { type: Number, default: 0 },
});

defineEmits(['start', 'stop', 'trash']);

const total = computed(() => props.folders + props.media);

// "2 cartelle e 5 file" invece di "7 selezionati": cestinare una cartella non
// e' la stessa cosa che cestinare un file, e chi preme deve vedere la
// differenza prima del dialogo di conferma.
const label = computed(() => {
    const parts = [];
    if (props.folders > 0) {
        parts.push(`${props.folders} ${props.folders === 1 ? 'cartella' : 'cartelle'}`);
    }
    if (props.media > 0) {
        parts.push(`${props.media} file`);
    }
    return (parts.length > 0) ? parts.join(' e ') : 'niente selezionato';
});
</script>

<template>
    <div class="grid-toolbar">
        <Button
            v-if="!selecting"
            label="Seleziona"
            icon="pi pi-check-square"
            text
            @click="$emit('start')"
        />
        <template v-else>
            <span class="grid-toolbar-count">{{ label }}</span>
            <Button
                label="Cestina"
                icon="pi pi-trash"
                severity="danger"
                :disabled="total === 0"
                @click="$emit('trash')"
            />
            <Button label="Annulla" icon="pi pi-times" text @click="$emit('stop')" />
        </template>
    </div>
</template>
