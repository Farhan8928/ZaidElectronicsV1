import { Briefcase, DollarSign, Settings, TrendingUp } from "lucide-react";
import { DashboardStats as Stats } from "@shared/schema";

interface DashboardStatsProps {
  stats: Stats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    {
      title: "Total Jobs",
      value: stats.totalJobs.toString(),
      icon: Briefcase,
      bgColor: "bg-blue-100 dark:bg-blue-900",
      iconColor: "text-blue-600 dark:text-blue-400",
      change: "+12%"
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      bgColor: "bg-green-100 dark:bg-green-900",
      iconColor: "text-green-600 dark:text-green-400",
      change: "+18%"
    },
    {
      title: "Parts Cost",
      value: `₹${stats.totalPartsCost.toLocaleString()}`,
      icon: Settings,
      bgColor: "bg-orange-100 dark:bg-orange-900",
      iconColor: "text-orange-600 dark:text-orange-400",
      change: "+8%"
    },
    {
      title: "Net Profit",
      value: `₹${stats.netProfit.toLocaleString()}`,
      icon: TrendingUp,
      bgColor: "bg-purple-100 dark:bg-purple-900",
      iconColor: "text-purple-600 dark:text-purple-400",
      change: "+22%"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="stat-card" data-testid={`stat-${item.title.toLowerCase().replace(' ', '-')}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{item.title}</p>
                <p className="text-2xl font-bold" data-testid={`value-${item.title.toLowerCase().replace(' ', '-')}`}>
                  {item.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`${item.iconColor} h-5 w-5`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 dark:text-green-400 font-medium">{item.change}</span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
