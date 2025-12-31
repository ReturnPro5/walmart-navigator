import Papa from "papaparse";
import * as XLSX from "xlsx";
import { countRecords, getDB, getSettings, makeFileId, parseDateToEpoch, upsertFile, type RowRecord } from "./db";

export type IngestProgress =
  | { phase: "idle"; percent: 0; detail?: string }
  | { phase: "reading"; percent: number; detail?: string }
  | { phase: "parsing"; percent: number; detail?: string }
  | { phase: "deduping"; percent: number; detail?: string }
  | { phase: "done"; percent: 100; detail?: string }
  | { phase: "error"; percent: number; detail: string };

const XLSX_MAX_BYTES = 25 * 1024 * 1024; // protect browser

function toSafeString(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v);
}

export async function ingestFile(
  file: File,
  onProgress: (p: IngestProgress) => void
): Promise<{ fileId: string; rowsSeen: number; rowsUpserted: number; totalRecordsAfter: number }> {
  const fileId = makeFileId(file);
  const settings = await getSettings();

  const baseMeta = {
    id: fileId,
    originalName: file.name,
    displayName: file.name,
    size: file.size,
    type: file.type || "unknown",
    lastModified: file.lastModified,
    uploadedAt: Date.now(),
    rowsUpserted: 0,
    rowsSeen: 0,
    status: "processing" as const,
  };

  await upsertFile(baseMeta);

  try {
    const ext = file.name.toLowerCase().split(".").pop() || "";

    if (ext === "xlsx" || ext === "xls") {
      if (file.size > XLSX_MAX_BYTES) {
        const msg =
          `XLSX too large (${Math.round(file.size / 1024 / 1024)}MB). ` +
          `Export to CSV and upload CSV instead (prevents browser crashes).`;
        await upsertFile({ ...baseMeta, status: "error", errorMessage: msg });
        onProgress({ phase: "error", percent: 0, detail: msg });
        throw new Error(msg);
      }
      return await ingestXlsx(file, fileId, settings.uniqueKeyField, settings.latestDateField, onProgress);
    }

    return await ingestCsv(file, fileId, settings.uniqueKeyField, settings.latestDateField, onProgress);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown ingest error";
    await upsertFile({ ...baseMeta, status: "error", errorMessage: msg });
    onProgress({ phase: "error", percent: 0, detail: msg });
    throw e;
  }
}

async function ingestCsv(
  file: File,
  fileId: string,
  uniqueKeyField: string,
  latestDateField: string,
  onProgress: (p: IngestProgress) => void
) {
  onProgress({ phase: "reading", percent: 0, detail: `Starting CSV: ${file.name}` });

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
      dynamicTyping: false,
      chunkSize: 1024 * 1024, // 1MB
      chunk: async (results, parser) => {
        try {
          chunkCount += 1;

          for (const row of results.data) {
            rowsSeen += 1;

            const keyVal = toSafeString(row[uniqueKeyField]);
            if (!keyVal) continue;

            const dtEpoch = parseDateToEpoch(row[latestDateField]);
            const incomingEpoch = Number.isNaN(dtEpoch) ? -1 : dtEpoch;

            const existing = await tx.objectStore("records").get(keyVal);
            if (!existing) {
              await tx.objectStore("records").put({
                key: keyVal,
                lastUpdatedEpoch: incomingEpoch,
                payload: row,
                sourceFileId: fileId,
              });
              rowsUpserted += 1;
            } else if (incomingEpoch >= existing.lastUpdatedEpoch) {
              await tx.objectStore("records").put({
                key: keyVal,
                lastUpdatedEpoch: incomingEpoch,
                payload: row,
                sourceFileId: fileId,
              });
              rowsUpserted += 1;
            }
          }

          // Progress that always moves (even if we can’t know % of file perfectly)
          const pseudo = Math.min(99, 5 + Math.floor(chunkCount / 2));
          onProgress({
            phase: "parsing",
            percent: pseudo,
            detail: `Parsing CSV… rows: ${rowsSeen.toLocaleString()}`,
          });

          // Yield to UI
          if (chunkCount % 3 === 0) await new Promise((r) => setTimeout(r, 0));
        } catch (err) {
          parser.abort();
          reject(err);
        }
      },
      complete: async () => resolve(),
      error: (err) => reject(err),
    });
  });

  await tx.objectStore("files").put({
    ...(await tx.objectStore("files").get(fileId)),
    id: fileId,
    rowsSeen,
    rowsUpserted,
    status: "ready",
  });

  await tx.done;

  const totalRecordsAfter = await countRecords();
  onProgress({ phase: "done", percent: 100, detail: `Done. Total deduped records: ${totalRecordsAfter.toLocaleString()}` });

  return { fileId, rowsSeen, rowsUpserted, totalRecordsAfter };
}

async function ingestXlsx(
  file: File,
  fileId: string,
  uniqueKeyField: string,
  latestDateField: string,
  onProgress: (p: IngestProgress) => void
) {
  onProgress({ phase: "reading", percent: 0, detail: `Reading XLSX: ${file.name}` });

  const buf = await readFileWithProgress(file, (percent) => {
    onProgress({ phase: "reading", percent: Math.min(95, percent), detail: `Reading XLSX… ${percent}%` });
  });

  onProgress({ phase: "parsing", percent: 95, detail: "Parsing workbook…" });

  const workbook = XLSX.read(buf, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<RowRecord>(sheet, { defval: "" });

  const db = await getDB();
  const tx = db.transaction(["records", "files"], "readwrite");

  let rowsSeen = 0;
  let rowsUpserted = 0;

  for (let i = 0; i < rows.length; i++) {
    rowsSeen += 1;
    const row = rows[i];

    const keyVal = toSafeString(row[uniqueKeyField]);
    if (!keyVal) continue;

    const dtEpoch = parseDateToEpoch(row[latestDateField]);
    const incomingEpoch = Number.isNaN(dtEpoch) ? -1 : dtEpoch;

    const existing = await tx.objectStore("records").get(keyVal);
    if (!existing) {
      await tx.objectStore("records").put({ key: keyVal, lastUpdatedEpoch: incomingEpoch, payload: row, sourceFileId: fileId });
      rowsUpserted += 1;
    } else if (incomingEpoch >= existing.lastUpdatedEpoch) {
      await tx.objectStore("records").put({ key: keyVal, lastUpdatedEpoch: incomingEpoch, payload: row, sourceFileId: fileId });
      rowsUpserted += 1;
    }

    if (i % 500 === 0) {
      const pct = 95 + Math.round((i / Math.max(1, rows.length)) * 4);
      onProgress({ phase: "deduping", percent: Math.min(99, pct), detail: `Upserting… ${i.toLocaleString()} / ${rows.length.toLocaleString()}` });
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  await tx.objectStore("files").put({
    ...(await tx.objectStore("files").get(fileId)),
    id: fileId,
    rowsSeen,
    rowsUpserted,
    status: "ready",
  });

  await tx.done;

  const totalRecordsAfter = await countRecords();
  onProgress({ phase: "done", percent: 100, detail: `Done. Total deduped records: ${totalRecordsAfter.toLocaleString()}` });

  return { fileId, rowsSeen, rowsUpserted, totalRecordsAfter };
}

function readFileWithProgress(file: File, onPercent: (p: number) => void): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.onabort = () => reject(new Error("File read aborted."));
    reader.onprogress = (evt) => {
      if (evt.lengthComputable) onPercent(Math.round((evt.loaded / evt.total) * 100));
    };
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  });
}
