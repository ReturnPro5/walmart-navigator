import { useState, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { FilterBar, type FilterState } from './FilterBar';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
   * Snapshot-safe, listings-only filtering
   */
  const filteredRows = useMemo(() => {
    let data: WalmartListingRow[] = rows;

    if (filters.facility) {
      data = data.filter(r =>
        r.ProgramName?.toLowerCase().includes(filters.facility.toLowerCase())
      );
    }

    if (filters.category) {
      data = data.filter(r => r.CategoryName === filters.category);
    }

    if (filters.program) {
      data = data.filter(r => r.ProgramName === filters.program);
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

    // Fiscal week filtering will be added once date logic is finalized
    // Leaving hook here intentionally

    return data;
  }, [rows, filters]);

  /**
   * TAB RENDERING
   * Each tab receives the SAME filtered snapshot
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
      
      <main
        className={cn(
          "transition-all duration-300",
          "ml-64" // Sidebar width
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="px-6 py-4">
            <FilterBar filters={filters} onFilterChange={setFilters} />
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-border text-center text-xs text-muted-foreground">
          <p>Walmart US Operations Dashboard • Data refreshed every 15 minutes</p>
          <p className="mt-1">
            For questions, contact Operations Analytics Team
          </p>
        </footer>
      </main>
    </div>
  );
}
