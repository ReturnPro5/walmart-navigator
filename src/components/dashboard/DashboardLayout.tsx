import { useState, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { FilterBar, type FilterState } from './FilterBar';
import { UploadPanel } from './UploadPanel';

import { ExecutiveSnapshot } from './tabs/ExecutiveSnapshot';
import { InventoryFunnel } from './tabs/InventoryFunnel';
import { ListingHealth } from './tabs/ListingHealth';
import { AgingRisk } from './tabs/AgingRisk';
import { SalesPerformance } from './tabs/SalesPerformance';
import { SKUDeepDive } from './tabs/SKUDeepDive';

import { cn } from '@/lib/utils';
import { useWalmartData } from '@/context/WalmartDataContext';
import { WalmartListingRow } from '@/types/walmart';

export function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('executive');

  const [filters, setFilters] = useState<FilterState>({
    fiscalWeeks: [],
    facility: '',
    category: '',
    condition: '',
    program: '',
    listingStatus: '',
  });

  const { rows } = useWalmartData();

  /**
   * APPLY FILTERS
   * Listings snapshot only (no duplicates, no sales logic)
   */
  const filteredRows = useMemo(() => {
    let data: WalmartListingRow[] = rows;

    if (filters.facility) {
      data = data.filter(r =>
        r.Tag_Facility?.toLowerCase().includes(filters.facility.toLowerCase())
      );
    }

    if (filters.category) {
      data = data.filter(r => r.CategoryName === filters.category);
    }

    if (filters.program) {
      data = data.filter(r => r.ProgramName === filters.program);
    }

    if (filters.condition) {
      data = data.filter(r => r.Tag_FinalCondition === filters.condition);
    }

    if (filters.listingStatus) {
      switch (filters.listingStatus) {
        case 'Live':
          data = data.filter(r => r.AvailableForSale && !r.LocationNotListable);
          break;
        case 'Blocked':
          data = data.filter(r => r.LocationNotListable);
          break;
        case 'Ops Complete':
          data = data.filter(r => r.OpsComplete && !r.AvailableForSale);
          break;
        case 'Processing':
          data = data.filter(r => !r.OpsComplete);
          break;
      }
    }

    return data;
  }, [rows, filters]);

  /**
   * TAB ROUTING
   * Every tab receives the SAME filtered snapshot
   */
  const renderContent = () => {
    switch (activeTab) {
      case 'executive':
        return <ExecutiveSnapshot rows={filteredRows} />;
      case 'funnel':
        return <InventoryFunnel rows={filteredRows} />;
      case 'health':
        return <ListingHealth rows={filteredRows} />;
      case 'aging':
        return <AgingRisk rows={filteredRows} />;
      case 'performance':
        return <SalesPerformance rows={filteredRows} />;
      case 'sku':
        return <SKUDeepDive rows={filteredRows} />;
      default:
        return <ExecutiveSnapshot rows={filteredRows} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className={cn('ml-64 transition-all duration-300')}>
        {/* HEADER */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-6 py-4 space-y-4">
            {/* UPLOAD SNAPSHOT */}
            <UploadPanel />

            {/* FILTERS */}
            <FilterBar filters={filters} onFilterChange={setFilters} />
          </div>
        </header>

        {/* CONTENT */}
        <div className="p-6">
          {renderContent()}
        </div>

        {/* FOOTER */}
        <footer className="px-6 py-4 border-t border-border text-center text-xs text-muted-foreground">
          <p>Walmart US Listings Dashboard • Snapshot-based</p>
          <p className="mt-1">
            Upload replaces data • No duplicates • TRG-level granularity
          </p>
        </footer>
      </main>
    </div>
  );
}
