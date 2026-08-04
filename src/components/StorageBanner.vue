<script setup>
import { onMounted } from 'vue';
import useStorageStore from '@/stores/storage';

const storage = useStorageStore();

onMounted(() => storage.check());
</script>

<template>
    <Message v-if="!storage.available" severity="warn" :closable="false">
        La share non è raggiungibile: le anteprime non vengono caricate.
        La navigazione continua a funzionare perché i metadati sono nel database.
    </Message>
</template>
