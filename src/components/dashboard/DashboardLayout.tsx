import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { FilterBar, type FilterState } from './FilterBar';
import { ExecutiveSnapshot } from './tabs/ExecutiveSnapshot';
import { InventoryFunnel } from './tabs/InventoryFunnel';
import { ListingHealth } from './tabs/ListingHealth';
import { AgingRisk } from './tabs/AgingRisk';
import { SalesPerformance } from './tabs/SalesPerformance';
import { SKUDeepDive } from './tabs/SKUDeepDive';
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
      
      <main className={cn(
        "transition-all duration-300",
        "ml-64" // Sidebar width
      )}>
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
