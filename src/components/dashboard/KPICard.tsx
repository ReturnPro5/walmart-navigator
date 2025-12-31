import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface KPICardProps {
  value: number | string;
  label: string;
  delta?: number;
  deltaLabel?: string;
  format?: 'number' | 'currency' | 'percent';
  tooltip?: string;
  className?: string;
}

export function KPICard({ 
  value, 
  label, 
  delta, 
  deltaLabel = 'vs last period',
  format = 'number',
  tooltip,
  className 
}: KPICardProps) {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          notation: val >= 1000000 ? 'compact' : 'standard',
          maximumFractionDigits: val >= 1000000 ? 2 : 0,
        }).format(val);
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-US', {
          notation: val >= 10000 ? 'compact' : 'standard',
          maximumFractionDigits: 1,
        }).format(val);
    }
  };

  const getDeltaIcon = () => {
    if (!delta || delta === 0) return <Minus className="w-3 h-3" />;
    return delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  const getDeltaClass = () => {
    if (!delta || delta === 0) return 'text-muted-foreground';
    return delta > 0 ? 'kpi-delta-positive' : 'kpi-delta-negative';
  };

  const card = (
    <div className={cn("kpi-card animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <span className="kpi-label">{label}</span>
        {delta !== undefined && (
          <span className={cn("kpi-delta", getDeltaClass())}>
            {getDeltaIcon()}
            <span>{Math.abs(delta).toFixed(1)}%</span>
          </span>
        )}
      </div>
      <span className="kpi-value">{formatValue(value)}</span>
      {delta !== undefined && (
        <span className="text-xs text-muted-foreground">{deltaLabel}</span>
      )}
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{card}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return card;
}
