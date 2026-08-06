<script setup>
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();

const links = [
    { name: 'browse', label: 'Sfoglia', icon: 'pi pi-folder' },
    { name: 'search', label: 'Ricerca', icon: 'pi pi-search' },
    { name: 'duplicates', label: 'Duplicati', icon: 'pi pi-clone' },
    { name: 'others', label: 'Altri file', icon: 'pi pi-file' },
    { name: 'trash', label: 'Cestino', icon: 'pi pi-trash' },
    { name: 'jobs', label: 'Job', icon: 'pi pi-server' },
    { name: 'parameters', label: 'Impostazioni', icon: 'pi pi-cog' },
];

// "Sfoglia" resta evidenziato anche dentro una cartella: e' la stessa sezione.
function isActive(name) {
    if (name === 'browse') {
        return (route.name === 'browse' || route.name === 'folder');
    }
    return route.name === name;
}
</script>

<template>
    <nav class="app-side">
        <div class="side-title">PhotoVault</div>
        <RouterLink
            v-for="link in links"
            :key="link.name"
            :to="{ name: link.name }"
            class="side-link"
            :class="{ 'is-active': isActive(link.name) }"
        >
            <i :class="link.icon"></i>
            <span>{{ link.label }}</span>
        </RouterLink>
    </nav>
</template>
