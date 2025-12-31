import { FunnelChart } from '../charts/FunnelChart';
import { BarChart } from '../charts/BarChart';
import { KPICard } from '../KPICard';

import { WalmartListingRow } from '@/types/walmart';

interface InventoryFunnelProps {
  rows: WalmartListingRow[];
}

export function InventoryFunnel({ rows }: InventoryFunnelProps) {
  /* =========================
     STAGE COUNTS (CURRENT STATE)
     ========================= */
  const checkedIn = rows.filter(r => !!r.CheckedInOn).length;
  const processing = rows.filter(r => !r.OpsComplete).length;
  const opsComplete = rows.filter(r => r.OpsComplete).length;
  const availableForSale = rows.filter(r => r.AvailableForSale).length;
  const blocked = rows.filter(r => r.LocationNotListable).length;

  const funnelData = [
    {
      stage: 'Checked In',
      count: checkedIn,
      percentage: checkedIn ? 100 : 0,
    },
    {
      stage: 'Processing',
      count: processing,
      percentage: checkedIn ? ((processing / checkedIn) * 100).toFixed(1) : 0,
    },
    {
      stage: 'Ops Complete',
      count: opsComplete,
      percentage: checkedIn ? ((opsComplete / checkedIn) * 100).toFixed(1) : 0,
    },
    {
      stage: 'Available for Sale',
      count: availableForSale,
      percentage: checkedIn ? ((availableForSale / checkedIn) * 100).toFixed(1) : 0,
    },
    {
      stage: 'Blocked',
      count: blocked,
      percentage: checkedIn ? ((blocked / checkedIn) * 100).toFixed(1) : 0,
    },
  ];

  /* =========================
     BOTTLENECK ANALYSIS
     ========================= */
  const bottleneckData = [
    {
      name: 'Processing → Ops Complete',
      value: Math.max(processing - opsComplete, 0),
    },
    {
      name: 'Ops Complete → Available',
      value: Math.max(opsComplete - availableForSale, 0),
    },
    {
      name: 'Available → Blocked',
      value: blocked,
    },
  ];

  /* =========================
     KPI SUMMARY
     ========================= */
  const opsCompletionRate = checkedIn
    ? ((opsComplete / checkedIn) * 100).toFixed(1)
    : '0.0';

  const availabilityRate = opsComplete
    ? ((availableForSale / opsComplete) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Inventory → Listing Funnel
        </h1>
        <p className="text-muted-foreground">
          Current-state view of inventory readiness and listability
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          value={checkedIn}
          label="Checked In"
          format="number"
          tooltip="Total items currently in inventory"
        />
        <KPICard
          value={opsCompletionRate}
          label="Ops Completion Rate"
          format="percent"
          tooltip="Percent of checked-in items with operations complete"
        />
        <KPICard
          value={availabilityRate}
          label="Available for Sale Rate"
          format="percent"
          tooltip="Percent of ops-complete items that are listable"
        />
        <KPICard
          value={blocked}
          label="Blocked Items"
          format="number"
          tooltip="Items currently blocked from listing"
        />
      </div>

      {/* Funnel + Bottlenecks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelChart
          data={funnelData}
          title="Lifecycle Funnel (Current State)"
        />
        <BarChart
          data={bottleneckData}
          title="Current Bottlenecks"
          horizontal
          colorByValue
        />
      </div>
    </div>
  );
}
