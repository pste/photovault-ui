import pinia from './pinia';
import router from './router';
import api from './api';
import ToastService from './toast';
//
import PrimeVue from 'primevue/config';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import Tooltip from 'primevue/tooltip';
import Aura from '@primevue/themes/aura';

export function registerPlugins(app) {
    app.use(pinia);

    app.use(PrimeVue, {
        theme: {
            preset: Aura,
            options: {
                darkModeSelector: '.dark-mode',
            }
        }
    });
    app.directive('tooltip', Tooltip);
    app.use(ToastService);

    app.use(router); // dopo pinia
    app.use(api);
}
