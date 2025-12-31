import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { useWalmartData } from '@/context/WalmartDataContext';
import { cn } from '@/lib/utils';

export function UploadPanel() {
  const { setRows } = useWalmartData();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      const buffer = await file.arrayBuffer();
      setProgress(20);

      const workbook = XLSX.read(buffer, { type: 'array' });
      setProgress(40);

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const json = XLSX.utils.sheet_to_json(sheet, {
        defval: null,
      });

      setProgress(70);

      if (!json.length) {
        throw new Error('No rows found in file');
      }

      // 🔑 THIS IS THE MOST IMPORTANT LINE
      setRows(json as any[]);

      setProgress(100);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setError('Only CSV or Excel files are supported');
      return;
    }

    handleFileUpload(file);
  };

  return (
    <div className="dashboard-card">
      <div className="flex items-center gap-4">
        <label
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-md border cursor-pointer',
            loading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-muted'
          )}
        >
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">
            {loading ? 'Uploading…' : 'Upload Snapshot'}
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={onFileChange}
            disabled={loading}
            className="hidden"
          />
        </label>

        {loading && (
          <div className="flex-1">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {progress}% processed
            </div>
          </div>
        )}

        {success && !loading && (
          <div className="flex items-center gap-1 text-status-live text-sm">
            <CheckCircle className="w-4 h-4" />
            Loaded
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-1 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
