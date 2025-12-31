import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useWalmartData } from '@/context/WalmartDataContext';

export function UploadPanel() {
  const { setRows, lastUpdated } = useWalmartData();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rowCount, setRowCount] = useState<number | null>(null);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setProgress(10);

    const buffer = await file.arrayBuffer();
    setProgress(30);

    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    setProgress(50);

    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet);

    setProgress(80);
    setRows(json as any[]);
    setRowCount(json.length);

    setProgress(100);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <label>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          hidden
          onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
        />
        <Button variant="outline" asChild>
          <span className="flex items-center gap-2 cursor-pointer">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload Snapshot
          </span>
        </Button>
      </label>

      {loading && (
        <div className="w-48">
          <Progress value={progress} />
        </div>
      )}

      {rowCount !== null && !loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-green-600" />
          {rowCount.toLocaleString()} rows loaded
        </div>
      )}

      {lastUpdated && (
        <div className="text-xs text-muted-foreground">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}
    </div>
  );
}
