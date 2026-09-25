<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import useSessionStore from '@/stores/session';

const route = useRoute();
const router = useRouter();
const session = useSessionStore();

const username = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

// Dopo il login si torna dove si voleva andare. Solo percorsi interni: un
// redirect verso un altro sito, scritto nell'URL da qualcun altro, no.
function target() {
    const redirect = route.query.redirect;
    return (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) ? redirect : '/';
}

async function submit() {
    if (!username.value || !password.value) {
        return;
    }
    busy.value = true;
    error.value = '';
    try {
        await session.login(username.value.trim(), password.value);
        router.replace(target());
    }
    catch(err) {
        // L'API dice gia' la cosa giusta: credenziali errate, o troppi tentativi.
        error.value = err.message;
        password.value = '';
    }
    finally {
        busy.value = false;
    }
}
</script>

<template>
    <div class="login-page">
        <form class="login-card" @submit.prevent="submit">
            <h1 class="login-title">PhotoVault</h1>

            <label for="login-user" class="block mb-1">Nome utente</label>
            <InputText id="login-user" v-model="username" class="w-full mb-3"
                       autocomplete="username" autofocus />

            <label for="login-password" class="block mb-1">Password</label>
            <Password v-model="password" input-id="login-password" class="w-full mb-3" input-class="w-full"
                      :feedback="false" toggle-mask autocomplete="current-password" />

            <Message v-if="error" severity="error" :closable="false" class="mb-3">{{ error }}</Message>

            <Button type="submit" label="Entra" icon="pi pi-sign-in" class="w-full"
                    :loading="busy" :disabled="!username || !password" />
        </form>
    </div>
</template>
