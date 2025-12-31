import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { useWalmartData } from '@/context/WalmartDataContext';

export function UploadPanel() {
  const { setRows } = useWalmartData();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 🚨 HARD SAFETY LIMIT
      if (file.size > 15 * 1024 * 1024) {
        throw new Error('File too large. Use CSV or split Excel.');
      }

      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'csv') {
        const text = await file.text();
        const [header, ...lines] = text.split('\n');

        const keys = header.split(',').map(h => h.trim());
        const rows = lines
          .filter(Boolean)
          .map(line => {
            const values = line.split(',');
            return Object.fromEntries(
              keys.map((k, i) => [k, values[i]])
            );
          });

        setRows(rows);
      }

      else if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: null });
        setRows(json as any[]);
      }

      else {
        throw new Error('Unsupported file type');
      }

      setSuccess(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card">
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <Upload className="w-4 h-4" />
        <span>{loading ? 'Loading…' : 'Upload Snapshot'}</span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          disabled={loading}
          onChange={e => e.target.files && handleFile(e.target.files[0])}
        />
      </label>

      {error && (
        <div className="text-destructive text-sm mt-2 flex gap-1">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {success && !loading && (
        <div className="text-green-600 text-sm mt-2 flex gap-1">
          <CheckCircle className="w-4 h-4" /> Loaded successfully
        </div>
      )}
    </div>
  );
}
