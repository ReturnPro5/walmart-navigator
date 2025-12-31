import { useRef, useState } from 'react';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWalmartData } from '@/context/WalmartDataContext';

export function UploadPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { loadFile } = useWalmartData(); // <-- REQUIRED in context
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFile = async (file: File) => {
    setIsLoading(true);
    setProgress(0);
    setError(null);
    setSuccess(false);
    setFileName(file.name);

    try {
      // Fake progress while parsing (client-side files load instantly otherwise)
      const interval = setInterval(() => {
        setProgress(p => (p < 90 ? p + 10 : p));
      }, 200);

      await loadFile(file); // <-- actual ingestion

      clearInterval(interval);
      setProgress(100);
      setSuccess(true);
    } catch (e) {
      setError('Failed to load file. Please check format.');
      setProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-card border border-dashed border-border p-4">
      <div className="flex items-center gap-4">
        {/* Hidden Input */}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {/* Button */}
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            isLoading && 'opacity-70 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isLoading ? 'Uploading…' : 'Upload Snapshot'}
        </button>

        {/* Status */}
        <div className="flex-1 text-sm">
          {fileName && (
            <div className="text-muted-foreground">
              {fileName}
            </div>
          )}

          {isLoading && (
            <div className="mt-1">
              <div className="h-2 bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {progress}% loaded
              </div>
            </div>
          )}

          {success && !isLoading && (
            <div className="flex items-center gap-1 text-green-600 mt-1">
              <CheckCircle className="w-4 h-4" />
              Upload complete
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1 text-red-600 mt-1">
              <XCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
