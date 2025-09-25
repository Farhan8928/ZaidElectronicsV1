import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { googleSheetsService } from "@/lib/googleSheets";
import { DailyRevenueChart } from "@/components/charts/DailyRevenueChart";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import { YearlyAnalyticsChart } from "@/components/charts/YearlyAnalyticsChart";
import { ProfitMarginChart } from "@/components/charts/ProfitMarginChart";
import { ReportsUtils } from "@/lib/reportsUtils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Target } from "lucide-react";

export default function Reports() {
  const [activeReport, setActiveReport] = useState("daily");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: () => googleSheetsService.getAllJobs(),
  });

  // Calculate all stats using ReportsUtils
  const todayStats = useMemo(() => ReportsUtils.getTodayStats(jobs), [jobs]);
  const dailyStats = useMemo(() => ReportsUtils.getDailyStats(jobs, 30), [jobs]);
  const monthlyStats = useMemo(() => ReportsUtils.getMonthlyStats(jobs), [jobs]);
  const yearlyStats = useMemo(() => ReportsUtils.getYearlyStats(jobs), [jobs]);
  const categoryStats = useMemo(() => ReportsUtils.getCategoryStats(jobs), [jobs]);
  const weeklyStats = useMemo(() => ReportsUtils.getWeeklyStats(jobs, selectedMonth), [jobs, selectedMonth]);

  // Get today's date for display
  const todayDate = new Date().toISOString().split('T')[0];
  
  // Get recent jobs (last 5 days) for context
  const recentJobs = useMemo(() => {
    // Helper function to normalize date (handle both YYYY-MM-DD and full timestamps)
    const normalizeDate = (dateStr: string): string => {
      try {
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
        }
        // If it's a full timestamp, convert to local date
        const date = new Date(dateStr);
        // Use local date instead of UTC to handle timezone differences
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return dateStr; // Return original if parsing fails
      }
    };

    const recentDays = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayJobs = jobs.filter(job => normalizeDate(job.date) === dateStr);
      if (dayJobs.length > 0) {
        recentDays.push({
          date: dateStr,
          jobs: dayJobs,
          total: dayJobs.reduce((sum, job) => sum + job.price, 0)
        });
      }
    }
    return recentDays;
  }, [jobs]);

  // Get available months for selector
  const availableMonths = useMemo(() => {
    const months = monthlyStats.map(stat => stat.month);
    return months.length > 0 ? months : [selectedMonth];
  }, [monthlyStats, selectedMonth]);

  // Selected month aggregate for KPI cards
  const selectedMonthStats = useMemo(() => {
    const stat = monthlyStats.find(s => s.month === selectedMonth);
    return stat ?? { month: selectedMonth, revenue: 0, partsCost: 0, profit: 0, jobs: 0, margin: 0 } as any;
  }, [monthlyStats, selectedMonth]);

  // Calculate trends
  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const dailyTrend = dailyStats.length > 1 
    ? getTrend(dailyStats[dailyStats.length - 1].revenue, dailyStats[dailyStats.length - 2].revenue)
    : 0;

  const monthlyTrend = monthlyStats.length > 1
    ? getTrend(monthlyStats[monthlyStats.length - 1].revenue, monthlyStats[monthlyStats.length - 2].revenue)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="title-reports">📊 Reports & Analytics</h1>
        <p className="text-muted-foreground">Track your business performance with comprehensive insights and beautiful visualizations.</p>
      </div>

      {/* Report Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Report Type</CardTitle>
          <CardDescription>Choose the type of report you want to view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeReport === "daily" ? "default" : "outline"}
              onClick={() => setActiveReport("daily")}
              data-testid="button-daily-report"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Daily Summary
            </Button>
            <Button
              variant={activeReport === "monthly" ? "default" : "outline"}
              onClick={() => setActiveReport("monthly")}
              data-testid="button-monthly-report"
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Monthly Report
            </Button>
            <Button
              variant={activeReport === "yearly" ? "default" : "outline"}
              onClick={() => setActiveReport("yearly")}
              data-testid="button-yearly-report"
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Yearly Analytics
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Daily Summary Report */}
      {activeReport === "daily" && (
        <div className="space-y-6" data-testid="daily-report-content">
          {/* Today's Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jobs Today</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="today-jobs">{todayStats.jobs}</div>
                <p className="text-xs text-muted-foreground">
                  {dailyTrend > 0 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +{dailyTrend.toFixed(1)}% from yesterday
                    </span>
                  ) : dailyTrend < 0 ? (
                    <span className="text-red-600 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {dailyTrend.toFixed(1)}% from yesterday
                    </span>
                  ) : (
                    "No change from yesterday"
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="today-revenue">
                  {ReportsUtils.formatCurrency(todayStats.revenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Profit margin: {ReportsUtils.formatPercentage(todayStats.margin)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Parts Cost</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="today-parts-cost">
                  {ReportsUtils.formatCurrency(todayStats.partsCost)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {todayStats.revenue > 0 ? ReportsUtils.formatPercentage((todayStats.partsCost / todayStats.revenue) * 100) : "0%"} of revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="today-profit">
                  {ReportsUtils.formatCurrency(todayStats.profit)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average per job: {ReportsUtils.formatCurrency(todayStats.jobs > 0 ? todayStats.profit / todayStats.jobs : 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>30-Day Revenue & Profit Trend</CardTitle>
              <CardDescription>Track your daily performance over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <DailyRevenueChart data={dailyStats} />
            </CardContent>
          </Card>

          {/* Today's Jobs List (replaces Profit Margin chart) */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Jobs</CardTitle>
              <CardDescription>Jobs added on {todayDate}</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const normalizeDate = (dateStr: string): string => {
                  try {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
                    const d = new Date(dateStr);
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                  } catch {
                    return dateStr;
                  }
                };
                const todays = jobs.filter(j => normalizeDate(j.date) === todayDate);
                if (todays.length === 0) {
                  return (
                    <div className="text-sm text-muted-foreground">No jobs found for today.</div>
                  );
                }
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Customer</th>
                          <th className="text-left py-3 px-4 font-medium">Mobile</th>
                          <th className="text-left py-3 px-4 font-medium">TV Model</th>
                          <th className="text-left py-3 px-4 font-medium">Work Done</th>
                          <th className="text-left py-3 px-4 font-medium">Price</th>
                          <th className="text-left py-3 px-4 font-medium">Parts Cost</th>
                          <th className="text-left py-3 px-4 font-medium">Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todays.map((job, idx) => (
                          <tr key={idx} className="border-b last:border-b-0">
                            <td className="py-3 px-4 font-medium">{job.customerName}</td>
                            <td className="py-3 px-4">{job.mobile}</td>
                            <td className="py-3 px-4">{job.tvModel}</td>
                            <td className="py-3 px-4">{job.workDone}</td>
                            <td className="py-3 px-4">{ReportsUtils.formatCurrency(job.price)}</td>
                            <td className="py-3 px-4">{ReportsUtils.formatCurrency(job.partsCost)}</td>
                            <td className="py-3 px-4 text-green-600 font-medium">{ReportsUtils.formatCurrency(job.profit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Recent Jobs Context removed per request */}
        </div>
      )}

      {/* Monthly Report */}
      {activeReport === "monthly" && (
        <div className="space-y-6" data-testid="monthly-report-content">
          {/* Month Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Analysis</CardTitle>
              <CardDescription>Select a month to view detailed analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(month => (
                      <SelectItem key={month} value={month}>
                        {ReportsUtils.getMonthName(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="flex items-center gap-1">
                  {monthlyTrend > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      +{monthlyTrend.toFixed(1)}% vs last month
                    </>
                  ) : monthlyTrend < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      {monthlyTrend.toFixed(1)}% vs last month
                    </>
                  ) : (
                    "No change from last month"
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trend Chart */}
          {/* Monthly KPI Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary - {ReportsUtils.getMonthName(selectedMonth)}</CardTitle>
              <CardDescription>Overview for the selected month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {ReportsUtils.formatCurrency(selectedMonthStats.revenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Parts cost: {ReportsUtils.formatCurrency(selectedMonthStats.partsCost)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedMonthStats.jobs.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg/job revenue: {ReportsUtils.formatCurrency(selectedMonthStats.jobs > 0 ? selectedMonthStats.revenue / selectedMonthStats.jobs : 0)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Margin</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {ReportsUtils.formatPercentage(selectedMonthStats.margin)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Profit share of revenue
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {ReportsUtils.formatCurrency(selectedMonthStats.profit)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg/job: {ReportsUtils.formatCurrency(selectedMonthStats.jobs > 0 ? selectedMonthStats.profit / selectedMonthStats.jobs : 0)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance Trends</CardTitle>
              <CardDescription>Revenue, profit, and margin trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyTrendChart data={monthlyStats.map(stat => ({
                month: ReportsUtils.getMonthName(stat.month),
                revenue: stat.revenue,
                profit: stat.profit,
                jobs: stat.jobs,
                margin: stat.margin
              }))} />
            </CardContent>
          </Card>

          {/* Weekly Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Breakdown - {ReportsUtils.getMonthName(selectedMonth)}</CardTitle>
              <CardDescription>Detailed weekly performance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Week</th>
                      <th className="text-left py-3 px-4 font-medium">Jobs</th>
                      <th className="text-left py-3 px-4 font-medium">Revenue</th>
                      <th className="text-left py-3 px-4 font-medium">Parts Cost</th>
                      <th className="text-left py-3 px-4 font-medium">Profit</th>
                      <th className="text-left py-3 px-4 font-medium">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyStats.map((week, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="py-3 px-4 font-medium">{week.week}</td>
                        <td className="py-3 px-4">{week.jobs}</td>
                        <td className="py-3 px-4">{ReportsUtils.formatCurrency(week.revenue)}</td>
                        <td className="py-3 px-4">{ReportsUtils.formatCurrency(week.partsCost)}</td>
                        <td className="py-3 px-4 text-green-600 font-medium">{ReportsUtils.formatCurrency(week.profit)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={week.margin >= 50 ? "default" : week.margin >= 30 ? "secondary" : "destructive"}>
                            {ReportsUtils.formatPercentage(week.margin)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Yearly Report */}
      {activeReport === "yearly" && (
        <div className="space-y-6" data-testid="yearly-report-content">
          {/* Yearly Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {ReportsUtils.formatCurrency(yearlyStats.reduce((sum, stat) => sum + stat.revenue, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {yearlyStats.length} year{yearlyStats.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {yearlyStats.reduce((sum, stat) => sum + stat.jobs, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average: {yearlyStats.length > 0 ? Math.round(yearlyStats.reduce((sum, stat) => sum + stat.jobs, 0) / yearlyStats.length) : 0} per year
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Margin</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {yearlyStats.length > 0 ? ReportsUtils.formatPercentage(yearlyStats.reduce((sum, stat) => sum + stat.margin, 0) / yearlyStats.length) : "0%"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Best year: {yearlyStats.length > 0 ? Math.max(...yearlyStats.map(s => s.margin)).toFixed(1) : 0}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {ReportsUtils.formatCurrency(yearlyStats.reduce((sum, stat) => sum + stat.profit, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Monthly average: {ReportsUtils.formatCurrency(yearlyStats.reduce((sum, stat) => sum + stat.monthlyAverage, 0))}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Yearly Analytics Charts */}
          <YearlyAnalyticsChart 
            monthlyData={monthlyStats.map(stat => ({
              month: ReportsUtils.getMonthName(stat.month),
              revenue: stat.revenue,
              partsCost: stat.partsCost,
              profit: stat.profit,
              jobs: stat.jobs
            }))}
            categoryData={categoryStats}
          />

          {/* Yearly Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Yearly Performance Summary</CardTitle>
              <CardDescription>Complete breakdown by year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Year</th>
                      <th className="text-left py-3 px-4 font-medium">Jobs</th>
                      <th className="text-left py-3 px-4 font-medium">Revenue</th>
                      <th className="text-left py-3 px-4 font-medium">Parts Cost</th>
                      <th className="text-left py-3 px-4 font-medium">Profit</th>
                      <th className="text-left py-3 px-4 font-medium">Margin</th>
                      <th className="text-left py-3 px-4 font-medium">Monthly Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyStats.map((year, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="py-3 px-4 font-medium">{year.year}</td>
                        <td className="py-3 px-4">{year.jobs.toLocaleString()}</td>
                        <td className="py-3 px-4">{ReportsUtils.formatCurrency(year.revenue)}</td>
                        <td className="py-3 px-4">{ReportsUtils.formatCurrency(year.partsCost)}</td>
                        <td className="py-3 px-4 text-green-600 font-medium">{ReportsUtils.formatCurrency(year.profit)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={year.margin >= 50 ? "default" : year.margin >= 30 ? "secondary" : "destructive"}>
                            {ReportsUtils.formatPercentage(year.margin)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{ReportsUtils.formatCurrency(year.monthlyAverage)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
