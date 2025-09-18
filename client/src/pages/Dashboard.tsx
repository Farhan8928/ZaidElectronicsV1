import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { googleSheetsService } from "@/lib/googleSheets";
import { useJobContext } from "@/contexts/JobContext";
import { DashboardStats } from "@/components/DashboardStats";
import { MonthlyRevenueChart } from "@/components/charts/MonthlyRevenueChart";
import { Button } from "@/components/ui/button";
import { Plus, Download, FileText } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { state, dispatch } = useJobContext();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: () => googleSheetsService.getDashboardStats(),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: recentJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/jobs', 'recent'],
    queryFn: async () => {
      const allJobs = await googleSheetsService.getAllJobs();
      return allJobs.slice(0, 5); // Get 5 most recent jobs
    },
    refetchInterval: 300000,
  });

  useEffect(() => {
    if (stats) {
      dispatch({ type: "SET_STATS", payload: stats });
    }
  }, [stats, dispatch]);

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-16 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="title-dashboard">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-8">
          <DashboardStats stats={stats} />
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Revenue Chart */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Revenue Trend</h3>
          <MonthlyRevenueChart />
        </div>

        {/* Recent Jobs */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Jobs</h3>
          <div className="space-y-4">
            {jobsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : recentJobs && recentJobs.length > 0 ? (
              recentJobs.map((job, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                  data-testid={`recent-job-${index}`}
                >
                  <div>
                    <p className="font-medium" data-testid={`recent-job-customer-${index}`}>
                      {job.customerName}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`recent-job-tv-model-${index}`}>
                      {job.tvModel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium" data-testid={`recent-job-price-${index}`}>
                      ₹{job.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`recent-job-date-${index}`}>
                      {job.date}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No recent jobs found</p>
              </div>
            )}
          </div>
          <Link href="/jobs">
            <Button variant="ghost" className="w-full mt-4" data-testid="button-view-all-jobs">
              View All Jobs →
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/add-job">
            <Button className="w-full" data-testid="button-add-new-job">
              <Plus className="h-4 w-4 mr-2" />
              Add New Job
            </Button>
          </Link>
          <Link href="/export">
            <Button variant="secondary" className="w-full" data-testid="button-export-data">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline" className="w-full" data-testid="button-generate-report">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
