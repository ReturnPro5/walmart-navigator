// src/lib/ingest.ts
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

function idbRequest<T = unknown>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
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

  // Guardrails (tune as needed)
  const MAX_MB = 350;
  const mb = Math.round((file.size / 1024 / 1024) * 10) / 10;
  if (mb > MAX_MB) {
    const msg = `File too large (${mb}MB). Limit is ${MAX_MB}MB per file in-browser.`;
    onProgress({ phase: "error", percent: 0, detail: msg });
    throw new Error(msg);
  }

  onProgress({ phase: "reading", percent: 1, detail: `Preparing ${file.name}` });

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

  const db = await getDB();
  const tx = db.transaction(["records", "files"], "readwrite");
  const store = tx.objectStore("records");

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
            const puts: Promise<unknown>[] = [];

            for (const row of results.data) {
              rowsSeen++;

              const key = String((row as any)?.[UNIQUE_KEY] ?? "").trim();
              if (!key) continue;

              puts.push(
                idbRequest(
                  store.put({
                    key,              // <-- dedupe key
                    payload: row,
                    sourceFileId: fileId,
                  })
                )
              );

              rowsUpserted++;
            }

            await Promise.all(puts);

            // Papa meta.cursor is absolute position (not delta)
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

            // yield so UI updates
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

    // write file meta inside the same tx
    await idbRequest(
      tx.objectStore("files").put({
        ...meta,
        rowsSeen,
        rowsUpserted,
        status: "ready",
      })
    );

    await txDone(tx);

    const total = await countRecords();
    onProgress({
      phase: "done",
      percent: 100,
      detail: `Done. Total deduped TRGs: ${total.toLocaleString()}`,
    });

    return { fileId, rowsSeen, rowsUpserted, total };
  } catch (e: any) {
    try {
      tx.abort();
    } catch {}
    const msg = e?.message ? String(e.message) : "Upload failed.";
    await setFileStatus(fileId, "error", msg);
    onProgress({ phase: "error", percent: 0, detail: msg });
    throw e;
  }
}
