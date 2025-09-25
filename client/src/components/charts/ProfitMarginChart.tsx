import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface ProfitMarginChartProps {
  data: Array<{
    period: string;
    margin: number;
    profit: number;
    revenue: number;
  }>;
}

export function ProfitMarginChart({ data }: ProfitMarginChartProps) {
  const averageMargin = data.length > 0 
    ? data.reduce((sum, item) => sum + item.margin, 0) / data.length 
    : 0;

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)}%`,
              name === 'margin' ? 'Profit Margin' : 
              name === 'profit' ? `Profit (₹${value.toLocaleString()})` :
              `Revenue (₹${value.toLocaleString()})`
            ]}
          />
          <ReferenceLine 
            y={averageMargin} 
            stroke="#ef4444" 
            strokeDasharray="5 5" 
            label={{ value: `Avg: ${averageMargin.toFixed(1)}%`, position: "topRight" }}
          />
          <Line 
            type="monotone" 
            dataKey="margin" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, stroke: '#10b981', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

