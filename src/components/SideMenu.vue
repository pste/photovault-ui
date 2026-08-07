<script setup>
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import MenuLinks from '@/components/MenuLinks.vue';
import useNav from '@/composables/useNav';

const { isOpen, close } = useNav();
const route = useRoute();

// Il menu si chiude anche quando la rotta cambia per altre vie: un breadcrumb,
// il tasto indietro del telefono, un redirect. Chiuderlo solo al clic sul link
// lo lascerebbe aperto sopra la pagina appena raggiunta.
watch(() => route.fullPath, close);
</script>

<template>
    <!-- Da schermo largo il menu e' sempre in vista; sotto i 768 px lo nasconde
         style.css e al suo posto entra il pannello qui sotto. -->
    <nav class="app-side">
        <div class="side-title">PhotoVault</div>
        <MenuLinks />
    </nav>

    <Drawer v-model:visible="isOpen" header="PhotoVault" class="nav-drawer">
        <MenuLinks @navigate="close" />
    </Drawer>
</template>
