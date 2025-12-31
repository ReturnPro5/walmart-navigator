import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseUpload } from '@/utils/parseUpload';
import { useWalmartData } from '@/context/WalmartDataContext';

export function UploadPanel() {
  console.log('DASHBOARD UploadPanel rendered');

  const inputRef = useRef<HTMLInputElement>(null);
  const { setRows, lastUpdated } = useWalmartData();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openFileDialog = () => {
    console.log('Upload button clicked');
    inputRef.current?.click();
  };

  const onFileSelected = async (file: File) => {
    console.log('File selected:', file.name);
    try {
      setLoading(true);
      setError(null);

      const rows = await parseUpload(file);
      console.log('Parsed rows:', rows.length);

      setRows(rows);
    } catch (err: any) {
      setError(err?.message || 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium">Upload Listings Snapshot</h3>
          <p className="text-xs text-muted-foreground">
            CSV or Excel • replaces current snapshot
          </p>
        </div>
        <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* REAL FILE INPUT (NOT LABEL-BASED) */}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onFileSelected(file);
            e.target.value = '';
          }
        }}
      />

      {/* BUTTON */}
      <Button
        type="button"
        onClick={openFileDialog}
        disabled={loading}
        className="w-full flex items-center gap-2"
      >
        <Upload className="w-4 h-4" />
        {loading ? 'Processing…' : 'Upload CSV or Excel'}
      </Button>

      {lastUpdated && (
        <p className="text-xs text-muted-foreground mt-2">
          Last updated: {lastUpdated.toLocaleString()}
        </p>
      )}

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive mt-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
