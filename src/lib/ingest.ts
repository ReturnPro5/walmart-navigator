import Papa from "papaparse";
import {
  countRecords,
  getDB,
  makeFileId,
  upsertFile,
  type RowRecord,
} from "./db";

export type IngestProgress =
  | { phase: "idle"; percent: 0 }
  | { phase: "parsing"; percent: number; detail?: string }
  | { phase: "done"; percent: 100; detail?: string }
  | { phase: "error"; percent: number; detail: string };

const UNIQUE_KEY = "TRGID";

export async function ingestFile(
  file: File,
  onProgress: (p: IngestProgress) => void
) {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    const msg = "Only CSV supported for large files.";
    onProgress({ phase: "error", percent: 0, detail: msg });
    throw new Error(msg);
  }

  const fileId = makeFileId(file);

  await upsertFile({
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
  });

  const db = await getDB();

  let rowsSeen = 0;
  let rowsUpserted = 0;
  let bytesProcessed = 0;

  await new Promise<void>((resolve, reject) => {
    Papa.parse<RowRecord>(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      chunkSize: 1024 * 1024,
      chunk: async (results, parser) => {
        try {
          const tx = db.transaction("records", "readwrite");
          const store = tx.objectStore("records");

          for (const row of results.data) {
            rowsSeen++;
            const key = String(row[UNIQUE_KEY] ?? "").trim();
            if (!key) continue;

            store.put({
              key,
              payload: row,
              sourceFileId: fileId,
            });

            rowsUpserted++;
          }

          await tx.done;

          bytesProcessed += results.meta?.cursor ?? 0;
          const percent = Math.min(
            99,
            Math.round((bytesProcessed / file.size) * 100)
          );

          onProgress({
            phase: "parsing",
            percent,
            detail: `${rowsSeen.toLocaleString()} rows`,
          });
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
    id: fileId,
    originalName: file.name,
    displayName: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    uploadedAt: Date.now(),
    rowsSeen,
    rowsUpserted,
    status: "ready",
  });

  const total = await countRecords();

  onProgress({
    phase: "done",
    percent: 100,
    detail: `Deduped TRGIDs: ${total.toLocaleString()}`,
  });
}
