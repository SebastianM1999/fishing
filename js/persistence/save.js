// IndexedDB save slot. Failures are reported but never take down the game.
const DB_NAME = "cozy-fishing";
const STORE = "saves";
const SLOT = "slot1";

let dbPromise = null;

function openDb() {
  if (!("indexedDB" in self)) return Promise.reject(new Error("IndexedDB unavailable"));
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch(err => { dbPromise = null; throw err; });
  return dbPromise;
}

function tx(mode, run) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

export function loadSave() {
  return tx("readonly", store => store.get(SLOT));
}

export function writeSave(data) {
  return tx("readwrite", store => store.put(data, SLOT));
}

export function deleteSave() {
  return tx("readwrite", store => store.delete(SLOT));
}
