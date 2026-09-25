<script setup>
import { computed } from 'vue';
import { thumbURL } from '@/plugins/api';

const props = defineProps({
    item: { type: Object, required: true },
    selecting: { type: Boolean, default: false },
    selected: { type: Boolean, default: false },
});

const emit = defineEmits(['open', 'toggle']);

// La thumbnail esiste solo quando il job l'ha generata: finche' e' pendente si
// mostra un segnaposto invece di un'immagine rotta.
const hasThumb = computed(() => props.item.thumb_status === 'done');

const duration = computed(() => {
    if (props.item.media_kind !== 'video' || !props.item.duration_s) {
        return null;
    }
    const total = Math.round(Number(props.item.duration_s));
    const mm = Math.floor(total / 60);
    const ss = String(total % 60).padStart(2, '0');
    return `${mm}:${ss}`;
});

// Col mouse, fuori dalla modalita' selezione, il clic singolo non fa niente: ad
// aprire e' il doppio clic. Cosi' passare sulla griglia non spalanca il visore
// per sbaglio, ed e' anche il comportamento del file manager.
//
// Col dito invece un tocco apre: da telefono il doppio tocco non arriva come
// doppio clic, e la tile non si apriva in nessun modo -- segnalato il
// 2026-09-25 come "i video non partono, vedo solo la thumbnail". pointerType
// dice da dove arriva il clic; dove manca, (hover: none) dice se il
// dispositivo ha solo il touch.
function isTouch(event) {
    if (event.pointerType) {
        return event.pointerType === 'touch' || event.pointerType === 'pen';
    }
    return window.matchMedia('(hover: none)').matches;
}

function onClick(event) {
    if (props.selecting) {
        emit('toggle', props.item);
    }
    else if (isTouch(event)) {
        emit('open', props.item);
    }
}

// Da tastiera Invio e spazio fanno quello che fa il mouse: aprono, o in
// modalita' selezione spuntano. Prima la tile era un div senza tabindex e da
// tastiera non si raggiungeva nemmeno.
function onKey() {
    if (props.selecting) {
        emit('toggle', props.item);
    }
    else {
        emit('open', props.item);
    }
}
</script>

<template>
    <div
        class="media-tile"
        :class="{ clickable: selecting, 'is-selected': selected }"
        :title="item.file_name"
        tabindex="0"
        role="button"
        :aria-label="item.file_name"
        :aria-pressed="selecting ? selected : undefined"
        @click="onClick"
        @dblclick="emit('open', item)"
        @keydown.enter.prevent="onKey"
        @keydown.space.prevent="onKey"
    >
        <img
            v-if="hasThumb"
            :src="thumbURL(item.media_id, 's', item.v)"
            :alt="item.file_name"
            loading="lazy"
            decoding="async"
            width="320"
            height="320"
        />
        <div v-else class="media-placeholder">
            <i :class="item.media_kind === 'video' ? 'pi pi-video' : 'pi pi-image'"></i>
        </div>

        <span v-if="selecting" class="media-check">
            <i :class="selected ? 'pi pi-check-circle' : 'pi pi-circle'"></i>
        </span>

        <span v-if="duration" class="media-badge">{{ duration }}</span>
    </div>
</template>
