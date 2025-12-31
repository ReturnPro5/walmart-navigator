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
  rowsUpserted: number;
  rowsSeen: number;
  status: "ready" | "processing" | "error";
  errorMessage?: string;
};

type AppSettings = {
  uniqueKeyField: string;
  latestDateField: string;
};

interface AppDB extends DBSchema {
  files: {
    key: string;
    value: StoredFile;
    indexes: { "by_uploadedAt": number };
  };
  records: {
    key: string;
    value: { key: string; lastUpdatedEpoch: number; payload: RowRecord; sourceFileId: string };
  };
  settings: {
    key: "app";
    value: AppSettings;
  };
}

let _db: Promise<IDBPDatabase<AppDB>> | null = null;

export function getDB() {
  if (!_db) {
    _db = openDB<AppDB>("lovable_uploader_db", 1, {
      upgrade(db) {
        const files = db.createObjectStore("files", { keyPath: "id" });
        files.createIndex("by_uploadedAt", "uploadedAt");
        db.createObjectStore("records", { keyPath: "key" });
        db.createObjectStore("settings");
      },
    });
  }
  return _db;
}

export function makeFileId(file: File) {
  return `${file.name}__${file.size}__${file.lastModified}`;
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const existing = await db.get("settings", "app");
  if (existing) return existing;

  const defaults: AppSettings = { uniqueKeyField: "TRGID", latestDateField: "Order Closed Date" };
  await db.put("settings", defaults, "app");
  return defaults;
}

export async function setSettings(next: Partial<AppSettings>) {
  const db = await getDB();
  const current = await getSettings();
  const merged = { ...current, ...next };
  await db.put("settings", merged, "app");
  return merged;
}

export async function upsertFile(meta: StoredFile) {
  const db = await getDB();
  await db.put("files", meta);
}

export async function listFiles(): Promise<StoredFile[]> {
  const db = await getDB();
  return db.getAllFromIndex("files", "by_uploadedAt");
}

export async function renameStoredFile(fileId: string, newDisplayName: string) {
  const db = await getDB();
  const existing = await db.get("files", fileId);
  if (!existing) return;
  await db.put("files", { ...existing, displayName: newDisplayName });
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

// SAFE preview: only returns tiny metadata, never the entire payload
export async function getPreviewKeys(limit = 25) {
  const db = await getDB();
  const tx = db.transaction("records", "readonly");
  const out: Array<{ key: string; lastUpdatedEpoch: number; sourceFileId: string }> = [];
  let cursor = await tx.store.openCursor();
  while (cursor && out.length < limit) {
    out.push({
      key: cursor.value.key,
      lastUpdatedEpoch: cursor.value.lastUpdatedEpoch,
      sourceFileId: cursor.value.sourceFileId,
    });
    cursor = await cursor.continue();
  }
  await tx.done;
  return out;
}

export function parseDateToEpoch(value: unknown): number {
  if (!value) return NaN;

  if (value instanceof Date) return value.getTime();

  if (typeof value === "number") {
    if (value > 10_000_000_000) return value;
    const excelEpoch = new Date(Date.UTC(1899, 11, 30)).getTime();
    return excelEpoch + value * 86400000;
  }

  if (typeof value === "string") {
    const t = Date.parse(value);
    if (!Number.isNaN(t)) return t;
  }

  return NaN;
}
