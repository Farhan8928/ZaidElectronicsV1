import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProfitChartProps {
  data?: Array<{
    day: string;
    profit: number;
  }>;
}

const defaultData = [
  { day: 'Mon', profit: 1200 },
  { day: 'Tue', profit: 800 },
  { day: 'Wed', profit: 1600 },
  { day: 'Thu', profit: 950 },
  { day: 'Fri', profit: 2100 },
  { day: 'Sat', profit: 1800 },
  { day: 'Sun', profit: 1400 },
];

export function ProfitChart({ data = defaultData }: ProfitChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Profit']}
          />
          <Line 
            type="monotone" 
            dataKey="profit" 
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
