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
import { cn } from '@/lib/utils';

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

  const renderContent = () => {
    switch (activeTab) {
      case 'executive':
        return <ExecutiveSnapshot />;
      case 'funnel':
        return <InventoryFunnel />;
      case 'health':
        return <ListingHealth />;
      case 'aging':
        return <AgingRisk />;
      case 'performance':
        return <SalesPerformance />;
      case 'sku':
        return <SKUDeepDive />;
      default:
        return <ExecutiveSnapshot />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className={cn('ml-64 transition-all')}>
        <header className="sticky top-0 z-40 bg-background border-b">
          <div className="px-6 py-4 space-y-4">
            <UploadPanel />
            <FilterBar filters={filters} onFilterChange={setFilters} />
          </div>
        </header>

        <div className="p-6">{renderContent()}</div>
      </main>
    </div>
  );
}
