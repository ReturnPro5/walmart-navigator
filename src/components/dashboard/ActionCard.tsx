import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionItem {
  action: string;
  count: number;
  description: string;
}

interface ActionCardProps {
  actions: ActionItem[];
  title?: string;
}

export function ActionCard({ actions, title }: ActionCardProps) {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'List Now': return 'bg-primary/10 text-primary border-primary/20';
      case 'Fix Attributes': return 'bg-status-pending/10 text-status-pending border-status-pending/20';
      case 'Reprice': return 'bg-chart-3/10 text-chart-3 border-chart-3/20';
      case 'Add Images': return 'bg-accent/10 text-accent border-accent/20';
      case 'Liquidate': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="dashboard-card">
      {title && <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>}
      <div className="space-y-3">
        {actions.map((item) => (
          <div
            key={item.action}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-sm cursor-pointer group",
              getActionColor(item.action)
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-sm">{item.action}</span>
              <span className="text-xs opacity-70">{item.description}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold tabular-nums">{item.count.toLocaleString()}</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
