// src/components/dashboard/DashboardLayout.tsx
import { useEffect, useMemo, useState } from "react";
import { countRecords, getSampleRecords, listFiles, renameFile, deleteFileAndRecords, type FileMeta } from "@/lib/db";
import { UploadPanel } from "./UploadPanel";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Row = { key: string; sourceFileId: string; payload: Record<string, unknown> };

export default function DashboardLayout() {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [renameDraft, setRenameDraft] = useState<Record<string, string>>({});

  async function refresh() {
    setLoading(true);
    const [f, t, sample] = await Promise.all([listFiles(), countRecords(), getSampleRecords(300)]);
    setFiles(f);
    setTotal(t);
    setRows(sample as any);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const readyCount = useMemo(() => files.filter((x) => x.status === "ready").length, [files]);

  return (
    <div className="mx-auto w-full max-w-6xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Walmart Navigator</h1>
          <p className="text-sm text-muted-foreground">
            Upload CSVs → stored in your browser (IndexedDB) → deduped by <span className="font-mono">TRGID</span>.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={refresh}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Inventory CSVs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <UploadPanel />
          <div className="text-sm text-muted-foreground">
            Files stored: <b>{files.length}</b> (ready: <b>{readyCount}</b>) • Total deduped TRGIDs:{" "}
            <b>{total.toLocaleString()}</b>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stored Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {files.length === 0 ? (
            <div className="text-sm text-muted-foreground">No files stored yet.</div>
          ) : (
            files.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 flex-wrap border rounded-md p-3">
                <div className="min-w-[260px]">
                  <div className="font-medium">{f.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    status: <b>{f.status}</b> • rows upserted: <b>{f.rowsUpserted.toLocaleString()}</b> • size:{" "}
                    <b>{Math.round(f.size / (1024 * 1024))}MB</b>
                  </div>
                  {f.status === "error" && f.errorDetail ? (
                    <div className="text-xs text-red-600 mt-1">Error: {f.errorDetail}</div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    className="w-[260px]"
                    placeholder="Rename display name…"
                    value={renameDraft[f.id] ?? f.displayName}
                    onChange={(e) => setRenameDraft((s) => ({ ...s, [f.id]: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const name = (renameDraft[f.id] ?? f.displayName).trim();
                      if (!name) return;
                      await renameFile(f.id, name);
                      await refresh();
                    }}
                  >
                    Save name
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      await deleteFileAndRecords(f.id);
                      await refresh();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview (first 300 deduped TRGIDs)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No records yet.</div>
          ) : (
            <div className="overflow-auto border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="p-2">TRGID</th>
                    <th className="p-2">Source File</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className="border-t">
                      <td className="p-2 font-mono">{r.key}</td>
                      <td className="p-2 font-mono text-xs">{r.sourceFileId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
