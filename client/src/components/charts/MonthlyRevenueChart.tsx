import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyRevenueChartProps {
  data?: Array<{
    month: string;
    revenue: number;
    partsCost: number;
    profit: number;
  }>;
}

const defaultData = [
  { month: 'Jan', revenue: 12800, partsCost: 3200, profit: 9600 },
  { month: 'Feb', revenue: 11200, partsCost: 2800, profit: 8400 },
  { month: 'Mar', revenue: 15600, partsCost: 4200, profit: 11400 },
  { month: 'Apr', revenue: 13800, partsCost: 3600, profit: 10200 },
  { month: 'May', revenue: 16400, partsCost: 4400, profit: 12000 },
  { month: 'Jun', revenue: 18200, partsCost: 4800, profit: 13400 },
];

export function MonthlyRevenueChart({ data = defaultData }: MonthlyRevenueChartProps) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(0,0,0,0.06)' }}
            contentStyle={{
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
              color: '#F9FAFB',
              padding: 12
            }}
            labelStyle={{ color: '#F9FAFB', fontWeight: 700 }}
            itemStyle={{ color: '#F9FAFB', fontWeight: 600 }}
            formatter={(value: number, name: string) => {
              const label = name === 'profit' || name === 'Profit' ? 'Profit' : name;
              return [`₹${value.toLocaleString()}`, label];
            }}
          />
          <Legend />
          <Bar dataKey="revenue" fill="#2563eb" name="Revenue" radius={[4, 4, 0, 0]} />
          <Bar dataKey="partsCost" fill="#d97706" name="Parts Cost" radius={[4, 4, 0, 0]} />
          <Bar dataKey="profit" fill="#059669" name="Profit" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
