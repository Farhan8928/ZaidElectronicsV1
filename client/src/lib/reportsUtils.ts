import { GoogleSheetsJob } from "@shared/schema";

export interface DailyStats {
  date: string;
  revenue: number;
  profit: number;
  jobs: number;
  partsCost: number;
  margin: number;
}

export interface MonthlyStats {
  month: string;
  revenue: number;
  profit: number;
  jobs: number;
  partsCost: number;
  margin: number;
  dailyAverage: number;
}

export interface YearlyStats {
  year: string;
  revenue: number;
  profit: number;
  jobs: number;
  partsCost: number;
  margin: number;
  monthlyAverage: number;
}

export interface CategoryStats {
  category: string;
  value: number;
  count: number;
  averageValue: number;
}

export class ReportsUtils {
  static getDailyStats(jobs: GoogleSheetsJob[], days: number = 30): DailyStats[] {
    const statsMap = new Map<string, DailyStats>();
    
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
    
    // Initialize last N days
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      statsMap.set(dateStr, {
        date: dateStr,
        revenue: 0,
        profit: 0,
        jobs: 0,
        partsCost: 0,
        margin: 0
      });
    }
    
    // Process jobs
    jobs.forEach(job => {
      const normalizedDate = normalizeDate(job.date);
      if (statsMap.has(normalizedDate)) {
        const stats = statsMap.get(normalizedDate)!;
        stats.jobs += 1;
        stats.revenue += job.price;
        stats.partsCost += job.partsCost || 0;
        stats.profit += job.profit;
        stats.margin = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0;
      }
    });
    
    return Array.from(statsMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }
  
  static getMonthlyStats(jobs: GoogleSheetsJob[]): MonthlyStats[] {
    const statsMap = new Map<string, MonthlyStats>();
    
    jobs.forEach(job => {
      const date = new Date(job.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!statsMap.has(monthKey)) {
        statsMap.set(monthKey, {
          month: monthKey,
          revenue: 0,
          profit: 0,
          jobs: 0,
          partsCost: 0,
          margin: 0,
          dailyAverage: 0
        });
      }
      
      const stats = statsMap.get(monthKey)!;
      stats.jobs += 1;
      stats.revenue += job.price;
      stats.partsCost += job.partsCost || 0;
      stats.profit += job.profit;
    });
    
    // Calculate margins and averages
    statsMap.forEach(stats => {
      stats.margin = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0;
      
      // Calculate daily average for the month
      const daysInMonth = new Date(parseInt(stats.month.split('-')[0]), parseInt(stats.month.split('-')[1]), 0).getDate();
      stats.dailyAverage = stats.revenue / daysInMonth;
    });
    
    return Array.from(statsMap.values()).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }
  
  static getYearlyStats(jobs: GoogleSheetsJob[]): YearlyStats[] {
    const statsMap = new Map<string, YearlyStats>();
    
    jobs.forEach(job => {
      const date = new Date(job.date);
      const yearKey = date.getFullYear().toString();
      
      if (!statsMap.has(yearKey)) {
        statsMap.set(yearKey, {
          year: yearKey,
          revenue: 0,
          profit: 0,
          jobs: 0,
          partsCost: 0,
          margin: 0,
          monthlyAverage: 0
        });
      }
      
      const stats = statsMap.get(yearKey)!;
      stats.jobs += 1;
      stats.revenue += job.price;
      stats.partsCost += job.partsCost || 0;
      stats.profit += job.profit;
    });
    
    // Calculate margins and averages
    statsMap.forEach(stats => {
      stats.margin = stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0;
      stats.monthlyAverage = stats.revenue / 12; // Approximate monthly average
    });
    
    return Array.from(statsMap.values()).sort((a, b) => 
      parseInt(a.year) - parseInt(b.year)
    );
  }
  
  static getCategoryStats(jobs: GoogleSheetsJob[]): CategoryStats[] {
    const categoryMap = new Map<string, CategoryStats>();
    
    jobs.forEach(job => {
      // Use TV model as category for now, you can change this logic
      const category = job.tvModel.split(' ')[0] || 'Other'; // Get brand name
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          value: 0,
          count: 0,
          averageValue: 0
        });
      }
      
      const stats = categoryMap.get(category)!;
      stats.count += 1;
      stats.value += job.price;
    });
    
    // Calculate averages
    categoryMap.forEach(stats => {
      stats.averageValue = stats.value / stats.count;
    });
    
    return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value);
  }
  
  static getTodayStats(jobs: GoogleSheetsJob[]): DailyStats {
    const today = new Date().toISOString().split('T')[0];
    
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
    
    const todayJobs = jobs.filter(job => normalizeDate(job.date) === today);
    
    const revenue = todayJobs.reduce((sum, job) => sum + job.price, 0);
    const partsCost = todayJobs.reduce((sum, job) => sum + (job.partsCost || 0), 0);
    const profit = todayJobs.reduce((sum, job) => sum + job.profit, 0);
    
    return {
      date: today,
      revenue,
      profit,
      jobs: todayJobs.length,
      partsCost,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0
    };
  }
  
  static getWeeklyStats(jobs: GoogleSheetsJob[], month: string): Array<{
    week: string;
    jobs: number;
    revenue: number;
    partsCost: number;
    profit: number;
    margin: number;
  }> {
    const monthJobs = jobs.filter(job => job.date.startsWith(month));
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
  }
  
  static formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  
  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
  
  static getMonthName(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
}
