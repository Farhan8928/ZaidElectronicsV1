import { GoogleSheetsJob, DashboardStats } from "@/types/schema";

// Constants
const USE_LOCAL_STORAGE = false; // Online mode: use Google Apps Script via Express proxy

// Use the Google Apps Script URL
const GOOGLE_APPS_SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxpJW_HjuWWbblj8ClRA34F8ENHuB8aw5BqoloDiQRbVb2Cl8SovQSqbNL5RIINACO84w/exec';

// Use Express server as proxy to avoid CORS issues
const EXPRESS_PROXY_URL = import.meta.env.VITE_EXPRESS_PROXY_URL || 'http://localhost:3001/api/sheets';

// Request cache for optimization
const requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Request optimization with caching
async function optimizedRequest(url: string, options?: RequestInit): Promise<Response> {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const cached = requestCache.get(cacheKey);
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return new Response(JSON.stringify(cached.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Use regular fetch for Express proxy
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    // Clone the response so we can read it for caching without consuming the original
    const responseClone = response.clone();
    
    if (response.ok) {
      try {
        const data = await responseClone.json();
        // Cache successful responses
        requestCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: CACHE_TTL
        });
      } catch (cacheError) {
        console.warn('Failed to cache response:', cacheError);
      }
    }
    
    return response;
  } catch (error) {
    // Return cached data on error if available
    if (cached) {
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    throw error;
  }
}

// Robust network request with retry and timeout (for unreliable connections)
async function requestWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  timeoutMs = 12000
): Promise<Response> {
  let attempt = 0;
  let lastError: any;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);
      return resp;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      attempt += 1;
      if (attempt > retries) break;
      // Exponential backoff: 0.5s, 1s, 2s
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
    }
  }
  throw lastError || new Error('Network request failed');
}

// JSONP is no longer needed since we're using Express proxy

export class GoogleSheetsService {
  private apiUrl: string;
  private proxyUrl: string;
  private useLocalStorage: boolean;

  constructor() {
    this.useLocalStorage = USE_LOCAL_STORAGE;
    this.apiUrl = GOOGLE_APPS_SCRIPT_URL;
    this.proxyUrl = EXPRESS_PROXY_URL;
    
    // Debug log to see what's happening
    console.log('Google Apps Script URL:', this.apiUrl);
    console.log('Express Proxy URL:', this.proxyUrl);
    console.log('Using localStorage:', this.useLocalStorage);
    
    if (this.useLocalStorage) {
      console.warn("Using localStorage for data storage. API calls will be simulated locally.");
    } else {
      console.log('Using Google Apps Script API via Express proxy');
    }
  }
  

