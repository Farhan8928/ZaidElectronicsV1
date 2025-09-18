import { GoogleSheetsJob, DashboardStats } from "@shared/schema";

const GOOGLE_SHEETS_API_URL = import.meta.env.VITE_GOOGLE_SHEETS_API_URL || import.meta.env.VITE_SHEETS_API_URL || "";

export class GoogleSheetsService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = GOOGLE_SHEETS_API_URL;
  }

  async addJob(job: GoogleSheetsJob): Promise<void> {
    if (!this.apiUrl) {
      throw new Error("Google Sheets API URL not configured");
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addJob',
          data: job
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add job: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to add job');
      }
    } catch (error) {
      console.error('Error adding job to Google Sheets:', error);
      throw error;
    }
  }

  async getAllJobs(): Promise<GoogleSheetsJob[]> {
    if (!this.apiUrl) {
      throw new Error("Google Sheets API URL not configured");
    }

    try {
      const response = await fetch(`${this.apiUrl}?action=getAllJobs`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch jobs');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error fetching jobs from Google Sheets:', error);
      throw error;
    }
  }

  async updateJob(id: string, job: Partial<GoogleSheetsJob>): Promise<void> {
    if (!this.apiUrl) {
      throw new Error("Google Sheets API URL not configured");
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateJob',
          id,
          data: job
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update job: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update job');
      }
    } catch (error) {
      console.error('Error updating job in Google Sheets:', error);
      throw error;
    }
  }

  async deleteJob(id: string): Promise<void> {
    if (!this.apiUrl) {
      throw new Error("Google Sheets API URL not configured");
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteJob',
          id
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete job: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job from Google Sheets:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const jobs = await this.getAllJobs();
    
    const totalJobs = jobs.length;
    const totalRevenue = jobs.reduce((sum, job) => sum + job.price, 0);
    const totalPartsCost = jobs.reduce((sum, job) => sum + (job.partsCost || 0), 0);
    const netProfit = totalRevenue - totalPartsCost;

    return {
      totalJobs,
      totalRevenue,
      totalPartsCost,
      netProfit
    };
  }

  async exportToCSV(): Promise<string> {
    if (!this.apiUrl) {
      throw new Error("Google Sheets API URL not configured");
    }

    try {
      const response = await fetch(`${this.apiUrl}?action=exportCSV`);
      
      if (!response.ok) {
        throw new Error(`Failed to export CSV: ${response.statusText}`);
      }

      const csvData = await response.text();
      return csvData;
    } catch (error) {
      console.error('Error exporting CSV from Google Sheets:', error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
