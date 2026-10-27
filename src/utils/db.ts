import type { AppSettings, Subscription } from '../types';
import { DB_NAME, DB_VERSION, STORE_SETTINGS, STORE_SUBSCRIPTIONS } from '../types';

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_SUBSCRIPTIONS)) {
        const store = db.createObjectStore(STORE_SUBSCRIPTIONS, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('nextRenewalDate', 'nextRenewalDate', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    req.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    req.onerror = () => reject(req.error);
  });
}

function tx(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest | void
): Promise<unknown> {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const req = fn(store);
        if (req) {
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        } else {
          transaction.oncomplete = () => resolve(undefined);
          transaction.onerror = () => reject(transaction.error);
        }
      })
  );
}

// ── Subscriptions ─────────────────────────────────────────────────────────────

export async function getAllSubscriptions(): Promise<Subscription[]> {
  return tx(STORE_SUBSCRIPTIONS, 'readonly', (store) => store.getAll()) as Promise<Subscription[]>;
}

export async function saveSubscription(sub: Subscription): Promise<void> {
  await tx(STORE_SUBSCRIPTIONS, 'readwrite', (store) => store.put(sub));
}

export async function deleteSubscription(id: string): Promise<void> {
  await tx(STORE_SUBSCRIPTIONS, 'readwrite', (store) => store.delete(id));
}

export async function clearAllSubscriptions(): Promise<void> {
  await tx(STORE_SUBSCRIPTIONS, 'readwrite', (store) => store.clear());
}

export async function bulkSaveSubscriptions(subs: Subscription[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_SUBSCRIPTIONS, 'readwrite');
    const store = transaction.objectStore(STORE_SUBSCRIPTIONS);
    subs.forEach((s) => store.put(s));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K] | undefined> {
  const result = (await tx(STORE_SETTINGS, 'readonly', (store) =>
    store.get(key)
  )) as { key: string; value: AppSettings[K] } | undefined;
  return result?.value;
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  await tx(STORE_SETTINGS, 'readwrite', (store) => store.put({ key, value }));
}

export async function getAllSettings(): Promise<Partial<AppSettings>> {
  const entries = (await tx(STORE_SETTINGS, 'readonly', (store) =>
    store.getAll()
  )) as { key: string; value: unknown }[];
  const settings: Partial<AppSettings> = {};
  entries.forEach(({ key, value }) => {
    (settings as Record<string, unknown>)[key] = value;
  });
  return settings;
}
