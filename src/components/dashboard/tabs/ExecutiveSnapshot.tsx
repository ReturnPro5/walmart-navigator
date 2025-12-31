import { KPICard } from '../KPICard';
import { DonutChart } from '../charts/DonutChart';
import { BarChart } from '../charts/BarChart';
import { executiveKPIs, inventoryStatusData, riskDistributionData } from '@/lib/mockData';

export function ExecutiveSnapshot() {
  const riskBarData = riskDistributionData.map(item => ({
    name: item.name,
    value: item.value,
    color: item.color,
  }));

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Executive Snapshot</h1>
        <p className="text-muted-foreground">High-level health overview of Walmart US operations</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {executiveKPIs.map((kpi) => (
          <KPICard
            key={kpi.label}
            value={kpi.value}
            label={kpi.label}
            delta={kpi.delta}
            deltaLabel={kpi.deltaLabel}
            format={kpi.format}
            tooltip={getKPITooltip(kpi.label)}
            className="animate-slide-up"
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          data={inventoryStatusData}
          title="Inventory Status Distribution"
          centerValue={inventoryStatusData.reduce((sum, d) => sum + d.value, 0)}
          centerLabel="Total Items"
        />
        <DonutChart
          data={riskDistributionData}
          title="Risk Distribution"
          centerValue={riskDistributionData.reduce((sum, d) => sum + d.value, 0)}
          centerLabel="Total Items"
        />
      </div>

      {/* Risk Bar Chart */}
      <BarChart
        data={riskBarData}
        title="Risk Level Breakdown"
        horizontal
      />

      {/* Health Summary */}
      <div className="dashboard-card">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Health Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HealthIndicator
            label="Overall Health"
            status="good"
            message="87.4% of inventory is listed and active"
          />
          <HealthIndicator
            label="Risk Level"
            status="warning"
            message="3,421 items need attention (12.4% of total)"
          />
          <HealthIndicator
            label="Performance"
            status="good"
            message="GMV up 8.4% week-over-week"
          />
        </div>
      </div>
    </div>
  );
}

function HealthIndicator({ 
  label, 
  status, 
  message 
}: { 
  label: string; 
  status: 'good' | 'warning' | 'critical'; 
  message: string;
}) {
  const statusColors = {
    good: 'bg-status-live/10 border-status-live/20 text-status-live',
    warning: 'bg-status-pending/10 border-status-pending/20 text-status-pending',
    critical: 'bg-status-suppressed/10 border-status-suppressed/20 text-status-suppressed',
  };

  const statusLabels = {
    good: 'Healthy',
    warning: 'Needs Attention',
    critical: 'Critical',
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{label}</span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-current/10">
          {statusLabels[status]}
        </span>
      </div>
      <p className="text-sm opacity-80">{message}</p>
    </div>
  );
}

function getKPITooltip(label: string): string {
  const tooltips: Record<string, string> = {
    'Active Listings': 'Total number of items currently live on Walmart marketplace',
    'Listed Rate': 'Percentage of total inventory that has been successfully listed',
    'Sell-Through Rate': 'Percentage of listed items that have been sold in the selected period',
    'Avg Days to List': 'Average time from check-in to listing publication',
    'Avg Days Live': 'Average time items have been live on the marketplace',
    'GMV (Period)': 'Gross Merchandise Value for the selected time period',
    'Inventory at Risk': 'Items requiring attention due to aging, suppression, or performance issues',
    'Risk Rate': 'Percentage of total inventory flagged as at-risk',
  };
  return tooltips[label] || '';
}
