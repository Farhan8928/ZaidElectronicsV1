import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyTrendChartProps {
  data: Array<{
    month: string;
    revenue: number;
    partsCost: number;
    profit: number;
    jobs: number;
    margin: number;
  }>;
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'margin') return [`${value}%`, 'Margin'];
              return [`₹${value.toLocaleString()}`, 
                name === 'revenue' ? 'Revenue' : 
                name === 'partsCost' ? 'Parts Cost' :
                name === 'profit' ? 'Profit' : 
                name === 'jobs' ? 'Jobs' : name
              ];
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="left" dataKey="partsCost" fill="#d97706" name="Parts Cost" radius={[4, 4, 0, 0]} />
          <Bar yAxisId="left" dataKey="profit" fill="#10b981" name="Profit" radius={[4, 4, 0, 0]} />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="margin" 
            stroke="#f59e0b" 
            strokeWidth={3}
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5 }}
            name="Margin %"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

