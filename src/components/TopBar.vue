<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import useSearchStore from '@/stores/search';
import useTheme from '@/composables/useTheme';
import useNav from '@/composables/useNav';

const router = useRouter();
const searchStore = useSearchStore();
const { isDark, toggle } = useTheme();
const { open } = useNav();
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
        <!-- Solo sotto i 768 px, dove il menu laterale non c'e'. -->
        <Button
            class="menu-toggle"
            icon="pi pi-bars"
            aria-label="Apri il menu"
            text
            rounded
            @click="open"
        />
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

        <Button
            :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'"
            :aria-label="isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'"
            v-tooltip.bottom="isDark ? 'Tema chiaro' : 'Tema scuro'"
            text
            rounded
            @click="toggle"
        />
    </div>
</template>
