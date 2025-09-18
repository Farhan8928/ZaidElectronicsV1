import { type Job, type GoogleSheetsJob } from "@shared/schema";
import { randomUUID } from "crypto";

// This storage implementation is not used since we use Google Sheets
// but keeping for potential future use or testing

export interface IStorage {
  getJob(id: string): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  createJob(job: GoogleSheetsJob): Promise<Job>;
}

export class MemStorage implements IStorage {
  private jobs: Map<string, Job>;

  constructor() {
    this.jobs = new Map();
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async createJob(jobData: GoogleSheetsJob): Promise<Job> {
    const id = randomUUID();
    const job: Job = { 
      ...jobData, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      partsCost: jobData.partsCost?.toString() || "0",
      price: jobData.price.toString(),
      profit: jobData.profit.toString()
    };
    this.jobs.set(id, job);
    return job;
  }
}

export const storage = new MemStorage();
