// src/lib/db.ts
export type FileMeta = {
  id: string;
  originalName: string;
  displayName: string;
  size: number;
  type: string;
  lastModified: number;
  uploadedAt: number;
  rowsSeen: number;
  rowsUpserted: number;
  status: "processing" | "ready" | "error";
  errorDetail?: string;
};

export type RowRecord = Record<string, unknown>;

export type StoredRecord = {
  key: string; // TRGID
  payload: RowRecord;
  sourceFileId: string;
  updatedAt: number;
};

const DB_NAME = "walmart-navigator-db";
const DB_VERSION = 1;

type Stores = "files" | "records";

let _dbPromise: Promise<IDBDatabase> | null = null;

export function getDB(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise;

  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      // files store
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" });
      }

      // records store
      if (!db.objectStoreNames.contains("records")) {
        const store = db.createObjectStore("records", { keyPath: "key" });
        store.createIndex("by_sourceFileId", "sourceFileId", { unique: false });
        store.createIndex("by_updatedAt", "updatedAt", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return _dbPromise;
}

function txDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
    tx.onerror = () => reject(tx.error ?? new Error("Transaction error"));
  });
}

export function makeFileId(file: File) {
  // deterministic-enough id: name + size + lastModified
  return `${file.name}__${file.size}__${file.lastModified}`;
}

// ---------- FILES ----------
export async function upsertFile(meta: FileMeta) {
  const db = await getDB();
  const tx = db.transaction(["files"], "readwrite");
  tx.objectStore("files").put(meta);
  await txDone(tx);
}

export async function listFiles(): Promise<FileMeta[]> {
  const db = await getDB();
  const tx = db.transaction(["files"], "readonly");
  const store = tx.objectStore("files");

  const req = store.getAll();
  const rows = await new Promise<FileMeta[]>((resolve, reject) => {
    req.onsuccess = () => resolve((req.result ?? []) as FileMeta[]);
    req.onerror = () => reject(req.error);
  });

  await txDone(tx);

  // newest first
  rows.sort((a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0));
  return rows;
}

export async function renameFile(fileId: string, displayName: string) {
  const db = await getDB();
  const tx = db.transaction(["files"], "readwrite");
  const store = tx.objectStore("files");
  const existingReq = store.get(fileId);

  const existing = await new Promise<FileMeta | undefined>((resolve, reject) => {
    existingReq.onsuccess = () => resolve(existingReq.result as FileMeta | undefined);
    existingReq.onerror = () => reject(existingReq.error);
  });

  if (existing) {
    store.put({ ...existing, displayName });
  }

  await txDone(tx);
}

export async function markFileError(fileId: string, errorDetail: string) {
  const db = await getDB();
  const tx = db.transaction(["files"], "readwrite");
  const store = tx.objectStore("files");
  const existingReq = store.get(fileId);

  const existing = await new Promise<FileMeta | undefined>((resolve, reject) => {
    existingReq.onsuccess = () => resolve(existingReq.result as FileMeta | undefined);
    existingReq.onerror = () => reject(existingReq.error);
  });

  if (existing) {
    store.put({ ...existing, status: "error", errorDetail });
  }

  await txDone(tx);
}

export async function deleteFileAndRecords(fileId: string) {
  const db = await getDB();
  const tx = db.transaction(["records", "files"], "readwrite");
  const records = tx.objectStore("records");
  const idx = records.index("by_sourceFileId");

  // delete records by index
  const keyRange = IDBKeyRange.only(fileId);
  const cursorReq = idx.openCursor(keyRange);

  await new Promise<void>((resolve, reject) => {
    cursorReq.onerror = () => reject(cursorReq.error);
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor) return resolve();
      cursor.delete();
      cursor.continue();
    };
  });

  tx.objectStore("files").delete(fileId);
  await txDone(tx);
}

// ---------- RECORDS ----------
export async function countRecords(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction(["records"], "readonly");
  const store = tx.objectStore("records");
  const req = store.count();

  const n = await new Promise<number>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result ?? 0);
    req.onerror = () => reject(req.error);
  });

  await txDone(tx);
  return n;
}

export async function getSampleRecords(limit = 200): Promise<StoredRecord[]> {
  const db = await getDB();
  const tx = db.transaction(["records"], "readonly");
  const store = tx.objectStore("records");

  const out: StoredRecord[] = [];
  const cursorReq = store.openCursor();

  await new Promise<void>((resolve, reject) => {
    cursorReq.onerror = () => reject(cursorReq.error);
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor || out.length >= limit) return resolve();
      out.push(cursor.value as StoredRecord);
      cursor.continue();
    };
  });

  await txDone(tx);
  return out;
}

export async function putRecordsBatch(records: StoredRecord[]) {
  const db = await getDB();
  const tx = db.transaction(["records"], "readwrite");
  const store = tx.objectStore("records");
  for (const r of records) store.put(r);
  await txDone(tx);
}
