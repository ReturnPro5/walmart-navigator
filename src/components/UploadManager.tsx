// src/components/UploadManager.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { deleteFileAndItsRecords, exportDedupedCSV, getFiles, renameFile, reorderFile, type FileMeta, countRecords } from "../lib/db";
import { ingestFile, type IngestProgress } from "../lib/ingest";

type QueueItem = {
  file: File;
  fileIdGuess: string;
  progress: IngestProgress;
};

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${Math.round(v * 10) / 10} ${units[i]}`;
}

export default function UploadManager() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<FileMeta[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [totalDeduped, setTotalDeduped] = useState<number>(0);

  const hasQueue = queue.length > 0;

  async function refresh() {
    const f = await getFiles();
    setFiles(f);
    setTotalDeduped(await countRecords());
  }

  useEffect(() => {
    refresh();
  }, []);

  const queuedSize = useMemo(
    () => queue.reduce((sum, q) => sum + q.file.size, 0),
    [queue]
  );

  function addToQueue(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const items: QueueItem[] = [];
    for (const f of Array.from(fileList)) {
      const lower = f.name.toLowerCase();
      if (!lower.endsWith(".csv")) continue;
      items.push({
        file: f,
        fileIdGuess: `${f.name}__${f.size}__${f.lastModified}`,
        progress: { phase: "idle", percent: 0 },
      });
    }

    if (items.length === 0) return;

    setQueue((prev) => [...prev, ...items]);
  }

  async function startUploadAll() {
    if (busy) return;
    if (queue.length === 0) return;

    setBusy(true);
    try {
      // sequential upload avoids memory blowups
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];

        setQueue((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, progress: { phase: "reading", percent: 1 } } : p
          )
        );

        await ingestFile(item.file, (p) => {
          setQueue((prev) =>
            prev.map((q, idx) => (idx === i ? { ...q, progress: p } : q))
          );
        });

        // after each file, refresh metadata + dedup count
        await refresh();
      }

      // clear successful queue
      setQueue([]);
    } finally {
      setBusy(false);
    }
  }

  function clearQueue() {
    if (busy) return;
    setQueue([]);
  }

  async function handleDelete(fileId: string) {
    if (busy) return;
    await deleteFileAndItsRecords(fileId);
    await refresh();
  }

  async function handleRename(fileId: string, newName: string) {
    await renameFile(fileId, newName);
    await refresh();
  }

  async function handleReorder(fileId: string, dir: "up" | "down") {
    await reorderFile(fileId, dir);
    await refresh();
  }

  async function handleExport() {
    // You can raise maxRows if you want, but exporting 1M+ rows can be huge.
    await exportDedupedCSV("deduped_inventory.csv", 600_000);
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
        Inventory Upload Manager
      </h1>

      <p style={{ marginBottom: 16, opacity: 0.8 }}>
        Upload multiple CSVs (250–300k rows each). Records are stored in the browser
        (IndexedDB) and persist across refresh. Dedup key: <b>TRGID</b> (last write wins).
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv,text/csv"
          onChange={(e) => addToQueue(e.target.files)}
        />

        <button
          onClick={startUploadAll}
          disabled={!hasQueue || busy}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: busy ? "#eee" : "#fff",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Uploading..." : "Upload Queue"}
        </button>

        <button
          onClick={clearQueue}
          disabled={!hasQueue || busy}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: busy ? "#eee" : "#fff",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          Clear Queue
        </button>

        <button
          onClick={handleExport}
          disabled={busy || totalDeduped === 0}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: busy ? "#eee" : "#fff",
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          Export Deduped CSV
        </button>

        <div style={{ marginLeft: "auto", fontWeight: 600 }}>
          Deduped TRGIDs: {totalDeduped.toLocaleString()}
        </div>
      </div>

      {hasQueue && (
        <div style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            Upload Queue ({queue.length} files, {formatBytes(queuedSize)})
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {queue.map((q, idx) => (
              <div
                key={`${q.fileIdGuess}-${idx}`}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 700 }}>
                    {q.file.name}{" "}
                    <span style={{ fontWeight: 400, opacity: 0.75 }}>
                      ({formatBytes(q.file.size)})
                    </span>
                  </div>
                  <div style={{ opacity: 0.8 }}>
                    {q.progress.phase} • {q.progress.percent}%
                  </div>
                </div>

                <div style={{ height: 10, background: "#eee", borderRadius: 999, overflow: "hidden", marginTop: 10 }}>
                  <div style={{ height: "100%", width: `${q.progress.percent}%`, background: "#111" }} />
                </div>

                {q.progress.detail && (
                  <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                    {q.progress.detail}
                  </div>
                )}

                {q.progress.phase === "error" && (
                  <div style={{ marginTop: 8, fontSize: 13, color: "crimson" }}>
                    {q.progress.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          Stored Files (persists across refresh)
        </h2>

        {files.length === 0 ? (
          <div style={{ opacity: 0.75 }}>No files stored yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {files.map((f) => (
              <div
                key={f.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 260 }}>
                    <div style={{ fontWeight: 700 }}>{f.displayName}</div>
                    <div style={{ fontSize: 13, opacity: 0.75 }}>
                      {formatBytes(f.size)} • rows seen {f.rowsSeen.toLocaleString()} • upserts{" "}
                      {f.rowsUpserted.toLocaleString()} • status <b>{f.status}</b>
                      {f.status === "error" && f.errorMessage ? (
                        <span style={{ color: "crimson" }}> • {f.errorMessage}</span>
                      ) : null}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      onClick={() => handleReorder(f.id, "up")}
                      disabled={busy}
                      style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ccc" }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleReorder(f.id, "down")}
                      disabled={busy}
                      style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ccc" }}
                    >
                      ↓
                    </button>
                  </div>

                  <RenameInline
                    value={f.displayName}
                    disabled={busy}
                    onSave={(v) => handleRename(f.id, v)}
                  />

                  <button
                    onClick={() => handleDelete(f.id)}
                    disabled={busy}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #ccc",
                      background: "#fff",
                      color: "crimson",
                      marginLeft: "auto",
                    }}
                  >
                    Delete (and remove its TRGs)
                  </button>
                </div>

                <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
                  Priority order: <b>{f.order}</b> (reorder changes which file you’d delete first, etc.)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RenameInline(props: {
  value: string;
  disabled?: boolean;
  onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(props.value);

  useEffect(() => setVal(props.value), [props.value]);

  if (!editing) {
    return (
      <button
        disabled={props.disabled}
        onClick={() => setEditing(true)}
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid #ccc",
          background: "#fff",
        }}
      >
        Rename
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid #ccc",
          minWidth: 220,
        }}
      />
      <button
        disabled={props.disabled}
        onClick={() => {
          props.onSave(val);
          setEditing(false);
        }}
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid #ccc",
          background: "#fff",
        }}
      >
        Save
      </button>
      <button
        disabled={props.disabled}
        onClick={() => {
          setVal(props.value);
          setEditing(false);
        }}
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: "1px solid #ccc",
          background: "#fff",
        }}
      >
        Cancel
      </button>
    </div>
  );
}
