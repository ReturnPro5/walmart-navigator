import { useState } from 'react';

import { Sidebar } from './Sidebar';
import { FilterBar, type FilterState } from './FilterBar';
import { UploadPanel } from './UploadPanel';

import { ExecutiveSnapshot } from './tabs/ExecutiveSnapshot';
import { InventoryFunnel } from './tabs/InventoryFunnel';
import { ListingHealth } from './tabs/ListingHealth';
import { AgingRisk } from './tabs/AgingRisk';
import { SalesPerformance } from './tabs/SalesPerformance';
import { SKUDeepDive } from './tabs/SKUDeepDive';

import { useWalmartData } from '@/context/WalmartDataContext';
import { cn } from '@/lib/utils';

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

  const renderContent = () => {
    switch (activeTab) {
      case 'executive':
        return <ExecutiveSnapshot rows={rows} />;

      case 'funnel':
        return <InventoryFunnel rows={rows} />;

      case 'health':
        return <ListingHealth rows={rows} />;

      case 'aging':
        return <AgingRisk rows={rows} />;

      case 'performance':
        return <SalesPerformance rows={rows} />;

      case 'sku':
        return <SKUDeepDive rows={rows} />;

      default:
        return <ExecutiveSnapshot rows={rows} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main
        className={cn(
          'transition-all duration-300',
          'ml-64' // Sidebar width
        )}
      >
        {/* Top Header / Filters */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="px-6 py-4 space-y-4">
            {/* Upload Section */}
            <UploadPanel />

            {/* Filters */}
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
            />
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t border-border text-center text-xs text-muted-foreground">
          <p>Walmart US Listings Dashboard • Snapshot-based analytics</p>
          <p className="mt-1">
            Upload a new file at any time to refresh the dashboard
          </p>
        </footer>
      </main>
    </div>
  );
}
