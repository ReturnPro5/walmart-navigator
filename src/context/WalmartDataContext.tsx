import { createContext, useContext, useState, ReactNode } from 'react';
import * as XLSX from 'xlsx';

export type WalmartRow = Record<string, any>;

interface WalmartDataContextType {
  rows: WalmartRow[];
  setRows: (rows: WalmartRow[]) => void;
  loadFile: (file: File) => Promise<void>;
  lastUpdated: Date | null;
}

const WalmartDataContext = createContext<WalmartDataContextType | undefined>(undefined);

export function WalmartDataProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<WalmartRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleSetRows = (newRows: WalmartRow[]) => {
    setRows(newRows);
    setLastUpdated(new Date());
  };

  /**
   * LOAD CSV OR EXCEL SNAPSHOT
   * Replaces existing data completely
   */
  const loadFile = async (file: File): Promise<void> => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension) {
      throw new Error('Invalid file');
    }

    if (extension === 'csv') {
      const text = await file.text();
      const [headerLine, ...lines] = text.split(/\r?\n/);

      const headers = headerLine.split(',').map(h => h.trim());

      const parsedRows: WalmartRow[] = lines
        .filter(Boolean)
        .map(line => {
          const values = line.split(',');
          const row: WalmartRow = {};
          headers.forEach((h, i) => {
            row[h] = values[i]?.trim() ?? null;
          });
          return row;
        });

      handleSetRows(parsedRows);
      return;
    }

    if (extension === 'xlsx' || extension === 'xls') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      // FIRST SHEET ONLY (snapshot logic)
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const parsedRows = XLSX.utils.sheet_to_json<WalmartRow>(worksheet, {
        defval: null,
      });

      handleSetRows(parsedRows);
      return;
    }

    throw new Error('Unsupported file type');
  };

  return (
    <WalmartDataContext.Provider
      value={{
        rows,
        setRows: handleSetRows,
        loadFile,
        lastUpdated,
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
