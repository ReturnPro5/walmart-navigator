import { createContext, useContext, useState } from 'react';
import { WalmartListingRow } from '@/types/walmart';

interface WalmartDataContextValue {
  rows: WalmartListingRow[];
  setRows: (rows: WalmartListingRow[]) => void;
}

const WalmartDataContext = createContext<WalmartDataContextValue | undefined>(undefined);

export function WalmartDataProvider({ children }: { children: React.ReactNode }) {
  const [rows, setRows] = useState<WalmartListingRow[]>([]);

  return (
    <WalmartDataContext.Provider value={{ rows, setRows }}>
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
