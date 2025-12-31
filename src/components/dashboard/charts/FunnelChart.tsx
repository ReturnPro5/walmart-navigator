import { cn } from '@/lib/utils';

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

interface FunnelChartProps {
  data: FunnelStage[];
  title?: string;
}

export function FunnelChart({ data, title }: FunnelChartProps) {
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="dashboard-card h-full">
      {title && <h3 className="text-sm font-medium text-muted-foreground mb-6">{title}</h3>}
      <div className="space-y-3">
        {data.map((stage, index) => {
          const widthPercent = (stage.count / maxCount) * 100;
          const isLast = index === data.length - 1;
          
          return (
            <div key={stage.stage} className="group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{stage.stage}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono">{stage.count.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {stage.percentage}%
                  </span>
                </div>
              </div>
              <div className="relative h-10 bg-muted/50 rounded-lg overflow-hidden">
                <div 
                  className={cn(
                    "absolute left-0 top-0 h-full rounded-lg transition-all duration-500 ease-out",
                    isLast ? "bg-accent" : "bg-primary"
                  )}
                  style={{ 
                    width: `${widthPercent}%`,
                    opacity: 0.1 + (0.9 * (1 - index / data.length))
                  }}
                />
                <div 
                  className={cn(
                    "absolute left-0 top-0 h-full rounded-lg transition-all duration-500 ease-out group-hover:opacity-100",
                    isLast ? "bg-accent opacity-80" : "bg-primary opacity-70"
                  )}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              {index < data.length - 1 && (
                <div className="flex justify-center py-1">
                  <span className="text-xs text-muted-foreground">
                    ↓ {((data[index + 1].count / stage.count) * 100).toFixed(1)}% conversion
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
