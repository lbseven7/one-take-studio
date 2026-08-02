(function(){
  const DB_NAME = 'OneTakeDB';
  const DB_VERSION = 6;

  const STORES = [
    'claquete_takes',
    'claquete_state',
    'pauta_cards',
    'teleprompter_state',
    'checklist_state',
    'roteirizador_scripts',
    'banco_ideias',
    'ia_state',
    'jornada_state',
    'tracker_videos',
    'calendario_entries'
  ];

  let instance = null;

  async function open(){
    if(instance) return instance;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        STORES.forEach(name => {
          if(!db.objectStoreNames.contains(name))
            db.createObjectStore(name, { keyPath: 'id' });
        });
      };
      req.onsuccess = (e) => {
        instance = e.target.result;
        resolve(instance);
      };
      req.onerror = () => reject(req.error);
    });
  }

  const db = {
    async getAll(store){
      const d = await open();
      return new Promise((resolve, reject) => {
        const tx = d.transaction(store, 'readonly');
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    },

    async get(store, key){
      const d = await open();
      return new Promise((resolve, reject) => {
        const tx = d.transaction(store, 'readonly');
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },

    async put(store, value){
      const d = await open();
      return new Promise((resolve, reject) => {
        const tx = d.transaction(store, 'readwrite');
        const req = tx.objectStore(store).put(value);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },

    async del(store, key){
      const d = await open();
      return new Promise((resolve, reject) => {
        const tx = d.transaction(store, 'readwrite');
        const req = tx.objectStore(store).delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    },

    async clear(store){
      const d = await open();
      return new Promise((resolve, reject) => {
        const tx = d.transaction(store, 'readwrite');
        const req = tx.objectStore(store).clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
  };

  // -------- MIGRATION helpers --------
  const MIGRATIONS = {
    'claquete-takes-v1': async (data) => {
      const arr = JSON.parse(data);
      if(!Array.isArray(arr)) return;
      for(const item of arr){
        await db.put('claquete_takes', item);
      }
    },
    'claquete-state-v1': async (data) => {
      const obj = JSON.parse(data);
      if(!obj) return;
      await db.put('claquete_state', { id: 'state', ...obj });
    },
    'painel-pauta-cards-v1': async (data) => {
      const arr = JSON.parse(data);
      if(!Array.isArray(arr)) return;
      for(const item of arr){
        await db.put('pauta_cards', item);
      }
    }
  };

  async function migrateFromLocalStorage(){
    const MIGRATED_KEY = 'onetake-migrated-v1';
    if(localStorage.getItem(MIGRATED_KEY)) return;

    const keys = Object.keys(MIGRATIONS);
    let migrated = false;

    for(const key of keys){
      const raw = localStorage.getItem(key);
      if(raw){
        try{
          await MIGRATIONS[key](raw);
          localStorage.removeItem(key);
          migrated = true;
        }catch(e){
          console.warn('OneTake: falha ao migrar', key, e);
        }
      }
    }

    if(migrated){
      localStorage.setItem(MIGRATED_KEY, '1');
    }
  }

  // -------- BACKUP (export / import) --------
  async function exportAll(){
    const d = await open();
    const data = {};
    for(const name of Array.from(d.objectStoreNames)){
      data[name] = await new Promise((resolve, reject) => {
        const tx = d.transaction(name, 'readonly');
        const req = tx.objectStore(name).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    }
    return {
      format: 'takeum-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      data
    };
  }

  async function importAll(payload){
    if(!payload || payload.format !== 'takeum-backup' || !payload.data || typeof payload.data !== 'object'){
      throw new Error('Arquivo de backup inválido');
    }
    const d = await open();
    for(const name of Array.from(d.objectStoreNames)){
      await new Promise((resolve, reject) => {
        const tx = d.transaction(name, 'readwrite');
        const os = tx.objectStore(name);
        os.clear();
        const records = payload.data[name] || [];
        records.forEach(rec => os.put(rec));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }

  window.OneTakeDB = db;
  window.OneTakeMigrate = migrateFromLocalStorage;
  window.TakeUmBackup = { exportAll, importAll };
})();
