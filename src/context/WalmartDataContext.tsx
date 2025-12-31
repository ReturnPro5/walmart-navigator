import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { saveFileToDB, deleteFileFromDB, getAllFilesFromDB } from '@/lib/db';

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
  addFile: (file: UploadedFile) => Promise<void>;
  removeFile: (id: string) => Promise<void>;
}

const WalmartDataContext = createContext<WalmartDataContextType | undefined>(undefined);

export function WalmartDataProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [rows, setRows] = useState<WalmartRow[]>([]);

  const rebuildRows = (fileList: UploadedFile[]) => {
    const map = new Map<string, WalmartRow>();
    fileList.forEach(file =>
      file.rows.forEach(row => {
        if (row.TRGID) map.set(row.TRGID, row);
      })
    );
    setRows(Array.from(map.values()));
  };

  // LOAD FROM INDEXEDDB
  useEffect(() => {
    getAllFilesFromDB().then((stored) => {
      setFiles(stored);
      rebuildRows(stored);
    });
  }, []);

  const addFile = async (file: UploadedFile) => {
    await saveFileToDB(file);
    const updated = [...files, file];
    setFiles(updated);
    rebuildRows(updated);
  };

  const removeFile = async (id: string) => {
    await deleteFileFromDB(id);
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    rebuildRows(updated);
  };

  return (
    <WalmartDataContext.Provider value={{ files, rows, addFile, removeFile }}>
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
