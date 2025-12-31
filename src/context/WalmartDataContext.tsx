import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type WalmartRow = Record<string, any>;

export interface UploadedFile {
  id: string;
  name: string;
  rows: WalmartRow[];
  uploadedAt: string; // stored as ISO string
}

interface WalmartDataContextType {
  files: UploadedFile[];
  rows: WalmartRow[];
  addFile: (file: UploadedFile) => void;
  removeFile: (id: string) => void;
}

const STORAGE_KEY = 'walmart_uploaded_files';

const WalmartDataContext = createContext<WalmartDataContextType | undefined>(
  undefined
);

export function WalmartDataProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [rows, setRows] = useState<WalmartRow[]>([]);

  /* -------------------------------
     REBUILD ROWS WITH DEDUPE
  -------------------------------- */
  const rebuildRows = (fileList: UploadedFile[]) => {
    const map = new Map<string, WalmartRow>();

    fileList.forEach(file => {
      file.rows.forEach(row => {
        const key = row.TRGID;
        if (key) {
          map.set(key, row); // later files override earlier
        }
      });
    });

    setRows(Array.from(map.values()));
  };

  /* -------------------------------
     LOAD FROM LOCALSTORAGE (ONCE)
  -------------------------------- */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: UploadedFile[] = JSON.parse(stored);
      setFiles(parsed);
      rebuildRows(parsed);
    }
  }, []);

  /* -------------------------------
     SAVE TO LOCALSTORAGE
  -------------------------------- */
  const persist = (fileList: UploadedFile[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fileList));
  };

  /* -------------------------------
     ADD FILE
  -------------------------------- */
  const addFile = (file: UploadedFile) => {
    setFiles(prev => {
      const updated = [...prev, file];
      persist(updated);
      rebuildRows(updated);
      return updated;
    });
  };

  /* -------------------------------
     REMOVE FILE
  -------------------------------- */
  const removeFile = (id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      persist(updated);
      rebuildRows(updated);
      return updated;
    });
  };

  return (
    <WalmartDataContext.Provider
      value={{
        files,
        rows,
        addFile,
        removeFile,
      }}
    >
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
