import { DonutChart } from '../charts/DonutChart';
import { BarChart } from '../charts/BarChart';
import { DataTable } from '../DataTable';
import { KPICard } from '../KPICard';
import { inventoryStatusData, suppressionReasonsData, sampleInventoryItems } from '@/lib/mockData';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

export function ListingHealth() {
  const published = inventoryStatusData.find(d => d.name === 'Live')?.value || 0;
  const unpublished = inventoryStatusData.find(d => d.name === 'Unlisted')?.value || 0;
  const suppressed = inventoryStatusData.find(d => d.name === 'Suppressed')?.value || 0;
  const total = inventoryStatusData.reduce((sum, d) => sum + d.value, 0);

  const publishedRate = ((published / total) * 100).toFixed(1);
  const suppressedRate = ((suppressed / total) * 100).toFixed(1);

  const suppressionBarData = suppressionReasonsData.map(d => ({
    name: d.reason,
    value: d.count,
  }));

  const suppressedItems = sampleInventoryItems.filter(i => i.listingStatus === 'Suppressed');

  // Pricing buckets (mock)
  const pricingData = [
    { name: 'Competitive', value: 14200, color: 'hsl(142, 76%, 36%)' },
    { name: 'Slightly High', value: 4800, color: 'hsl(45, 93%, 47%)' },
    { name: 'Overpriced', value: 2100, color: 'hsl(25, 95%, 53%)' },
    { name: 'Severely Overpriced', value: 890, color: 'hsl(0, 84%, 60%)' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Listing Health</h1>
        <p className="text-muted-foreground">Are our listings healthy? Monitor publishing status and issues.</p>
      </div>

      {/* Health Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HealthStatusCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Published"
          value={published}
          total={total}
          status="good"
        />
        <HealthStatusCard
          icon={<Clock className="w-5 h-5" />}
          label="Unpublished"
          value={unpublished}
          total={total}
          status="warning"
        />
        <HealthStatusCard
          icon={<XCircle className="w-5 h-5" />}
          label="Suppressed"
          value={suppressed}
          total={total}
          status="critical"
        />
        <KPICard
          value={publishedRate}
          label="Health Rate"
          format="percent"
          delta={1.8}
          tooltip="Percentage of inventory that is successfully published"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          data={inventoryStatusData}
          title="Listing Status Breakdown"
          centerValue={total}
          centerLabel="Total Listings"
        />
        <BarChart
          data={suppressionBarData}
          title="Suppression Reasons"
          horizontal
        />
      </div>

      {/* Pricing Competitiveness */}
      <DonutChart
        data={pricingData}
        title="Price Competitiveness"
        centerValue={pricingData.reduce((sum, d) => sum + d.value, 0)}
        centerLabel="Priced Items"
      />

      {/* Issues Table */}
      <div className="dashboard-card">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <h3 className="text-sm font-medium">Items Requiring Attention</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            Showing suppressed and problematic listings
          </span>
        </div>
        <DataTable 
          data={sampleInventoryItems.filter(i => 
            i.listingStatus === 'Suppressed' || 
            i.listingStatus === 'Unpublished' ||
            i.riskLevel === 'High' ||
            i.riskLevel === 'Critical'
          )}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionSummaryCard
          title="Missing Images"
          count={542}
          action="Add product images"
          severity="high"
        />
        <ActionSummaryCard
          title="Missing Attributes"
          count={389}
          action="Complete required fields"
          severity="medium"
        />
        <ActionSummaryCard
          title="Price Issues"
          count={421}
          action="Review and adjust pricing"
          severity="medium"
        />
      </div>
    </div>
  );
}

function HealthStatusCard({ 
  icon, 
  label, 
  value, 
  total,
  status 
}: { 
  icon: React.ReactNode;
  label: string; 
  value: number;
  total: number;
  status: 'good' | 'warning' | 'critical';
}) {
  const percentage = ((value / total) * 100).toFixed(1);
  
  const statusColors = {
    good: 'text-status-live bg-status-live/10',
    warning: 'text-status-pending bg-status-pending/10',
    critical: 'text-status-suppressed bg-status-suppressed/10',
  };

  return (
    <div className="dashboard-card">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${statusColors[status]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-xs text-muted-foreground mt-1">{percentage}% of total</div>
    </div>
  );
}

function ActionSummaryCard({
  title,
  count,
  action,
  severity,
}: {
  title: string;
  count: number;
  action: string;
  severity: 'low' | 'medium' | 'high';
}) {
  const severityColors = {
    low: 'border-status-live/30 bg-status-live/5',
    medium: 'border-status-pending/30 bg-status-pending/5',
    high: 'border-status-suppressed/30 bg-status-suppressed/5',
  };

  return (
    <div className={`dashboard-card border-l-4 ${severityColors[severity]}`}>
      <div className="font-medium mb-1">{title}</div>
      <div className="text-2xl font-bold mb-2">{count.toLocaleString()}</div>
      <div className="text-sm text-muted-foreground">{action}</div>
    </div>
  );
}
