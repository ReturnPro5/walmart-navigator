import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Trash2, Edit3, Check, X } from 'lucide-react';
import { useWalmartData } from '@/context/WalmartDataContext';

export function UploadPanel() {
  const { files, addFile, removeFile } = useWalmartData();

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  const handleUpload = async (file: File) => {
    setLoading(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let rows: any[] = [];

      if (ext === 'csv') {
        const text = await file.text();
        const [header, ...lines] = text.split('\n');
        const keys = header.split(',').map(h => h.trim());

        rows = lines
          .filter(Boolean)
          .map(line =>
            Object.fromEntries(
              keys.map((k, i) => [k, line.split(',')[i]])
            )
          );
      }

      if (ext === 'xlsx' || ext === 'xls') {
        if (file.size > 15 * 1024 * 1024) {
          throw new Error('Excel file too large — convert to CSV');
        }

        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
      }

      addFile({
        id: crypto.randomUUID(),
        name: file.name,
        rows,
        uploadedAt: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-card space-y-4">
      {/* Upload */}
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <Upload className="w-4 h-4" />
        <span>{loading ? 'Uploading…' : 'Upload File'}</span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          disabled={loading}
          onChange={e => e.target.files && handleUpload(e.target.files[0])}
        />
      </label>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-center justify-between text-sm border rounded px-3 py-2"
            >
              {editingId === file.id ? (
                <input
                  className="border px-1 text-sm"
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                />
              ) : (
                <span>{file.name}</span>
              )}

              <div className="flex gap-2">
                {editingId === file.id ? (
                  <>
                    <button
                      onClick={() => {
                        file.name = tempName;
                        setEditingId(null);
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(file.id);
                        setTempName(file.name);
                      }}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeFile(file.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
