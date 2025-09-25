import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface YearlyAnalyticsChartProps {
  monthlyData: Array<{
    month: string;
    revenue: number;
    partsCost: number;
    profit: number;
    jobs: number;
  }>;
  categoryData: Array<{
    category: string;
    value: number;
    count: number;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function YearlyAnalyticsChart({ monthlyData, categoryData }: YearlyAnalyticsChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Performance */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                }}
                labelStyle={{ color: '#F9FAFB', fontWeight: 600 }}
                itemStyle={{ color: '#F9FAFB' }}
                formatter={(value: number, name: string) => [
                  `₹${value.toLocaleString()}`,
                  name // use Bar.name so labels are correct
                ]}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#2563eb" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="partsCost" fill="#d97706" name="Parts Cost" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#059669" name="Profit" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Categories */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Service Categories</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#111827',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  color: '#F9FAFB',
                }}
                labelStyle={{ color: '#F9FAFB', fontWeight: 600 }}
                itemStyle={{ color: '#F9FAFB' }}
                formatter={(value: number, name: string, props: any) => [
                  `₹${value.toLocaleString()}`,
                  `${props.payload.category} (${props.payload.count} jobs)`
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

