import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { googleSheetsService } from "@/lib/googleSheets";
import { ProfitChart } from "@/components/charts/ProfitChart";
import { MonthlyRevenueChart } from "@/components/charts/MonthlyRevenueChart";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Reports() {
  const [activeReport, setActiveReport] = useState("daily");
  const [selectedMonth, setSelectedMonth] = useState("2024-01");

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: () => googleSheetsService.getAllJobs(),
  });

  // Calculate today's stats
  const today = new Date().toISOString().split('T')[0];
  const todayJobs = jobs.filter(job => job.date === today);
  const todayStats = {
    jobs: todayJobs.length,
    revenue: todayJobs.reduce((sum, job) => sum + job.price, 0),
    partsCost: todayJobs.reduce((sum, job) => sum + (job.partsCost || 0), 0),
    profit: todayJobs.reduce((sum, job) => sum + job.profit, 0),
  };

  // Calculate weekly stats for selected month
  const getWeeklyStats = (month: string) => {
    const monthJobs = jobs.filter(job => job.date.startsWith(month));
    
    // Group by week
    const weeks = new Map();
    monthJobs.forEach(job => {
      const date = new Date(job.date);
      const weekNumber = Math.ceil(date.getDate() / 7);
      const weekKey = `Week ${weekNumber}`;
      
      if (!weeks.has(weekKey)) {
        weeks.set(weekKey, { jobs: 0, revenue: 0, partsCost: 0, profit: 0 });
      }
      
      const week = weeks.get(weekKey);
      week.jobs += 1;
      week.revenue += job.price;
      week.partsCost += job.partsCost || 0;
      week.profit += job.profit;
    });
    
    return Array.from(weeks.entries()).map(([week, stats]) => ({
      week,
      ...stats,
      margin: stats.revenue > 0 ? Math.round((stats.profit / stats.revenue) * 100) : 0
    }));
  };

  const weeklyStats = getWeeklyStats(selectedMonth);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="title-reports">Reports & Analytics</h1>
        <p className="text-muted-foreground">Track your business performance with detailed reports.</p>
      </div>

      {/* Report Type Selector */}
      <div className="bg-card rounded-lg border border-border p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeReport === "daily" ? "default" : "secondary"}
            onClick={() => setActiveReport("daily")}
            data-testid="button-daily-report"
          >
            Daily Summary
          </Button>
          <Button
            variant={activeReport === "monthly" ? "default" : "secondary"}
            onClick={() => setActiveReport("monthly")}
            data-testid="button-monthly-report"
          >
            Monthly Report
          </Button>
          <Button
            variant={activeReport === "yearly" ? "default" : "secondary"}
            onClick={() => setActiveReport("yearly")}
            data-testid="button-yearly-report"
          >
            Yearly Report
          </Button>
        </div>
      </div>

      {/* Daily Summary Report */}
      {activeReport === "daily" && (
        <div className="space-y-6" data-testid="daily-report-content">
          {/* Today's Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary" data-testid="today-jobs">
                  {todayStats.jobs}
                </p>
                <p className="text-sm text-muted-foreground">Jobs Today</p>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600" data-testid="today-revenue">
                  ₹{todayStats.revenue.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600" data-testid="today-parts-cost">
                  ₹{todayStats.partsCost.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Parts Cost</p>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600" data-testid="today-profit">
                  ₹{todayStats.profit.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Net Profit</p>
              </div>
            </div>
          </div>

          {/* Today's Jobs List */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Today's Jobs</h3>
            <div className="space-y-3">
              {todayJobs.length > 0 ? (
                todayJobs.map((job, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium">{job.customerName}</p>
                      <p className="text-sm text-muted-foreground">{job.tvModel} - {job.workDone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{job.price.toLocaleString()}</p>
                      <p className="text-sm text-green-600">Profit: ₹{job.profit.toLocaleString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No jobs completed today</p>
              )}
            </div>
          </div>
          
          {/* Weekly Profit Chart */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Profit Trend</h3>
            <ProfitChart />
          </div>
        </div>
      )}

      {/* Monthly Report */}
      {activeReport === "monthly" && (
        <div className="space-y-6" data-testid="monthly-report-content">
          {/* Month Selector */}
          <div className="flex items-center space-x-4 mb-6">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-01">January 2024</SelectItem>
                <SelectItem value="2023-12">December 2023</SelectItem>
                <SelectItem value="2023-11">November 2023</SelectItem>
              </SelectContent>
            </Select>
            <Button data-testid="button-generate-monthly-report">
              Generate Report
            </Button>
          </div>

          {/* Monthly Chart */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Profit/Loss Trend</h3>
            <MonthlyRevenueChart />
          </div>

          {/* Monthly Summary Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Week</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Jobs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Parts Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Profit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {weeklyStats.map((week, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-medium">{week.week}</td>
                      <td className="px-6 py-4 text-sm">{week.jobs}</td>
                      <td className="px-6 py-4 text-sm">₹{week.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">₹{week.partsCost.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-green-600">₹{week.profit.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">{week.margin}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Yearly Report */}
      {activeReport === "yearly" && (
        <div className="space-y-6" data-testid="yearly-report-content">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold mb-4">Coming Soon</h3>
            <p className="text-muted-foreground">Yearly reports will be available soon with comprehensive analytics.</p>
          </div>
        </div>
      )}
    </div>
  );
}
