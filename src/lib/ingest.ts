// src/lib/ingest.ts
import Papa from "papaparse";
import {
  countRecords,
  makeFileId,
  putRecordsBatch,
  upsertFile,
  markFileError,
  type RowRecord,
  type StoredRecord,
} from "./db";

export type IngestProgress =
  | { phase: "idle"; percent: 0 }
  | { phase: "reading"; percent: number; detail?: string }
  | { phase: "parsing"; percent: number; detail?: string }
  | { phase: "done"; percent: 100; detail?: string }
  | { phase: "error"; percent: number; detail: string };

const UNIQUE_KEY = "TRGID";

// Tune these for browser stability
const CHUNK_SIZE_BYTES = 1024 * 1024; // 1MB Papa chunking
const WRITE_BATCH = 1500; // how many rows to write per IndexedDB tx

function yieldToUI() {
  return new Promise<void>((r) => setTimeout(r, 0));
}

export async function ingestFile(file: File, onProgress: (p: IngestProgress) => void) {
  const fileId = makeFileId(file);

  if (!file.name.toLowerCase().endsWith(".csv")) {
    const msg = "Only CSV is supported for large inventory uploads.";
    onProgress({ phase: "error", percent: 0, detail: msg });
    throw new Error(msg);
  }

  const meta = {
    id: fileId,
    originalName: file.name,
    displayName: file.name,
    size: file.size,
    type: file.type || "text/csv",
    lastModified: file.lastModified,
    uploadedAt: Date.now(),
    rowsSeen: 0,
    rowsUpserted: 0,
    status: "processing" as const,
    errorDetail: undefined as string | undefined,
  };

  await upsertFile(meta);

  let rowsSeen = 0;
  let rowsUpserted = 0;

  // Papa gives cursor = bytes processed in file (for File input)
  let lastCursor = 0;
  const totalBytes = file.size || 1;

  onProgress({ phase: "reading", percent: 1, detail: "Starting parse…" });

  try {
    await new Promise<void>((resolve, reject) => {
      let buffer: StoredRecord[] = [];

      Papa.parse<RowRecord>(file, {
        header: true,
        skipEmptyLines: true,
        worker: true,
        chunkSize: CHUNK_SIZE_BYTES,
        chunk: async (results, parser) => {
          try {
            const data = results.data ?? [];

            for (const row of data) {
              rowsSeen++;

              const key = String((row as any)?.[UNIQUE_KEY] ?? "").trim();
              if (!key) continue;

              buffer.push({
                key,
                payload: row,
                sourceFileId: fileId,
                updatedAt: Date.now(),
              });

              rowsUpserted++;

              if (buffer.length >= WRITE_BATCH) {
                // write + clear
                const toWrite = buffer;
                buffer = [];
                await putRecordsBatch(toWrite);
                await yieldToUI();
              }
            }

            // update progress
            const cursor = Number(results.meta?.cursor ?? lastCursor);
            if (cursor && cursor >= lastCursor) lastCursor = cursor;

            const percent = Math.min(99, Math.round((lastCursor / totalBytes) * 100));
            onProgress({
              phase: "parsing",
              percent,
              detail: `Rows processed: ${rowsSeen.toLocaleString()}`,
            });
          } catch (err) {
            parser.abort();
            reject(err);
          }
        },
        complete: async () => {
          try {
            // flush remaining buffer
            // @ts-ignore - buffer is in closure; TS doesn’t see it here if moved, but runtime is fine
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            // flush logic is in a closure variable; handled by parser completion below via outer scope
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        error: (err) => reject(err),
      });

      // IMPORTANT: Papa's `complete` fires after last chunk callback,
      // but we still need to flush the last buffer from within this closure.
      // So we patch resolve to flush.
      const origResolve = resolve;
      resolve = async () => {
        try {
          // flush remaining buffer
          if (buffer.length) {
            await putRecordsBatch(buffer);
            buffer = [];
          }
          origResolve();
        } catch (e) {
          reject(e);
        }
      };
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
      detail: `Done. Total deduped TRGIDs: ${total.toLocaleString()}`,
    });

    return { fileId, rowsSeen, rowsUpserted, total };
  } catch (e: any) {
    const msg = e?.message ? String(e.message) : "Upload failed";
    await markFileError(fileId, msg);
    onProgress({ phase: "error", percent: 0, detail: msg });
    throw e;
  }
}