  async addJob(job: GoogleSheetsJob): Promise<void> {
    if (this.useLocalStorage) {
      console.log('Using localStorage fallback');
      return this.addJobToLocalStorage(job);
    }

    try {
      console.log('Sending request to Google Apps Script via Express proxy:', this.proxyUrl);
      console.log('Job data:', job);

      // Use Express proxy to avoid CORS issues
      const response = await requestWithRetry(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'addJob',
          data: job,
          appsScriptUrl: this.apiUrl
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`Failed to add job: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Response result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add job');
      }
      
      console.log('Job successfully added via Google Apps Script!');
    } catch (error) {
      console.error('Error adding job via Google Apps Script:', error);
      throw new Error(`Failed to add job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllJobs(): Promise<GoogleSheetsJob[]> {
    const normalizeDate = (raw: any): string => {
      try {
        if (!raw) return '';
        const str = String(raw).trim();
        // Already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
        // DD-MM-YYYY -> YYYY-MM-DD
        const dmy = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (dmy) {
          const [, d, m, y] = dmy;
          return `${y}-${m}-${d}`;
        }
        // DD/MM/YYYY -> YYYY-MM-DD
        const dmySlash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dmySlash) {
          const d = dmySlash[1].padStart(2, '0');
          const m = dmySlash[2].padStart(2, '0');
          const y = dmySlash[3];
          return `${y}-${m}-${d}`;
        }
        // Excel serial (number)
        const asNum = Number(str);
        if (!Number.isNaN(asNum) && /^(\d+)(\.0+)?$/.test(str)) {
          // Excel serial start 1899-12-30
          const epoch = new Date(Date.UTC(1899, 11, 30));
          const ms = asNum * 86400000;
          const d = new Date(epoch.getTime() + ms);
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, '0');
          const da = String(d.getUTCDate()).padStart(2, '0');
          return `${y}-${m}-${da}`;
        }
        // ISO with time -> take date part
        if (str.includes('T')) return str.split('T')[0];
        // Fallback: try Date parsing (local)
        const d = new Date(str);
        if (!Number.isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const da = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${da}`;
        }
        return str;
      } catch {
        return String(raw);
      }
    };
    // Always try localStorage first as a fallback
    const localJobs = await this.getAllJobsFromLocalStorage();
    
    if (this.useLocalStorage) {
      console.log('Using localStorage for jobs');
      return (localJobs as GoogleSheetsJob[]).map(j => ({ ...j, date: normalizeDate((j as any).date) }));
    }

    try {
      const url = `${this.proxyUrl}?action=getAllJobs&appsScriptUrl=${encodeURIComponent(this.apiUrl)}`;
      console.log('Fetching jobs from Google Apps Script via Express proxy:', url);
      
      const response = await optimizedRequest(url);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Response result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch jobs');
      }

      const data = (result.data || []) as GoogleSheetsJob[];
      // Normalize date strings from Sheets to consistent YYYY-MM-DD for UI correctness
      return data.map((j) => ({ ...j, date: normalizeDate((j as any).date) }));
    } catch (error) {
      console.error('Error fetching jobs from Google Apps Script:', error);
      
      // Fall back to localStorage if API fails
      console.warn('Falling back to localStorage for jobs due to API error');
      return (localJobs as GoogleSheetsJob[]).map(j => ({ ...j, date: normalizeDate((j as any).date) }));
    }
  }

  async updateJob(id: string, job: Partial<GoogleSheetsJob>): Promise<void> {
    if (this.useLocalStorage) {
      return this.updateJobInLocalStorage(id, job);
    }

    try {
      console.log('Updating job via Express proxy -> Google Apps Script:', this.proxyUrl);
      console.log('Job ID:', id, 'Job data:', job);

      const response = await requestWithRetry(this.proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateJob',
          id,
          data: job,
          appsScriptUrl: this.apiUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update job: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update job');
      }
      
      console.log('Job successfully updated via Google Apps Script!');
    } catch (error) {
      console.error('Error updating job via Google Apps Script:', error);
      throw new Error('Failed to update job via Google Apps Script. Please check your connection.');
    }
  }

  async deleteJob(id: string): Promise<void> {
    if (this.useLocalStorage) {
      return this.deleteJobFromLocalStorage(id);
    }

    try {
      console.log('Deleting job via Express proxy -> Google Apps Script:', this.proxyUrl);
      console.log('Job ID:', id);

      const response = await requestWithRetry(this.proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteJob',
          id,
          appsScriptUrl: this.apiUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to delete job: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete job');
      }
      
      console.log('Job successfully deleted via Google Apps Script!');
    } catch (error) {
      console.error('Error deleting job via Google Apps Script:', error);
      throw new Error('Failed to delete job via Google Apps Script. Please check your connection.');
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
    if (this.useLocalStorage) {
      return this.exportLocalStorageToCSV();
    }

    try {
      const response = await fetch(`${this.apiUrl}?action=exportCSV`, {
        headers: {
          'Accept': 'text/plain'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to export CSV: ${response.statusText}`);
      }

      const csvData = await response.text();
      return csvData;
    } catch (error) {
      console.error('Error exporting CSV via Google Apps Script:', error);
      throw new Error('Failed to export CSV via Google Apps Script. Please check your connection.');
    }
  }
  // LocalStorage fallback methods for development
  private addJobToLocalStorage(job: GoogleSheetsJob): Promise<void> {
    const jobs = this.getJobsFromStorage();
    const newJob = { ...job, id: crypto.randomUUID() };
    jobs.push(newJob);
    localStorage.setItem('zaid-electronics-jobs', JSON.stringify(jobs));
    return Promise.resolve();
  }

  private getAllJobsFromLocalStorage(): Promise<GoogleSheetsJob[]> {
    const jobs = this.getJobsFromStorage();
    // Return sorted copy without mutating original array
    const sortedJobs = [...jobs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    // Remove id field to match GoogleSheetsJob type
    return Promise.resolve(sortedJobs.map(({ id, ...job }) => job));
  }

  private updateJobInLocalStorage(id: string, updatedJob: Partial<GoogleSheetsJob>): Promise<void> {
    const jobs = this.getJobsFromStorage();
    
    // Try to find by ID first, fallback to index for backwards compatibility
    let jobIndex = jobs.findIndex(j => j.id === id);
    
    if (jobIndex === -1) {
      // Fallback: try treating id as array index for backwards compatibility
      const indexId = parseInt(id);
      if (!isNaN(indexId) && indexId >= 0 && indexId < jobs.length) {
        jobIndex = indexId;
      }
    }
    
    if (jobIndex >= 0 && jobIndex < jobs.length) {
      jobs[jobIndex] = { ...jobs[jobIndex], ...updatedJob };
      localStorage.setItem('zaid-electronics-jobs', JSON.stringify(jobs));
    } else {
      throw new Error('Job not found');
    }
    return Promise.resolve();
  }

  private deleteJobFromLocalStorage(id: string): Promise<void> {
    const jobs = this.getJobsFromStorage();
    
    // Try to find by ID first, fallback to index for backwards compatibility
    let jobIndex = jobs.findIndex(j => j.id === id);
    
    if (jobIndex === -1) {
      // Fallback: try treating id as array index for backwards compatibility  
      const indexId = parseInt(id);
      if (!isNaN(indexId) && indexId >= 0 && indexId < jobs.length) {
        jobIndex = indexId;
      }
    }
    
    if (jobIndex >= 0 && jobIndex < jobs.length) {
      jobs.splice(jobIndex, 1);
      localStorage.setItem('zaid-electronics-jobs', JSON.stringify(jobs));
    } else {
      throw new Error('Job not found');
    }
    return Promise.resolve();
  }

  private exportLocalStorageToCSV(): Promise<string> {
    const jobs = this.getJobsFromStorage();
    const headers = ['Date', 'Customer Name', 'Mobile', 'TV Model', 'Work Done', 'Price', 'Parts Cost', 'Profit'];
    const csvRows = [headers.join(',')];
    
    jobs.forEach(job => {
      const row = [
        job.date,
        `"${job.customerName}"`,
        job.mobile,
        `"${job.tvModel}"`,
        `"${job.workDone}"`,
        job.price,
        job.partsCost || 0,
        job.profit
      ];
      csvRows.push(row.join(','));
    });
    
    return Promise.resolve(csvRows.join('\n'));
  }

  private getJobsFromStorage(): (GoogleSheetsJob & { id: string })[] {
    const stored = localStorage.getItem('zaid-electronics-jobs');
    return stored ? JSON.parse(stored) : [];
  }

  // Method to clear request cache
  clearCache(): void {
    requestCache.clear();
    console.log('Request cache cleared');
  }
}

export const googleSheetsService = new GoogleSheetsService();
