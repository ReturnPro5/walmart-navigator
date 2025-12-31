import { FunnelChart } from '../charts/FunnelChart';
import { BarChart } from '../charts/BarChart';
import { KPICard } from '../KPICard';
import { funnelData } from '@/lib/mockData';
import { AlertTriangle, TrendingDown, Clock } from 'lucide-react';

export function InventoryFunnel() {
  // Calculate stage drop-offs
  const dropOffs = funnelData.slice(0, -1).map((stage, index) => {
    const nextStage = funnelData[index + 1];
    const dropOff = stage.count - nextStage.count;
    const dropOffPercent = ((dropOff / stage.count) * 100).toFixed(1);
    return {
      from: stage.stage,
      to: nextStage.stage,
      lost: dropOff,
      percentage: dropOffPercent,
    };
  });

  const bottleneckData = dropOffs.map(d => ({
    name: `${d.from} → ${d.to}`,
    value: d.lost,
  }));

  // Calculate key metrics
  const inboundToLive = ((funnelData[3].count / funnelData[0].count) * 100).toFixed(1);
  const liveToSold = ((funnelData[4].count / funnelData[3].count) * 100).toFixed(1);
  const totalDropOff = funnelData[0].count - funnelData[4].count;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory → Listing Funnel</h1>
        <p className="text-muted-foreground">Track where inventory gets stuck in the pipeline</p>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          value={funnelData[0].count}
          label="Total Inbound"
          format="number"
          tooltip="Total items received in the selected period"
        />
        <KPICard
          value={inboundToLive}
          label="Inbound → Live Rate"
          format="percent"
          delta={2.3}
          tooltip="Percentage of inbound items that become live listings"
        />
        <KPICard
          value={liveToSold}
          label="Live → Sold Rate"
          format="percent"
          delta={-1.2}
          tooltip="Conversion rate from live listings to sales"
        />
        <KPICard
          value={totalDropOff}
          label="Total Drop-Off"
          format="number"
          delta={-4.5}
          tooltip="Items lost through the funnel (not yet sold)"
        />
      </div>

      {/* Main Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelChart
          data={funnelData}
          title="Lifecycle Funnel"
        />
        
        <BarChart
          data={bottleneckData}
          title="Drop-Off by Stage"
          horizontal
          colorByValue
        />
      </div>

      {/* Bottleneck Analysis */}
      <div className="dashboard-card">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Bottleneck Analysis</h3>
        <div className="space-y-4">
          {dropOffs.map((drop, index) => (
            <div key={drop.from} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background">
                {index === 0 ? (
                  <Clock className="w-5 h-5 text-muted-foreground" />
                ) : index === dropOffs.length - 1 ? (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-status-pending" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{drop.from} → {drop.to}</span>
                  <span className="text-sm font-mono text-muted-foreground">
                    -{drop.lost.toLocaleString()} ({drop.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-destructive/60 rounded-full"
                    style={{ width: `${parseFloat(drop.percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stage Details */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {funnelData.map((stage, index) => (
          <div 
            key={stage.stage}
            className="dashboard-card text-center"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="text-2xl font-bold mb-1">{stage.count.toLocaleString()}</div>
            <div className="text-sm font-medium text-muted-foreground mb-2">{stage.stage}</div>
            <div className="text-xs text-muted-foreground">
              {stage.percentage}% of inbound
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
