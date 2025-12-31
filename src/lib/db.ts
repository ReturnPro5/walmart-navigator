import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type RowRecord = Record<string, unknown>;

export type StoredFile = {
  id: string;
  originalName: string;
  displayName: string;
  size: number;
  type: string;
  lastModified: number;
  uploadedAt: number;
  rowsSeen: number;
  rowsUpserted: number;
  status: "ready" | "processing" | "error";
  errorMessage?: string;
};

interface AppDB extends DBSchema {
  files: {
    key: string;
    value: StoredFile;
    indexes: { "by_uploadedAt": number };
  };
  records: {
    key: string; // TRGID
    value: {
      key: string;
      payload: RowRecord;
      sourceFileId: string;
    };
  };
}

let _db: Promise<IDBPDatabase<AppDB>> | null = null;

export function getDB() {
  if (!_db) {
    _db = openDB<AppDB>("walmart_listings_db", 1, {
      upgrade(db) {
        const files = db.createObjectStore("files", { keyPath: "id" });
        files.createIndex("by_uploadedAt", "uploadedAt");
        db.createObjectStore("records", { keyPath: "key" });
      },
    });
  }
  return _db;
}

export function makeFileId(file: File) {
  return `${file.name}__${file.size}__${file.lastModified}`;
}

export async function upsertFile(meta: StoredFile) {
  const db = await getDB();
  await db.put("files", meta);
}

export async function listFiles() {
  const db = await getDB();
  return db.getAllFromIndex("files", "by_uploadedAt");
}

export async function deleteFileAndItsData(fileId: string) {
  const db = await getDB();

  await db.delete("files", fileId);

  const tx = db.transaction("records", "readwrite");
  const all = await tx.store.getAll();
  for (const rec of all) {
    if (rec.sourceFileId === fileId) {
      await tx.store.delete(rec.key);
    }
  }
  await tx.done;
}

export async function clearAll() {
  const db = await getDB();
  await Promise.all([db.clear("files"), db.clear("records")]);
}

export async function countRecords() {
  const db = await getDB();
  return db.count("records");
}
