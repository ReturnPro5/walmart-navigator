import { useState } from 'react';
import { Search, Package, DollarSign, Eye, ShoppingCart, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KPICard } from '../KPICard';
import { LineChart } from '../charts/LineChart';
import { sampleInventoryItems, type InventoryItem } from '@/lib/mockData';
import { cn } from '@/lib/utils';

export function SKUDeepDive() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(sampleInventoryItems[0]);

  const handleSearch = () => {
    const found = sampleInventoryItems.find(
      item => item.upc.includes(searchQuery) || 
              item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (found) {
      setSelectedItem(found);
    }
  };

  // Mock timeline data
  const timelineEvents = selectedItem ? [
    { date: selectedItem.checkInDate, event: 'Checked In', status: 'complete' },
    { date: selectedItem.listedDate || 'Pending', event: 'Listed', status: selectedItem.listedDate ? 'complete' : 'pending' },
    { date: selectedItem.lifecycleStatus === 'Sold' ? '2024-12-28' : 'N/A', event: 'Sold', status: selectedItem.lifecycleStatus === 'Sold' ? 'complete' : 'pending' },
  ] : [];

  // Mock performance data
  const performanceData = [
    { day: 'Day 1', views: 45, sales: 0 },
    { day: 'Day 7', views: 280, sales: 2 },
    { day: 'Day 14', views: 520, sales: 5 },
    { day: 'Day 21', views: 890, sales: 8 },
    { day: 'Day 28', views: 1240, sales: 12 },
  ];

  // Mock price history
  const priceHistory = [
    { date: 'Nov 18', price: 149.99 },
    { date: 'Nov 25', price: 139.99 },
    { date: 'Dec 02', price: 129.99 },
    { date: 'Dec 09', price: 119.99 },
    { date: 'Dec 16', price: 119.99 },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SKU Deep Dive</h1>
        <p className="text-muted-foreground">Single-SKU storytelling and performance analysis</p>
      </div>

      {/* Search */}
      <div className="dashboard-card">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by UPC, Item ID, or Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch}>Search</Button>
        </div>
        
        {/* Quick Select */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-xs text-muted-foreground">Quick select:</span>
          {sampleInventoryItems.slice(0, 4).map((item) => (
            <Button
              key={item.id}
              variant={selectedItem?.id === item.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedItem(item)}
              className="text-xs"
            >
              {item.upc}
            </Button>
          ))}
        </div>
      </div>

      {selectedItem ? (
        <>
          {/* Item Header */}
          <div className="dashboard-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn(
                    "risk-badge",
                    selectedItem.riskLevel === 'Low' && "risk-low",
                    selectedItem.riskLevel === 'Medium' && "risk-medium",
                    selectedItem.riskLevel === 'High' && "risk-high",
                    selectedItem.riskLevel === 'Critical' && "risk-critical",
                  )}>
                    {selectedItem.riskLevel} Risk
                  </span>
                  <span className={cn(
                    "status-badge",
                    selectedItem.listingStatus === 'Published' && "status-live",
                    selectedItem.listingStatus === 'Unpublished' && "status-unlisted",
                    selectedItem.listingStatus === 'Suppressed' && "status-suppressed",
                  )}>
                    {selectedItem.listingStatus}
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-1">{selectedItem.title}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="font-mono">UPC: {selectedItem.upc}</span>
                  <span>Model: {selectedItem.model}</span>
                  <span>ID: {selectedItem.id}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">${selectedItem.retail}</div>
                <div className="text-sm text-muted-foreground">List Price</div>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <KPICard value={selectedItem.quantity} label="Qty on Hand" format="number" />
            <KPICard value={selectedItem.agingDays} label="Days in Inventory" format="number" />
            <KPICard value={selectedItem.views} label="Total Views" format="number" />
            <KPICard value={selectedItem.unitsSold} label="Units Sold" format="number" />
            <KPICard value={selectedItem.gmv} label="GMV" format="currency" />
            <KPICard 
              value={selectedItem.views > 0 ? ((selectedItem.unitsSold / selectedItem.views) * 100).toFixed(2) : 0} 
              label="Conversion Rate" 
              format="percent" 
            />
          </div>

          {/* Timeline */}
          <div className="dashboard-card">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Inventory Timeline</h3>
            <div className="relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
              <div className="flex justify-between relative">
                {timelineEvents.map((event, index) => (
                  <div key={event.event} className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center relative z-10",
                      event.status === 'complete' ? "bg-status-live text-status-live/20" : "bg-muted text-muted-foreground"
                    )}>
                      {event.status === 'complete' ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <div className="font-medium text-sm">{event.event}</div>
                      <div className="text-xs text-muted-foreground">{event.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              data={performanceData}
              lines={[
                { dataKey: 'views', color: 'hsl(217, 91%, 60%)', name: 'Views' },
                { dataKey: 'sales', color: 'hsl(142, 76%, 36%)', name: 'Sales' },
              ]}
              xAxisKey="day"
              title="Performance Over Time"
            />
            <LineChart
              data={priceHistory}
              lines={[
                { dataKey: 'price', color: 'hsl(173, 80%, 40%)', name: 'Price' },
              ]}
              xAxisKey="date"
              title="Price History"
              valuePrefix="$"
            />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="dashboard-card">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Item Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Category" value={selectedItem.category} />
                <DetailRow label="Condition" value={selectedItem.condition} />
                <DetailRow label="Facility" value={selectedItem.facility} />
                <DetailRow label="Program" value={selectedItem.program} />
                <DetailRow label="Cost" value={`$${selectedItem.cost}`} />
                <DetailRow label="Expected Recovery" value={`$${selectedItem.expectedRecovery}`} />
                <DetailRow label="Check-in Date" value={selectedItem.checkInDate} />
                <DetailRow label="Listed Date" value={selectedItem.listedDate || 'Not listed'} />
              </div>
            </div>

            <div className="dashboard-card">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Risk Flags & Recommendations</h3>
              <div className="space-y-3">
                {selectedItem.riskLevel !== 'Low' && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-risk-high/10 border border-risk-high/20">
                    <AlertTriangle className="w-5 h-5 text-risk-high flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Aging Warning</div>
                      <div className="text-xs text-muted-foreground">
                        Item has been in inventory for {selectedItem.agingDays} days. Consider repricing.
                      </div>
                    </div>
                  </div>
                )}
                {selectedItem.listingStatus === 'Suppressed' && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Listing Suppressed</div>
                      <div className="text-xs text-muted-foreground">
                        Reason: {selectedItem.suppressionReason || 'Unknown'}. Fix to restore visibility.
                      </div>
                    </div>
                  </div>
                )}
                {selectedItem.views > 100 && selectedItem.unitsSold === 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-status-pending/10 border border-status-pending/20">
                    <Eye className="w-5 h-5 text-status-pending flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">High Views, No Sales</div>
                      <div className="text-xs text-muted-foreground">
                        Item is getting attention but not converting. Review pricing and content.
                      </div>
                    </div>
                  </div>
                )}
                {selectedItem.riskLevel === 'Low' && selectedItem.unitsSold > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-status-live/10 border border-status-live/20">
                    <TrendingUp className="w-5 h-5 text-status-live flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">Performing Well</div>
                      <div className="text-xs text-muted-foreground">
                        This item is healthy with good sell-through. Consider increasing inventory.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="dashboard-card text-center py-16">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Item Selected</h3>
          <p className="text-muted-foreground">
            Search for a UPC or Item ID to view detailed analytics
          </p>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium text-sm">{value}</div>
    </div>
  );
}
