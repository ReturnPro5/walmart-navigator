import { useEffect, useState } from "react";
import { countRecords, getSampleRecords } from "@/lib/db";

export default function Dashboard() {
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      setTotal(await countRecords());
      setRows(await getSampleRecords(500));
    })();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Inventory Dashboard</h1>

      <div>Total deduped TRGIDs: {total.toLocaleString()}</div>

      <div className="border rounded overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th>TRGID</th>
              <th>Source File</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>{r.key}</td>
                <td>{r.sourceFileId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
