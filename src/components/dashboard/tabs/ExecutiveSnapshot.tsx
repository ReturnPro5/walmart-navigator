import { KPICard } from '../KPICard';
import { DonutChart } from '../charts/DonutChart';
import { BarChart } from '../charts/BarChart';

import { WalmartListingRow } from '@/types/walmart';
import {
  activeListings,
  listedRate,
  avgDaysToList,
  avgDaysLive,
  inventoryAtRisk,
  riskRate,
} from '@/selectors/kpis';

import { getInventoryStatus } from '@/utils/status';
import { getRiskBucket } from '@/utils/risk';

interface ExecutiveSnapshotProps {
  rows: WalmartListingRow[];
}

export function ExecutiveSnapshot({ rows }: ExecutiveSnapshotProps) {
  /* =========================
     KPI VALUES
     ========================= */
  const kpis = [
    {
      label: 'Active Listings',
      value: activeListings(rows),
      format: 'number' as const,
    },
    {
      label: 'Listed Rate',
      value: listedRate(rows),
      format: 'percent' as const,
    },
    {
      label: 'Avg Days to List',
      value: avgDaysToList(rows),
      format: 'number' as const,
    },
    {
      label: 'Avg Days Live',
      value: avgDaysLive(rows),
      format: 'number' as const,
    },
    {
      label: 'Inventory at Risk',
      value: inventoryAtRisk(rows),
      format: 'number' as const,
    },
    {
      label: 'Risk Rate',
      value: riskRate(rows),
      format: 'percent' as const,
    },
  ];

  /* =========================
     INVENTORY STATUS DONUT
     ========================= */
  const inventoryStatusCounts = rows.reduce(
    (acc, row) => {
      const status = getInventoryStatus(row);
      acc[status] += 1;
      return acc;
    },
    {
      Live: 0,
      Blocked: 0,
      'Ops Complete': 0,
      Processing: 0,
    } as Record<string, number>
  );

  const inventoryStatusData = [
    { name: 'Live', value: inventoryStatusCounts.Live, color: 'hsl(142, 76%, 36%)' },
    { name: 'Blocked', value: inventoryStatusCounts.Blocked, color: 'hsl(0, 84%, 60%)' },
    { name: 'Ops Complete', value: inventoryStatusCounts['Ops Complete'], color: 'hsl(45, 93%, 47%)' },
    { name: 'Processing', value: inventoryStatusCounts.Processing, color: 'hsl(217, 91%, 60%)' },
  ];

  /* =========================
     RISK DISTRIBUTION
     ========================= */
  const riskCounts = rows.reduce(
    (acc, row) => {
      const bucket = getRiskBucket(row);
      acc[bucket] += 1;
      return acc;
    },
    {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    } as Record<string, number>
  );

  const riskDistributionData = [
    { name: 'Low', value: riskCounts.Low, color: 'hsl(142, 76%, 36%)' },
    { name: 'Medium', value: riskCounts.Medium, color: 'hsl(45, 93%, 47%)' },
    { name: 'High', value: riskCounts.High, color: 'hsl(25, 95%, 53%)' },
    { name: 'Critical', value: riskCounts.Critical, color: 'hsl(0, 84%, 60%)' },
  ];

  const riskBarData = riskDistributionData.map(d => ({
    name: d.name,
    value: d.value,
    color: d.color,
  }));

  /* =========================
     HEALTH SUMMARY (DERIVED)
     ========================= */
  const listedPct = listedRate(rows);
  const riskPct = riskRate(rows);

  const overallHealth =
    listedPct >= 85 && riskPct < 15
      ? 'good'
      : listedPct >= 70 && riskPct < 25
      ? 'warning'
      : 'critical';

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Executive Snapshot</h1>
        <p className="text-muted-foreground">
          Current-state view of Walmart US listings health
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            format={kpi.format}
            tooltip={getKPITooltip(kpi.label)}
          />
        ))}
      </div>

      {/* Donuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          title="Inventory Status Distribution"
          data={inventoryStatusData}
          centerValue={rows.length}
          centerLabel="Total Items"
        />
        <DonutChart
          title="Risk Distribution"
          data={riskDistributionData}
          centerValue={rows.length}
          centerLabel="Total Items"
        />
      </div>

      {/* Risk Bar */}
      <BarChart
        data={riskBarData}
        title="Risk Level Breakdown"
        horizontal
      />

      {/* Health Summary */}
      <div className="dashboard-card">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          Health Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HealthIndicator
            label="Overall Health"
            status={overallHealth}
            message={`${listedPct.toFixed(1)}% of inventory is listed`}
          />
          <HealthIndicator
            label="Risk Exposure"
            status={riskPct < 15 ? 'good' : riskPct < 25 ? 'warning' : 'critical'}
            message={`${inventoryAtRisk(rows).toLocaleString()} items require attention`}
          />
          <HealthIndicator
            label="Listing Velocity"
            status={avgDaysToList(rows) <= 7 ? 'good' : 'warning'}
            message={`Average of ${avgDaysToList(rows).toFixed(1)} days to list`}
          />
        </div>
      </div>
    </div>
  );
}

/* =========================
   SUPPORTING COMPONENTS
   ========================= */

function HealthIndicator({
  label,
  status,
  message,
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
    'Active Listings': 'Items currently eligible and live on Walmart',
    'Listed Rate': 'Percentage of total inventory available for sale',
    'Avg Days to List': 'Average time from check-in to being listable',
    'Avg Days Live': 'Average time items have been live on Walmart',
    'Inventory at Risk': 'Items that are aged, blocked, or unlisted',
    'Risk Rate': 'Percentage of inventory flagged as high or critical risk',
  };
  return tooltips[label] || '';
}
