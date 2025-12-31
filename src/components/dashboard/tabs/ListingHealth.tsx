import { DonutChart } from '../charts/DonutChart';
import { BarChart } from '../charts/BarChart';
import { DataTable } from '../DataTable';
import { KPICard } from '../KPICard';

import { WalmartListingRow } from '@/types/walmart';
import { getInventoryStatus } from '@/utils/status';
import { getRiskBucket } from '@/utils/risk';

import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ListingHealthProps {
  rows: WalmartListingRow[];
}

export function ListingHealth({ rows }: ListingHealthProps) {
  /* =========================
     STATUS COUNTS
     ========================= */
  const statusCounts = rows.reduce(
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

  const total = rows.length;

  const published = statusCounts.Live;
  const unpublished = statusCounts['Ops Complete'] + statusCounts.Processing;
  const suppressed = statusCounts.Blocked;

  const publishedRate = total ? ((published / total) * 100).toFixed(1) : '0.0';

  /* =========================
     DONUT DATA
     ========================= */
  const inventoryStatusData = [
    { name: 'Live', value: statusCounts.Live, color: 'hsl(142, 76%, 36%)' },
    { name: 'Ops Complete', value: statusCounts['Ops Complete'], color: 'hsl(45, 93%, 47%)' },
    { name: 'Processing', value: statusCounts.Processing, color: 'hsl(217, 91%, 60%)' },
    { name: 'Blocked', value: statusCounts.Blocked, color: 'hsl(0, 84%, 60%)' },
  ];

  /* =========================
     RISK → ACTION BAR
     ========================= */
  const riskActionCounts = rows.reduce(
    (acc, row) => {
      const risk = getRiskBucket(row);
      acc[risk] += 1;
      return acc;
    },
    {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    } as Record<string, number>
  );

  const suppressionBarData = [
    { name: 'Low Risk', value: riskActionCounts.Low },
    { name: 'Medium Risk', value: riskActionCounts.Medium },
    { name: 'High Risk', value: riskActionCounts.High },
    { name: 'Critical Risk', value: riskActionCounts.Critical },
  ];

  /* =========================
     ISSUE TABLE
     ========================= */
  const issueRows = rows.filter(row => {
    const status = getInventoryStatus(row);
    const risk = getRiskBucket(row);
    return (
      status === 'Blocked' ||
      status === 'Ops Complete' ||
      risk === 'High' ||
      risk === 'Critical'
    );
  });

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Listing Health</h1>
        <p className="text-muted-foreground">
          Publishing readiness and listing issues across Walmart US inventory
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HealthStatusCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Live"
          value={published}
          total={total}
          status="good"
        />
        <HealthStatusCard
          icon={<Clock className="w-5 h-5" />}
          label="Not Yet Live"
          value={unpublished}
          total={total}
          status="warning"
        />
        <HealthStatusCard
          icon={<XCircle className="w-5 h-5" />}
          label="Blocked"
          value={suppressed}
          total={total}
          status="critical"
        />
        <KPICard
          value={Number(publishedRate)}
          label="Publish Rate"
          format="percent"
          tooltip="Percent of inventory currently live on Walmart"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          data={inventoryStatusData}
          title="Listing Status Breakdown"
          centerValue={total}
          centerLabel="Total Items"
        />
        <BarChart
          data={suppressionBarData}
          title="Risk Distribution (Action Required)"
          horizontal
          colorByValue
        />
      </div>

      {/* Issues Table */}
      <div className="dashboard-card">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-destructive" />
          <h3 className="text-sm font-medium">Items Requiring Attention</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            Blocked, unlisted, or high-risk items
          </span>
        </div>
        <DataTable data={issueRows} />
      </div>

      {/* Action Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionSummaryCard
          title="Blocked Listings"
          count={statusCounts.Blocked}
          action="Resolve listability or compliance issues"
          severity="high"
        />
        <ActionSummaryCard
          title="Ops Complete, Not Live"
          count={statusCounts['Ops Complete']}
          action="Push to listing"
          severity="medium"
        />
        <ActionSummaryCard
          title="High / Critical Risk"
          count={riskActionCounts.High + riskActionCounts.Critical}
          action="Review aging and take action"
          severity="medium"
        />
      </div>
    </div>
  );
}

/* =========================
   SUPPORTING COMPONENTS
   ========================= */

function HealthStatusCard({
  icon,
  label,
  value,
  total,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  total: number;
  status: 'good' | 'warning' | 'critical';
}) {
  const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';

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
      <div className="text-xs text-muted-foreground mt-1">
        {percentage}% of total
      </div>
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
