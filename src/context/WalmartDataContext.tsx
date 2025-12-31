import { createContext, useContext, useState, ReactNode } from 'react';

export type WalmartRow = Record<string, any>;

interface WalmartDataContextType {
  rows: WalmartRow[];
  setRows: (rows: WalmartRow[]) => void;
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

  return (
    <WalmartDataContext.Provider
      value={{
        rows,
        setRows: handleSetRows,
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
