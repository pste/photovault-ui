import { createRouter, createWebHistory } from 'vue-router';

import BrowseView from '@/pages/Browse.vue';
import SearchView from '@/pages/Search.vue';
import DuplicatesView from '@/pages/Duplicates.vue';
import TrashView from '@/pages/Trash.vue';
import OthersView from '@/pages/Others.vue';
import TagsView from '@/pages/Tags.vue';
import StatsView from '@/pages/Stats.vue';
import JobsView from '@/pages/Jobs.vue';
import ParametersView from '@/pages/Parameters.vue';
import LoginView from '@/pages/Login.vue';
import useSessionStore from '@/stores/session';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        // Il primo livello della root e la singola cartella sono la stessa vista:
        // cambia solo il parametro.
        { path: '/', name: 'browse', component: BrowseView },
        { path: '/folder/:folderId', name: 'folder', component: BrowseView },
        { path: '/search', name: 'search', component: SearchView },
        { path: '/duplicates', name: 'duplicates', component: DuplicatesView },
        { path: '/others', name: 'others', component: OthersView },
        { path: '/trash', name: 'trash', component: TrashView },
        { path: '/tags', name: 'tags', component: TagsView },
        { path: '/stats', name: 'stats', component: StatsView },
        { path: '/jobs', name: 'jobs', component: JobsView },
        { path: '/parameters', name: 'parameters', component: ParametersView },
        // public: l'unica pagina raggiungibile senza login, e senza la cornice
        // dell'app (menu e barra), vedi App.vue.
        { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    ],
});

// Senza sessione ogni pagina porta al login, ricordando dove si voleva andare.
// La sessione si chiede all'API una volta sola, alla prima navigazione.
router.beforeEach(async (to) => {
    if (to.meta.public) {
        return true;
    }
    const session = useSessionStore();
    if (await session.load()) {
        return true;
    }
    return { name: 'login', query: { redirect: to.fullPath } };
});

export default router;
