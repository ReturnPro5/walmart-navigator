import Papa from "papaparse";
import { countRecords, getDB, makeFileId, upsertFile, type RowRecord } from "./db";

export type IngestProgress =
  | { phase: "idle"; percent: 0 }
  | { phase: "reading"; percent: number; detail?: string }
  | { phase: "parsing"; percent: number; detail?: string }
  | { phase: "done"; percent: 100; detail?: string }
  | { phase: "error"; percent: number; detail: string };

const UNIQUE_KEY = "TRGID";

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

  const meta = {
    id: fileId,
    originalName: file.name,
    displayName: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    uploadedAt: Date.now(),
    rowsSeen: 0,
    rowsUpserted: 0,
    status: "processing" as const,
  };

  await upsertFile(meta);

  const db = await getDB();
  const tx = db.transaction(["records", "files"], "readwrite");

  let rowsSeen = 0;
  let rowsUpserted = 0;
  let chunkCount = 0;

  await new Promise<void>((resolve, reject) => {
    Papa.parse<RowRecord>(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      chunkSize: 1024 * 1024,
      chunk: async (results, parser) => {
        try {
          chunkCount++;

          for (const row of results.data) {
            rowsSeen++;

            const key = String(row[UNIQUE_KEY] ?? "").trim();
            if (!key) continue;

            await tx.objectStore("records").put({
              key,
              payload: row,
              sourceFileId: fileId,
            });

            rowsUpserted++;
          }

          const pct = Math.min(99, Math.round((chunkCount / 50) * 100));
          onProgress({
            phase: "parsing",
            percent: pct,
            detail: `Rows processed: ${rowsSeen.toLocaleString()}`,
          });

          if (chunkCount % 3 === 0) {
            await new Promise((r) => setTimeout(r, 0));
          }
        } catch (err) {
          parser.abort();
          reject(err);
        }
      },
      complete: () => resolve(),
      error: (err) => reject(err),
    });
  });

  await tx.objectStore("files").put({
    ...meta,
    rowsSeen,
    rowsUpserted,
    status: "ready",
  });

  await tx.done;

  const total = await countRecords();

  onProgress({
    phase: "done",
    percent: 100,
    detail: `Done. Total deduped TRGs: ${total.toLocaleString()}`,
  });

  return { fileId, rowsSeen, rowsUpserted, total };
}
