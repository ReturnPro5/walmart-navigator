import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface LineChartProps {
  data: Array<Record<string, any>>;
  lines: Array<{
    dataKey: string;
    color: string;
    name: string;
  }>;
  xAxisKey: string;
  title?: string;
  valuePrefix?: string;
}

export function LineChart({ data, lines, xAxisKey, title, valuePrefix = '' }: LineChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {valuePrefix}{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-card h-full">
      {title && <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLine
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey={xAxisKey} 
              tick={{ fontSize: 12 }} 
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
            />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                name={line.name}
                strokeWidth={2}
                dot={{ r: 4, fill: line.color }}
                activeDot={{ r: 6 }}
              />
            ))}
          </RechartsLine>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
