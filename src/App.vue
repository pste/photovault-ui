<script setup>
import { watch } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import SideMenu from '@/components/SideMenu.vue';
import TopBar from '@/components/TopBar.vue';
import StorageBanner from '@/components/StorageBanner.vue';
import useErrorsStore from '@/stores/errors';
import useLoadingStore from '@/stores/loading';
import useSessionStore from '@/stores/session';

const errors = useErrorsStore();
const loading = useLoadingStore();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const session = useSessionStore();

// Una chiamata ha avuto 401 -- sessione scaduta, utente eliminato, logout da
// un'altra scheda -- oppure si e' fatto logout: si torna al login, ricordando
// la pagina in cui si era.
watch(() => session.user, (user) => {
    if (!user && session.checked && !route.meta.public) {
        router.replace({ name: 'login', query: { redirect: route.fullPath } });
    }
});

// Gli errori delle chiamate API diventano toast in un posto solo: nessun
// componente deve occuparsi di come si segnala un errore.
watch(() => errors.last, (err) => {
    if (err) {
        toast.add({ severity: 'error', summary: 'Errore', detail: err.message, life: 5000 });
    }
});
</script>

<template>
    <!-- La pagina di login non ha menu ne' barra: senza sessione non c'e'
         niente da navigare. -->
    <template v-if="route.meta.public">
        <RouterView />
        <Toast />
    </template>

    <!-- v-else-if e non v-else: prima che il router risolva la prima rotta,
         route non ha ancora ne' nome ne' meta, e la cornice si montava per un
         attimo anche sulla pagina di login -- facendo partire, senza sessione,
         il controllo della share del banner. -->
    <div v-else-if="route.name" class="app-shell">
        <SideMenu />

        <div class="app-main">
            <TopBar />
            <ProgressBar v-if="loading.isLoading" mode="indeterminate" class="app-progress" />

            <main class="app-content">
                <StorageBanner />
                <RouterView />
            </main>
        </div>

        <Toast />
    </div>
</template>
