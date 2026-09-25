// Formattazione di dimensioni e date, uguale in tutta l'interfaccia.
//
// Prima ogni pagina aveva la sua copia, con regole diverse: il Cestino mostrava
// tutto in KB -- un file da 3 GB diventava "3145728 KB" -- e altrove si usava
// toFixed, che mette il punto decimale. In italiano il punto e' il separatore
// delle migliaia: "1.08 TB" accanto a "338.608 media" si legge come mille volte
// tanto.

function decimals(n, digits) {
    return n.toLocaleString('it-IT', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

// KB fino a un mega, poi MB, GB, TB: nell'archivio convivono file da 2 KB e
// ISO da qualche giga, e una sola unita' ne renderebbe illeggibile una parte.
export function formatSize(bytes) {
    const n = Number(bytes || 0);
    if (n >= 1024 ** 4) {
        return `${decimals(n / 1024 ** 4, 2)} TB`;
    }
    if (n >= 1024 ** 3) {
        return `${decimals(n / 1024 ** 3, 1)} GB`;
    }
    if (n >= 1024 ** 2) {
        return `${decimals(n / 1024 ** 2, 1)} MB`;
    }
    return `${decimals(n / 1024, 0)} KB`;
}

export function formatDate(value) {
    return value ? new Date(value).toLocaleDateString('it-IT') : '';
}

export function formatDateTime(value) {
    return value ? new Date(value).toLocaleString('it-IT') : '';
}
