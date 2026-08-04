<script setup>
import { watch } from 'vue';
import { RouterView } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import SideMenu from '@/components/SideMenu.vue';
import TopBar from '@/components/TopBar.vue';
import StorageBanner from '@/components/StorageBanner.vue';
import useErrorsStore from '@/stores/errors';
import useLoadingStore from '@/stores/loading';

const errors = useErrorsStore();
const loading = useLoadingStore();
const toast = useToast();

// Gli errori delle chiamate API diventano toast in un posto solo: nessun
// componente deve occuparsi di come si segnala un errore.
watch(() => errors.last, (err) => {
    if (err) {
        toast.add({ severity: 'error', summary: 'Errore', detail: err.message, life: 5000 });
    }
});
</script>

<template>
    <div class="app-shell">
        <SideMenu />

        <div class="app-main">
            <TopBar />
            <ProgressBar v-if="loading.isLoading" mode="indeterminate" style="height: 3px" />

            <main class="app-content">
                <StorageBanner />
                <RouterView />
            </main>
        </div>

        <Toast />
    </div>
</template>
