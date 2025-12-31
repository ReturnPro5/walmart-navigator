import { LineChart } from '../charts/LineChart';
import { BarChart } from '../charts/BarChart';
import { DataTable } from '../DataTable';
import { KPICard } from '../KPICard';
import { DonutChart } from '../charts/DonutChart';
import { gmvTrendData, sampleInventoryItems, categories, agingBucketsData } from '@/lib/mockData';
import { TrendingUp, DollarSign, Package, Eye } from 'lucide-react';

export function SalesPerformance() {
  // Calculate totals
  const totalGMV = gmvTrendData.reduce((sum, d) => sum + d.gmv, 0);
  const totalUnits = gmvTrendData.reduce((sum, d) => sum + d.units, 0);
  const avgOrderValue = totalGMV / totalUnits;
  
  // Category performance (mock)
  const categoryPerformance = categories.map(cat => ({
    name: cat,
    value: Math.floor(Math.random() * 400000) + 100000,
  })).sort((a, b) => b.value - a.value);

  // Conversion data
  const conversionData = [
    { name: 'Impressions', value: 2450000, color: 'hsl(217, 91%, 60%)' },
    { name: 'Views', value: 342000, color: 'hsl(173, 80%, 40%)' },
    { name: 'Add to Cart', value: 45600, color: 'hsl(262, 83%, 58%)' },
    { name: 'Orders', value: 21800, color: 'hsl(142, 76%, 36%)' },
  ];

  // Sell-through by aging
  const sellThroughData = agingBucketsData.map((bucket, index) => ({
    name: bucket.range + ' days',
    value: Math.max(5, 45 - (index * 12)), // Declining sell-through for older items
  }));

  // Top performers
  const topPerformers = [...sampleInventoryItems]
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, 5);

  // Bottom performers (live but not selling)
  const bottomPerformers = sampleInventoryItems
    .filter(i => i.lifecycleStatus === 'Live' && i.unitsSold < 2);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales & Performance</h1>
        <p className="text-muted-foreground">Track sales outcomes and identify performance patterns</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          value={totalGMV}
          label="Total GMV"
          format="currency"
          delta={8.4}
          tooltip="Gross Merchandise Value for the selected period"
        />
        <KPICard
          value={totalUnits}
          label="Units Sold"
          format="number"
          delta={5.2}
          tooltip="Total units sold in the selected period"
        />
        <KPICard
          value={avgOrderValue}
          label="Avg Order Value"
          format="currency"
          delta={3.1}
          tooltip="Average value per unit sold"
        />
        <KPICard
          value={34.2}
          label="Sell-Through Rate"
          format="percent"
          delta={-1.4}
          tooltip="Percentage of listed items that have sold"
        />
      </div>

      {/* GMV Trend */}
      <LineChart
        data={gmvTrendData}
        lines={[
          { dataKey: 'gmv', color: 'hsl(217, 91%, 60%)', name: 'GMV ($)' },
          { dataKey: 'units', color: 'hsl(173, 80%, 40%)', name: 'Units' },
        ]}
        xAxisKey="week"
        title="Weekly GMV & Units Trend"
        valuePrefix="$"
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          data={categoryPerformance}
          title="GMV by Category"
          valuePrefix="$"
          horizontal
        />
        <DonutChart
          data={conversionData}
          title="Conversion Funnel"
          centerValue="0.89%"
          centerLabel="Overall CVR"
        />
      </div>

      {/* Sell-Through by Aging */}
      <div className="dashboard-card">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Sell-Through Rate by Aging Bucket</h3>
        <div className="grid grid-cols-4 gap-4">
          {sellThroughData.map((bucket, index) => (
            <div key={bucket.name} className="text-center p-4 rounded-lg bg-muted/30">
              <div className="text-2xl font-bold mb-1" style={{ 
                color: index === 0 ? 'hsl(142, 76%, 36%)' : 
                       index === 1 ? 'hsl(45, 93%, 47%)' : 
                       index === 2 ? 'hsl(25, 95%, 53%)' : 
                       'hsl(0, 84%, 60%)'
              }}>
                {bucket.value}%
              </div>
              <div className="text-sm text-muted-foreground">{bucket.name}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Older inventory has significantly lower sell-through rates. Consider repricing or liquidation for 60+ day items.
        </p>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-status-live" />
            <h3 className="text-sm font-medium">Top Performers</h3>
          </div>
          <div className="space-y-3">
            {topPerformers.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-status-live/20 text-status-live flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-medium text-sm truncate max-w-[200px]">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${item.gmv.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">{item.unitsSold} units</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-status-pending" />
            <h3 className="text-sm font-medium">Live But Not Selling</h3>
          </div>
          {bottomPerformers.length > 0 ? (
            <div className="space-y-3">
              {bottomPerformers.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <div className="font-medium text-sm truncate max-w-[200px]">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.views} views • {item.agingDays} days live
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-status-pending">No sales</div>
                    <div className="text-xs text-muted-foreground">Qty: {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>All live items have sales!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
