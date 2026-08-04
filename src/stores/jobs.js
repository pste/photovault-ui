import { ref } from 'vue';
import { defineStore } from 'pinia';
import { api } from '@/plugins/api';

const useJobsStore = defineStore('jobs', () => {
    const jobs = ref([]);

    async function load() {
        jobs.value = await api.get('/jobs');
        return jobs.value;
    }

    // Accodare un job gia' pendente ne sposta l'orario invece di duplicarlo:
    // se ne occupa l'upsert lato API.
    async function enqueue(name) {
        await api.post('/jobs', { name });
        await load();
    }

    async function remove(job_id) {
        await api.del(`/jobs/${job_id}`);
        await load();
    }

    return { jobs, load, enqueue, remove };
});

export default useJobsStore;
