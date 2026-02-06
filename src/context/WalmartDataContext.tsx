import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { listFiles, deleteFileAndRecords, getSampleRecords, type FileMeta } from '@/lib/db';

export type WalmartRow = Record<string, any>;

export interface UploadedFile {
  id: string;
  name: string;
  rows: WalmartRow[];
  uploadedAt: string;
}

interface WalmartDataContextType {
  files: UploadedFile[];
  rows: WalmartRow[];
  removeFile: (id: string) => Promise<void>;
}

const WalmartDataContext = createContext<WalmartDataContextType | undefined>(undefined);

export function WalmartDataProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [rows, setRows] = useState<WalmartRow[]>([]);

  async function refresh() {
    const stored = await listFiles();
    setFiles(stored.map(f => ({ id: f.id, name: f.displayName, rows: [], uploadedAt: String(f.uploadedAt) })));
    const records = await getSampleRecords(1000);
    setRows(records.map(r => r.payload as WalmartRow));
  }

  useEffect(() => { refresh(); }, []);

  const removeFile = async (id: string) => {
    await deleteFileAndRecords(id);
    await refresh();
  };

  return (
    <WalmartDataContext.Provider value={{ files, rows, removeFile }}>
      {children}
    </WalmartDataContext.Provider>
  );
}

export function useWalmartData() {
  const context = useContext(WalmartDataContext);
  if (!context) {
    throw new Error('useWalmartData must be used within WalmartDataProvider');
  }
  return context;
}
