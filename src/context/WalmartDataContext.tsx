import { createContext, useContext, useState } from 'react';
import { WalmartListingRow } from '@/types/walmart';

interface WalmartDataContextType {
  rows: WalmartListingRow[];
  setRows: (rows: WalmartListingRow[]) => void;
  lastUpdated?: Date;
}

const WalmartDataContext = createContext<WalmartDataContextType | null>(null);

export function WalmartDataProvider({ children }: { children: React.ReactNode }) {
  const [rows, setRows] = useState<WalmartListingRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();

  const updateRows = (data: WalmartListingRow[]) => {
    setRows(data);
    setLastUpdated(new Date());
  };

  return (
    <WalmartDataContext.Provider value={{ rows, setRows: updateRows, lastUpdated }}>
      {children}
    </WalmartDataContext.Provider>
  );
}

export function useWalmartData() {
  const ctx = useContext(WalmartDataContext);
  if (!ctx) throw new Error('useWalmartData must be used inside provider');
  return ctx;
}
