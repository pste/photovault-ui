const isDebug = import.meta.env.DEV;

export default {
    log: (...args) => { if (isDebug) { console.log(...args); } },
    info: console.log,
    error: console.error,
}
