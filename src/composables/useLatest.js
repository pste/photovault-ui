// Riconosce le risposte superate.
//
// Quando l'utente cambia cartella, filtro o pagina prima che la risposta
// precedente arrivi, le due richieste sono in volo insieme e nessuno garantisce
// l'ordine d'arrivo: se arriva per ultima quella vecchia, sovrascrive la nuova.
// Ogni richiesta prende un token; a risposta arrivata, se nel frattempo ne e'
// partita un'altra il token non e' piu' quello corrente e la risposta si scarta.
export function useLatest() {
    let generation = 0;

    return {
        // Per una richiesta che rende superate tutte quelle prima: apri una
        // cartella, applica un filtro, cambia pagina.
        start: () => ++generation,
        // Per una richiesta che si accoda senza invalidare le altre, come la
        // pagina successiva dell'infinite scroll: diventa superata se nel
        // frattempo ne parte una con start().
        peek: () => generation,
        isCurrent: (token) => token === generation,
    };
}
