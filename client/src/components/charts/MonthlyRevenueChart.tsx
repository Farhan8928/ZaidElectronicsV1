import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', revenue: 12800, partsCost: 3200, profit: 9600 },
  { month: 'Feb', revenue: 11200, partsCost: 2800, profit: 8400 },
  { month: 'Mar', revenue: 15600, partsCost: 4200, profit: 11400 },
  { month: 'Apr', revenue: 13800, partsCost: 3600, profit: 10200 },
  { month: 'May', revenue: 16400, partsCost: 4400, profit: 12000 },
  { month: 'Jun', revenue: 18200, partsCost: 4800, profit: 13400 },
];

export function MonthlyRevenueChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
          />
          <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
          <Bar dataKey="partsCost" fill="hsl(var(--chart-1))" name="Parts Cost" />
          <Bar dataKey="profit" fill="hsl(var(--chart-2))" name="Profit" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
