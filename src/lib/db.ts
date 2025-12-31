import { openDB, type IDBPDatabase } from "idb";

export type RowRecord = Record<string, any>;

export interface StoredRecord {
  key: string; // TRGID
  payload: RowRecord;
  sourceFileId: string;
}

export interface StoredFile {
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
}

const DB_NAME = "inventory-db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function makeFileId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("records")) {
          const store = db.createObjectStore("records", {
            keyPath: "key",
          });
          store.createIndex("sourceFileId", "sourceFileId");
        }

        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function upsertFile(file: StoredFile) {
  const db = await getDB();
  await db.put("files", file);
}

export async function getFiles(): Promise<StoredFile[]> {
  const db = await getDB();
  return db.getAll("files");
}

export async function countRecords(): Promise<number> {
  const db = await getDB();
  return db.count("records");
}

export async function getSampleRecords(limit = 500) {
  const db = await getDB();
  const tx = db.transaction("records", "readonly");
  const store = tx.objectStore("records");

  const rows: StoredRecord[] = [];
  let cursor = await store.openCursor();

  while (cursor && rows.length < limit) {
    rows.push(cursor.value);
    cursor = await cursor.continue();
  }

  await tx.done;
  return rows;
}
