import { useEffect, useState } from "react";
import { getAllRecords, getStats } from "@/lib/db";

export default function Dashboard() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const stats = await getStats();
      const data = await getAllRecords(500); // sample
      setTotal(stats.total);
      setRows(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-6">Loading inventory…</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Inventory Dashboard</h1>

      <div className="text-sm text-muted-foreground">
        Total deduped TRGIDs:{" "}
        <span className="font-semibold">{total.toLocaleString()}</span>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 text-left">TRGID</th>
              <th className="px-3 py-2 text-left">Source File</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t">
                <td className="px-3 py-1 font-mono">{r.key}</td>
                <td className="px-3 py-1 text-muted-foreground">
                  {r.sourceFileId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted-foreground">
        Showing first 500 records (sample)
      </div>
    </div>
  );
}
