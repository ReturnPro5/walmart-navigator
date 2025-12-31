import { BarChart } from '../charts/BarChart';
import { HeatmapChart } from '../charts/HeatmapChart';
import { ActionCard } from '../ActionCard';
import { KPICard } from '../KPICard';

import { WalmartListingRow } from '@/types/walmart';
import { getRiskBucket } from '@/utils/risk';
import { daysBetween } from '@/utils/dates';

import { AlertTriangle, Clock, Package } from 'lucide-react';

interface AgingRiskProps {
  rows: WalmartListingRow[];
}

export function AgingRisk({ rows }: AgingRiskProps) {
  /* =========================
     AGING CALCULATIONS
     ========================= */
  const agingBuckets = {
    '0–30': 0,
    '31–60': 0,
    '61–90': 0,
    '90+': 0,
  };

  rows.forEach(row => {
    const days =
      daysBetween(row.CheckedInOn, new Date().toISOString()) ?? 0;

    if (days <= 30) agingBuckets['0–30']++;
    else if (days <= 60) agingBuckets['31–60']++;
    else if (days <= 90) agingBuckets['61–90']++;
    else agingBuckets['90+']++;
  });

  const agingBarData = Object.entries(agingBuckets).map(([range, count]) => ({
    name: `${range} days`,
    value: count,
  }));

  const totalItems = rows.length;
  const aged90Plus = agingBuckets['90+'];

  /* =========================
     RISK DISTRIBUTION
     ========================= */
  const riskCounts = rows.reduce(
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
    } as Record<'Low' | 'Medium' | 'High' | 'Critical', number>
  );

  /* =========================
     CATEGORY RISK HEATMAP
     ========================= */
  const categoryMap: Record<
    string,
    { low: number; medium: number; high: number; critical: number }
  > = {};

  rows.forEach(row => {
    const category = row.CategoryName || 'Uncategorized';
    const risk = getRiskBucket(row);

    if (!categoryMap[category]) {
      categoryMap[category] = { low: 0, medium: 0, high: 0, critical: 0 };
    }

    categoryMap[category][risk.toLowerCase() as 'low' | 'medium' | 'high' | 'critical']++;
  });

  const heatmapData = Object.entries(categoryMap).map(
    ([category, values]) => ({
      category,
      low: values.low,
      medium: values.medium,
      high: values.high,
      critical: values.critical,
    })
  );

  /* =========================
     ACTION RECOMMENDATIONS
     ========================= */
  const actionRecommendations = [
    {
      title: 'Push Ops Complete Items Live',
      description: 'Ops-complete inventory not yet available for sale',
      count: rows.filter(r => r.OpsComplete && !r.AvailableForSale).length,
      action: 'List Items',
      severity: 'medium',
    },
    {
      title: 'Resolve Blocked Listings',
      description: 'Items blocked from listing',
      count: rows.filter(r => r.LocationNotListable).length,
      action: 'Resolve Blockers',
      severity: 'high',
    },
    {
      title: 'Review Aged Inventory',
      description: 'Inventory aged 90+ days',
      count: aged90Plus,
      action: 'Escalate / Liquidate',
      severity: 'high',
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aging & Risk</h1>
        <p className="text-muted-foreground">
          Inventory aging and listing risk based on current-state snapshot
        </p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          value={totalItems}
          label="Total Inventory"
          format="number"
        />
        <KPICard
          value={aged90Plus}
          label="Aged 90+ Days"
          format="number"
          tooltip="Inventory aged over 90 days since check-in"
        />
        <KPICard
          value={riskCounts.High + riskCounts.Critical}
          label="High / Critical Risk"
          format="number"
        />
        <KPICard
          value={((riskCounts.High + riskCounts.Critical) / (totalItems || 1)) * 100}
          label="Risk Rate"
          format="percent"
        />
      </div>

      {/* Aging + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          data={agingBarData}
          title="Aging Distribution"
          colorByValue
        />
        <HeatmapChart
          data={heatmapData}
          title="Risk by Category"
        />
      </div>

      {/* Action + Logic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionCard
          actions={actionRecommendations}
          title="Recommended Actions"
        />
        <div className="dashboard-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">
            Risk Scoring Logic
          </h3>
          <div className="space-y-4 text-sm">
            <LogicItem
              icon={<Clock className="w-4 h-4" />}
              title="Aging"
              description="Inventory aged over 60 days escalates risk. 90+ days is critical."
            />
            <LogicItem
              icon={<Package className="w-4 h-4" />}
              title="Listing Status"
              description="Blocked or ops-complete-but-unlisted items are elevated to critical risk."
            />
            <LogicItem
              icon={<AlertTriangle className="w-4 h-4" />}
              title="Action Priority"
              description="High and critical risk inventory should be addressed first."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   SUPPORT COMPONENT
   ========================= */

function LogicItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/30">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
