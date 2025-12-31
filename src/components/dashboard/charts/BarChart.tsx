import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  title?: string;
  valuePrefix?: string;
  horizontal?: boolean;
  showGrid?: boolean;
  colorByValue?: boolean;
}

export function BarChart({ 
  data, 
  title, 
  valuePrefix = '',
  horizontal = false,
  showGrid = true,
  colorByValue = false
}: BarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{label}</p>
          <p className="text-sm text-muted-foreground">
            {valuePrefix}{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (value: number, max: number) => {
    if (!colorByValue) return 'hsl(217, 91%, 60%)';
    const ratio = value / max;
    if (ratio >= 0.75) return 'hsl(142, 76%, 36%)';
    if (ratio >= 0.5) return 'hsl(45, 93%, 47%)';
    if (ratio >= 0.25) return 'hsl(25, 95%, 53%)';
    return 'hsl(0, 84%, 60%)';
  };

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="dashboard-card h-full">
      {title && <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBar
            data={data}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 10, right: 10, left: horizontal ? 80 : 10, bottom: 20 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />}
            {horizontal ? (
              <>
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  stroke="hsl(var(--muted-foreground))"
                  width={70}
                />
              </>
            ) : (
              <>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || getBarColor(entry.value, maxValue)}
                />
              ))}
            </Bar>
          </RechartsBar>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
