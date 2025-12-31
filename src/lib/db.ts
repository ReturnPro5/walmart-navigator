// src/lib/db.ts
export type RowRecord = Record<string, unknown>;

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
  errorMessage?: string;
  order: number; // priority; higher order = later precedence when you delete/re-upload
};

const DB_NAME = "inventory_db";
const DB_VERSION = 3;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      // files store
      if (!db.objectStoreNames.contains("files")) {
        const files = db.createObjectStore("files", { keyPath: "id" });
        files.createIndex("order", "order", { unique: false });
        files.createIndex("uploadedAt", "uploadedAt", { unique: false });
      }

      // records store (dedupe by TRGID)
      if (!db.objectStoreNames.contains("records")) {
        const records = db.createObjectStore("records", { keyPath: "key" });
        records.createIndex("sourceFileId", "sourceFileId", { unique: false });
      }

      // meta store
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) dbPromise = openDB();
  return dbPromise;
}

export function makeFileId(file: File): string {
  // Stable enough; avoids hashing huge data (no terminal, no node crypto)
  return `${file.name}__${file.size}__${file.lastModified}`;
}

function idbRequest<T = unknown>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbTxDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function upsertFile(meta: FileMeta): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["files"], "readwrite");
  await idbRequest(tx.objectStore("files").put(meta));
  await idbTxDone(tx);
}

export async function getFiles(): Promise<FileMeta[]> {
  const db = await getDB();
  const tx = db.transaction(["files"], "readonly");
  const store = tx.objectStore("files");
  const all = await idbRequest<FileMeta[]>(store.getAll());
  await idbTxDone(tx);
  // sort by order asc (lowest first)
  return all.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function renameFile(fileId: string, displayName: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["files"], "readwrite");
  const store = tx.objectStore("files");
  const meta = await idbRequest<FileMeta | undefined>(store.get(fileId));
  if (!meta) {
    await idbTxDone(tx);
    return;
  }
  meta.displayName = displayName.trim() || meta.originalName;
  await idbRequest(store.put(meta));
  await idbTxDone(tx);
}

export async function setFileStatus(fileId: string, status: FileMeta["status"], errorMessage?: string) {
  const db = await getDB();
  const tx = db.transaction(["files"], "readwrite");
  const store = tx.objectStore("files");
  const meta = await idbRequest<FileMeta | undefined>(store.get(fileId));
  if (!meta) {
    await idbTxDone(tx);
    return;
  }
  meta.status = status;
  meta.errorMessage = errorMessage;
  await idbRequest(store.put(meta));
  await idbTxDone(tx);
}

export async function nextOrderValue(): Promise<number> {
  const files = await getFiles();
  const max = files.reduce((m, f) => Math.max(m, f.order ?? 0), 0);
  return max + 1;
}

export async function reorderFile(fileId: string, direction: "up" | "down"): Promise<void> {
  const files = await getFiles();
  const idx = files.findIndex((f) => f.id === fileId);
  if (idx === -1) return;

  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= files.length) return;

  const a = files[idx];
  const b = files[swapWith];

  const tmp = a.order;
  a.order = b.order;
  b.order = tmp;

  const db = await getDB();
  const tx = db.transaction(["files"], "readwrite");
  const store = tx.objectStore("files");
  await idbRequest(store.put(a));
  await idbRequest(store.put(b));
  await idbTxDone(tx);
}

export async function deleteFileAndItsRecords(fileId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["records", "files"], "readwrite");
  const recordStore = tx.objectStore("records");
  const idx = recordStore.index("sourceFileId");

  // delete records belonging to this file
  let cursor = await idbRequest<IDBCursorWithValue | null>(idx.openCursor(IDBKeyRange.only(fileId)));
  while (cursor) {
    cursor.delete();
    cursor = await idbRequest<IDBCursorWithValue | null>(cursor.continue());
  }

  // delete file meta
  await idbRequest(tx.objectStore("files").delete(fileId));
  await idbTxDone(tx);
}

export async function countRecords(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction(["records"], "readonly");
  const store = tx.objectStore("records");
  const total = await idbRequest<number>(store.count());
  await idbTxDone(tx);
  return total;
}

export type StoredRecord = {
  key: string;
  payload: RowRecord;
  sourceFileId: string;
};

export async function sampleRecords(limit = 50): Promise<StoredRecord[]> {
  const db = await getDB();
  const tx = db.transaction(["records"], "readonly");
  const store = tx.objectStore("records");
  const out: StoredRecord[] = [];
  let cursor = await idbRequest<IDBCursorWithValue | null>(store.openCursor());
  while (cursor && out.length < limit) {
    out.push(cursor.value as StoredRecord);
    cursor = await idbRequest<IDBCursorWithValue | null>(cursor.continue());
  }
  await idbTxDone(tx);
  return out;
}

export async function exportDedupedCSV(
  filename = "deduped_inventory.csv",
  maxRows = 500_000
): Promise<void> {
  // NOTE: exporting 1M+ rows to a single CSV can be huge in-browser.
  // This function streams in chunks and builds a Blob; still can be heavy.
  const db = await getDB();
  const tx = db.transaction(["records"], "readonly");
  const store = tx.objectStore("records");

  // Discover headers from first row
  const firstCursor = await idbRequest<IDBCursorWithValue | null>(store.openCursor());
  if (!firstCursor) {
    await idbTxDone(tx);
    throw new Error("No records to export.");
  }

  const first = firstCursor.value as StoredRecord;
  const headers = Object.keys(first.payload ?? {});

  const chunks: string[] = [];
  chunks.push(headers.join(",") + "\n");

  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    // CSV escape
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  let rows = 0;

  // iterate from the beginning again (include first)
  let cursor = await idbRequest<IDBCursorWithValue | null>(store.openCursor());
  while (cursor) {
    const rec = cursor.value as StoredRecord;
    const row = rec.payload || {};
    const line = headers.map((h) => esc((row as any)[h])).join(",") + "\n";
    chunks.push(line);

    rows++;
    if (rows >= maxRows) break;

    // yield a bit to avoid locking UI
    if (rows % 5000 === 0) await new Promise((r) => setTimeout(r, 0));

    cursor = await idbRequest<IDBCursorWithValue | null>(cursor.continue());
  }

  await idbTxDone(tx);

  const blob = new Blob(chunks, { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
