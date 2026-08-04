<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import useSearchStore from '@/stores/search';

const router = useRouter();
const searchStore = useSearchStore();
const text = ref('');

function submit() {
    const q = text.value.trim();
    if (q.length === 0) {
        return;
    }
    searchStore.run({ q });
    router.push({ name: 'search', query: { q } });
}
</script>

<template>
    <div class="app-top flex align-items-center gap-3">
        <IconField class="flex-1">
            <InputIcon class="pi pi-search" />
            <InputText
                v-model="text"
                class="w-full"
                placeholder="Cerca per nome, cartella o tag…"
                @keyup.enter="submit"
            />
        </IconField>
        <slot />
    </div>
</template>
