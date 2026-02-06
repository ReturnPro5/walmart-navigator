import { useState } from "react";
import { ingestFile, type IngestProgress } from "@/lib/ingest";
import { countRecords } from "@/lib/db";

export default function Upload() {
  const [queue, setQueue] = useState<File[]>([]);
  const [progress, setProgress] = useState<Record<string, IngestProgress>>({});
  const [total, setTotal] = useState(0);

  async function refreshTotal() {
    setTotal(await countRecords());
  }

  async function uploadAll() {
    for (const file of queue) {
      await ingestFile(file, (p) =>
        setProgress((prev) => ({ ...prev, [file.name]: p }))
      );
      await refreshTotal();
    }
    setQueue([]);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Inventory Upload Manager</h1>

      <input
        type="file"
        multiple
        accept=".csv"
        onChange={(e) => setQueue(Array.from(e.target.files ?? []))}
      />

      <button onClick={uploadAll}>Upload Queue</button>
      <button onClick={() => (window.location.href = "/dashboard")}>
        View Dashboard
      </button>

      <div className="text-sm">
        Deduped TRGIDs: <b>{total.toLocaleString()}</b>
      </div>

      {queue.map((f) => {
        const p = progress[f.name];
        return (
          <div key={f.name}>
            {f.name} — {p?.percent ?? 0}%
            {"detail" in (p ?? {}) && <span> ({(p as any).detail})</span>}
          </div>
        );
      })}
    </div>
  );
}
