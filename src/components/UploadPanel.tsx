import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseUpload } from '@/utils/parseUpload';
import { useWalmartData } from '@/context/WalmartDataContext';

export function UploadPanel() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { setRows, lastUpdated } = useWalmartData();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    fileRef.current?.click();
  };

  const handleFile = async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      const rows = await parseUpload(file);
      setRows(rows);
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium">Upload Listings Snapshot</h3>
          <p className="text-xs text-muted-foreground">
            CSV or Excel • snapshot replaces existing data
          </p>
        </div>
        <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Hidden input */}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
            e.target.value = ''; // allow re-upload same file
          }
        }}
      />

      {/* Visible button */}
      <Button
        onClick={handleClick}
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
        <div className="flex items-center gap-2 text-xs text-destructive mt-3">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
