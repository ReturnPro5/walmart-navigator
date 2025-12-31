import { createContext, useContext, useState, ReactNode } from 'react';

export type WalmartRow = Record<string, any>;

export interface UploadedFile {
  id: string;
  name: string;
  rows: WalmartRow[];
  uploadedAt: Date;
}

interface WalmartDataContextType {
  files: UploadedFile[];
  rows: WalmartRow[];
  addFile: (file: UploadedFile) => void;
  removeFile: (id: string) => void;
}

const WalmartDataContext = createContext<WalmartDataContextType | undefined>(undefined);

export function WalmartDataProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [rows, setRows] = useState<WalmartRow[]>([]);

  const rebuildRows = (fileList: UploadedFile[]) => {
    const map = new Map<string, WalmartRow>();

    // later files override earlier ones
    fileList.forEach(file => {
      file.rows.forEach(row => {
        const key = row.TRGID;
        if (key) {
          map.set(key, row);
        }
      });
    });

    setRows(Array.from(map.values()));
  };

  const addFile = (file: UploadedFile) => {
    setFiles(prev => {
      const updated = [...prev, file];
      rebuildRows(updated);
      return updated;
    });
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      rebuildRows(updated);
      return updated;
    });
  };

  return (
    <WalmartDataContext.Provider
      value={{ files, rows, addFile, removeFile }}
    >
      {children}
    </WalmartDataContext.Provider>
  );
}

export function useWalmartData() {
  const ctx = useContext(WalmartDataContext);
  if (!ctx) {
    throw new Error('useWalmartData must be used within WalmartDataProvider');
  }
  return ctx;
}
