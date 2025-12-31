import { LineChart } from '../charts/LineChart';
import { BarChart } from '../charts/BarChart';
import { KPICard } from '../KPICard';

import { WalmartListingRow } from '@/types/walmart';
import { getInventoryStatus } from '@/utils/status';
import { daysBetween } from '@/utils/dates';

import { TrendingUp, Package, Clock, AlertTriangle } from 'lucide-react';

interface SalesPerformanceProps {
  rows: WalmartListingRow[];
}

function startOfWeekISO(d: Date) {
  // Monday start
  const date = new Date(d);
  const day = date.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

export function SalesPerformance({ rows }: SalesPerformanceProps) {
  /* =========================
     REFRAMED: Listing Velocity & Coverage
     ========================= */

  const total = rows.length;

  const statusCounts = rows.reduce(
    (acc, row) => {
      const s = getInventoryStatus(row);
      acc[s] += 1;
      return acc;
    },
    {
      Live: 0,
      Blocked: 0,
      'Ops Complete': 0,
      Processing: 0,
    } as Record<string, number>
  );

  const liveRate = total ? (statusCounts.Live / total) * 100 : 0;
  const blockedRate = total ? (statusCounts.Blocked / total) * 100 : 0;

  // Avg days from check-in to available (listing velocity proxy)
  const toAvailableDays = rows
    .map(r => daysBetween(r.CheckedInOn, r.AvailableForSaleDate))
    .filter((v): v is number => v !== null);

  const avgDaysToAvailable =
    toAvailableDays.length
      ? toAvailableDays.reduce((a, b) => a + b, 0) / toAvailableDays.length
      : 0;

  // Weekly "newly available" trend from AvailableForSaleDate
  const weeklyMap: Record<string, { available: number; blocked: number }> = {};
  rows.forEach(r => {
    if (!r.AvailableForSaleDate) return;
    const wk = startOfWeekISO(new Date(r.AvailableForSaleDate));
    if (!weeklyMap[wk]) weeklyMap[wk] = { available: 0, blocked: 0 };
    weeklyMap[wk].available += 1;
    if (r.LocationNotListable) weeklyMap[wk].blocked += 1;
  });

  const weeklyTrendData = Object.keys(weeklyMap)
    .sort()
    .slice(-12) // last 12 weeks
    .map(wk => ({
      week: wk,
      newlyAvailable: weeklyMap[wk].available,
      newlyBlocked: weeklyMap[wk].blocked,
    }));

  // Category coverage: count of Live items by Category
  const categoryCounts: Record<string, number> = {};
  rows.forEach(r => {
    if (!r.AvailableForSale || r.LocationNotListable) return;
    const cat = r.CategoryName || 'Uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryCoverage = Object.entries(categoryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  // Aging distribution for check-in age (snapshot)
  const agingBuckets = {
    '0–30': 0,
    '31–60': 0,
    '61–90': 0,
    '90+': 0,
  };

  rows.forEach(r => {
    const days = daysBetween(r.CheckedInOn, new Date().toISOString()) ?? 0;
    if (days <= 30) agingBuckets['0–30']++;
    else if (days <= 60) agingBuckets['31–60']++;
    else if (days <= 90) agingBuckets['61–90']++;
    else agingBuckets['90+']++;
  });

  const agingBarData = Object.entries(agingBuckets).map(([range, count]) => ({
    name: `${range} days`,
    value: count,
  }));

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Listing Velocity & Coverage</h1>
        <p className="text-muted-foreground">
          Snapshot-based listing throughput and coverage (no sales metrics)
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          value={statusCounts.Live}
          label="Live Listings"
          format="number"
          tooltip="Items currently available for sale and not blocked"
        />
        <KPICard
          value={liveRate}
          label="Live Rate"
          format="percent"
          tooltip="Percent of total inventory that is live"
        />
        <KPICard
          value={avgDaysToAvailable}
          label="Avg Days to Available"
          format="number"
          tooltip="Average time from check-in to being available for sale"
        />
        <KPICard
          value={blockedRate}
          label="Blocked Rate"
          format="percent"
          tooltip="Percent of inventory currently blocked from listing"
        />
      </div>

      {/* Weekly Availability Trend */}
      <LineChart
        data={weeklyTrendData}
        lines={[
          { dataKey: 'newlyAvailable', color: 'hsl(142, 76%, 36%)', name: 'Newly Available' },
          { dataKey: 'newlyBlocked', color: 'hsl(0, 84%, 60%)', name: 'Newly Blocked' },
        ]}
        xAxisKey="week"
        title="Weekly Listing Velocity (Based on AvailableForSale Date)"
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          data={categoryCoverage}
          title="Live Listings by Category (Top 12)"
          horizontal
        />
        <BarChart
          data={agingBarData}
          title="Inventory Aging (Since Check-In)"
          colorByValue
        />
      </div>

      {/* Operational callouts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CalloutCard
          icon={<TrendingUp className="w-5 h-5 text-status-live" />}
          title="Throughput Focus"
          body="Reduce time from check-in to available by prioritizing ops-complete items that are not yet listable."
        />
        <CalloutCard
          icon={<AlertTriangle className="w-5 h-5 text-status-suppressed" />}
          title="Blocker Removal"
          body="Blocked inventory should be triaged first—these items cannot contribute to live coverage until resolved."
        />
        <CalloutCard
          icon={<Clock className="w-5 h-5 text-status-pending" />}
          title="Aging Control"
          body="Use aging buckets to decide escalation routes for 60+ day inventory."
        />
      </div>

      {/* Simple status summary */}
      <div className="dashboard-card">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-sm font-medium">Current Status Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat label="Processing" value={statusCounts.Processing} />
          <MiniStat label="Ops Complete" value={statusCounts['Ops Complete']} />
          <MiniStat label="Live" value={statusCounts.Live} />
          <MiniStat label="Blocked" value={statusCounts.Blocked} />
        </div>
      </div>
    </div>
  );
}

function CalloutCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="dashboard-card">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div className="font-medium">{title}</div>
      </div>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-lg bg-muted/30 text-center">
      <div className="text-xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
