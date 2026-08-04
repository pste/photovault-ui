import { createRouter, createWebHistory } from 'vue-router';

import BrowseView from '@/pages/Browse.vue';
import SearchView from '@/pages/Search.vue';
import DuplicatesView from '@/pages/Duplicates.vue';
import TrashView from '@/pages/Trash.vue';
import JobsView from '@/pages/Jobs.vue';
import ParametersView from '@/pages/Parameters.vue';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        // Il primo livello della root e la singola cartella sono la stessa vista:
        // cambia solo il parametro.
        { path: '/', name: 'browse', component: BrowseView },
        { path: '/folder/:folderId', name: 'folder', component: BrowseView },
        { path: '/search', name: 'search', component: SearchView },
        { path: '/duplicates', name: 'duplicates', component: DuplicatesView },
        { path: '/trash', name: 'trash', component: TrashView },
        { path: '/jobs', name: 'jobs', component: JobsView },
        { path: '/parameters', name: 'parameters', component: ParametersView },
    ],
});

export default router;
