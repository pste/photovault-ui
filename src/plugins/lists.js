// Accoda una pagina di media a quelli gia' caricati, senza doppioni.
//
// Le liste sono ordinate per data di scatto, e lo scan dei 15 minuti puo'
// inserire media piu' recenti mentre si scorre: tutto slitta in avanti, e la
// pagina successiva ripete l'ultimo file della precedente. Doppione a video e
// :key duplicata per Vue, che poi aggiorna le tile sbagliate.
export function appendMedia(list, more) {
    const seen = new Set(list.map((m) => m.media_id));
    return list.concat(more.filter((m) => !seen.has(m.media_id)));
}
