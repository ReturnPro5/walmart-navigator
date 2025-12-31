import { cn } from '@/lib/utils';

interface HeatmapData {
  category: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  title?: string;
}

export function HeatmapChart({ data, title }: HeatmapChartProps) {
  const columns = ['low', 'medium', 'high', 'critical'] as const;
  const columnLabels = {
    low: 'Low',
    medium: 'Medium', 
    high: 'High',
    critical: 'Critical'
  };

  const maxValue = Math.max(...data.flatMap(d => [d.low, d.medium, d.high, d.critical]));

  const getIntensity = (value: number): number => {
    return Math.max(0.15, value / maxValue);
  };

  const getColor = (column: typeof columns[number], intensity: number): string => {
    const colors = {
      low: `hsla(142, 76%, 36%, ${intensity})`,
      medium: `hsla(45, 93%, 47%, ${intensity})`,
      high: `hsla(25, 95%, 53%, ${intensity})`,
      critical: `hsla(0, 84%, 60%, ${intensity})`,
    };
    return colors[column];
  };

  return (
    <div className="dashboard-card h-full">
      {title && <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-muted-foreground pb-3 pr-4">
                Category
              </th>
              {columns.map(col => (
                <th key={col} className="text-center text-xs font-medium text-muted-foreground pb-3 px-2">
                  {columnLabels[col]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={row.category}>
                <td className="text-sm font-medium py-2 pr-4">{row.category}</td>
                {columns.map((col) => {
                  const value = row[col];
                  const intensity = getIntensity(value);
                  return (
                    <td key={col} className="p-1">
                      <div 
                        className={cn(
                          "rounded-md h-10 flex items-center justify-center text-xs font-medium transition-all hover:scale-105 cursor-default",
                          intensity > 0.5 ? "text-white" : "text-foreground"
                        )}
                        style={{ backgroundColor: getColor(col, intensity) }}
                        title={`${row.category} - ${columnLabels[col]}: ${value.toLocaleString()}`}
                      >
                        {value.toLocaleString()}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
