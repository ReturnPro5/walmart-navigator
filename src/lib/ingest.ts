import Papa from "papaparse";
import {
  countRecords,
  getDB,
  makeFileId,
  nextOrderValue,
  setFileStatus,
  upsertFile,
  type FileMeta,
  type RowRecord,
} from "./db";

export type IngestProgress =
  | { phase: "idle"; percent: 0 }
  | { phase: "reading"; percent: number; detail?: string }
  | { phase: "parsing"; percent: number; detail?: string }
  | { phase: "done"; percent: 100; detail?: string }
  | { phase: "error"; percent: number; detail: string };

const UNIQUE_KEY = "TRGID";

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function writeChunk(
  rows: RowRecord[],
  fileId: string
): Promise<{ seen: number; upserted: number }> {
  const db = await getDB();
  const tx = db.transaction(["records"], "readwrite");
  const store = tx.objectStore("records");

  let seen = 0;
  let upserted = 0;

  for (const row of rows) {
    seen++;
    const key = String((row as any)?.[UNIQUE_KEY] ?? "").trim();
    if (!key) continue;

    store.put({
      key,
      payload: row,
      sourceFileId: fileId,
    });

    upserted++;
  }

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

  return { seen, upserted };
}

export async function ingestFile(
  file: File,
  onProgress: (p: IngestProgress) => void
) {
  const fileId = makeFileId(file);

  if (!file.name.toLowerCase().endsWith(".csv")) {
    const msg = "Only CSV is supported for large inventory uploads.";
    onProgress({ phase: "error", percent: 0, detail: msg });
    throw new Error(msg);
  }

  onProgress({ phase: "reading", percent: 1, detail: "Preparing upload…" });

  const order = await nextOrderValue();

  const meta: FileMeta = {
    id: fileId,
    originalName: file.name,
    displayName: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    uploadedAt: Date.now(),
    rowsSeen: 0,
    rowsUpserted: 0,
    status: "processing",
    order,
  };

  await upsertFile(meta);

  let rowsSeen = 0;
  let rowsUpserted = 0;
  let lastCursor = 0;
  const totalBytes = file.size;

  try {
    await new Promise<void>((resolve, reject) => {
      Papa.parse<RowRecord>(file, {
        header: true,
        skipEmptyLines: true,
        worker: true,
        chunkSize: 1024 * 1024, // 1MB
        chunk: async (results, parser) => {
          try {
            const { seen, upserted } = await writeChunk(
              results.data,
              fileId
            );

            rowsSeen += seen;
            rowsUpserted += upserted;

            const cursor = results.meta?.cursor ?? lastCursor;
            lastCursor = cursor;

            const percent = Math.min(
              99,
              Math.round((cursor / totalBytes) * 100)
            );

            onProgress({
              phase: "parsing",
              percent,
              detail: `Rows processed: ${rowsSeen.toLocaleString()}`,
            });

            // yield to UI thread
            await new Promise((r) => setTimeout(r, 0));
          } catch (err) {
            parser.abort();
            reject(err);
          }
        },
        complete: () => resolve(),
        error: (err) => reject(err),
      });
    });

    await upsertFile({
      ...meta,
      rowsSeen,
      rowsUpserted,
      status: "ready",
    });

    const total = await countRecords();

    onProgress({
      phase: "done",
      percent: 100,
      detail: `Done. Total deduped TRGs: ${total.toLocaleString()}`,
    });

    return { fileId, rowsSeen, rowsUpserted, total };
  } catch (e: any) {
    const msg = e?.message ?? "Upload failed";
    await setFileStatus(fileId, "error", msg);
    onProgress({ phase: "error", percent: 0, detail: msg });
    throw e;
  }
}
