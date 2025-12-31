import { BarChart } from '../charts/BarChart';
import { HeatmapChart } from '../charts/HeatmapChart';
import { ActionCard } from '../ActionCard';
import { KPICard } from '../KPICard';
import { agingBucketsData, categoryRiskData, actionRecommendations, riskDistributionData } from '@/lib/mockData';
import { AlertTriangle, Clock, DollarSign, Package } from 'lucide-react';

export function AgingRisk() {
  const agingBarData = agingBucketsData.map(d => ({
    name: d.range + ' days',
    value: d.count,
  }));

  const totalItems = agingBucketsData.reduce((sum, d) => sum + d.count, 0);
  const totalValue = agingBucketsData.reduce((sum, d) => sum + d.value, 0);
  const aged90Plus = agingBucketsData.find(d => d.range === '90+');
  const criticalCount = riskDistributionData.find(d => d.name === 'Critical')?.value || 0;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aging & Risk</h1>
        <p className="text-muted-foreground">Identify inventory at risk and recommended actions</p>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          value={totalItems}
          label="Total Inventory"
          format="number"
          tooltip="Total items across all aging buckets"
        />
        <KPICard
          value={totalValue}
          label="Total Value at Risk"
          format="currency"
          tooltip="Combined value of all inventory"
        />
        <KPICard
          value={aged90Plus?.count || 0}
          label="Aged 90+ Days"
          format="number"
          delta={-8.2}
          tooltip="Items that have been in inventory for over 90 days"
        />
        <KPICard
          value={criticalCount}
          label="Critical Risk"
          format="number"
          delta={-12.4}
          tooltip="Items requiring immediate attention"
        />
      </div>

      {/* Risk Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {riskDistributionData.map((risk) => (
          <RiskCard
            key={risk.name}
            level={risk.name as 'Low' | 'Medium' | 'High' | 'Critical'}
            count={risk.value}
            total={totalItems}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          data={agingBarData}
          title="Aging Distribution"
          colorByValue
        />
        <div className="dashboard-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Value by Aging Bucket</h3>
          <div className="space-y-4">
            {agingBucketsData.map((bucket) => {
              const percentage = (bucket.value / totalValue) * 100;
              return (
                <div key={bucket.range} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{bucket.range} days</span>
                    <span className="font-mono font-medium">
                      ${bucket.value.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ 
                        width: `${percentage}%`,
                        opacity: 1 - (agingBucketsData.indexOf(bucket) * 0.2)
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category Risk Heatmap */}
      <HeatmapChart
        data={categoryRiskData}
        title="Risk by Category"
      />

      {/* Action Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActionCard
          actions={actionRecommendations}
          title="Recommended Actions"
        />
        
        <div className="dashboard-card">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Risk Scoring Logic</h3>
          <div className="space-y-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Aging Factor</span>
              </div>
              <p className="text-muted-foreground">
                Items aged 60+ days receive elevated risk scores. 90+ days triggers critical status.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Listing Status</span>
              </div>
              <p className="text-muted-foreground">
                Unlisted or suppressed items automatically increase risk level by one tier.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Price Competitiveness</span>
              </div>
              <p className="text-muted-foreground">
                Items priced 20%+ above market receive elevated risk due to lower sell probability.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Performance</span>
              </div>
              <p className="text-muted-foreground">
                Items with zero views/sales in 14+ days while live receive risk escalation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskCard({ 
  level, 
  count, 
  total 
}: { 
  level: 'Low' | 'Medium' | 'High' | 'Critical';
  count: number;
  total: number;
}) {
  const percentage = ((count / total) * 100).toFixed(1);
  
  const levelStyles = {
    Low: {
      bg: 'bg-risk-low/10',
      border: 'border-risk-low/20',
      text: 'text-risk-low',
      icon: '✓',
    },
    Medium: {
      bg: 'bg-risk-medium/10',
      border: 'border-risk-medium/20',
      text: 'text-risk-medium',
      icon: '!',
    },
    High: {
      bg: 'bg-risk-high/10',
      border: 'border-risk-high/20',
      text: 'text-risk-high',
      icon: '!!',
    },
    Critical: {
      bg: 'bg-risk-critical/10',
      border: 'border-risk-critical/20',
      text: 'text-risk-critical',
      icon: '⚠',
    },
  };

  const style = levelStyles[level];

  return (
    <div className={`dashboard-card ${style.bg} border ${style.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-medium ${style.text}`}>{level} Risk</span>
        <span className={`text-lg ${style.text}`}>{style.icon}</span>
      </div>
      <div className="text-2xl font-bold">{count.toLocaleString()}</div>
      <div className="text-sm text-muted-foreground">{percentage}% of inventory</div>
    </div>
  );
}
