import { openDB } from 'idb';

export const dbPromise = openDB('walmart-db', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('files')) {
      db.createObjectStore('files', { keyPath: 'id' });
    }
  },
});

export async function saveFileToDB(file: any) {
  const db = await dbPromise;
  await db.put('files', file);
}

export async function deleteFileFromDB(id: string) {
  const db = await dbPromise;
  await db.delete('files', id);
}

export async function getAllFilesFromDB() {
  const db = await dbPromise;
  return db.getAll('files');
}
