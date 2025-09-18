import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  customerName: text("customer_name").notNull(),
  mobile: text("mobile").notNull(),
  tvModel: text("tv_model").notNull(),
  workDone: text("work_done").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  partsCost: decimal("parts_cost", { precision: 10, scale: 2 }).default("0"),
  profit: decimal("profit", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.coerce.number().min(0, "Price must be greater than 0"),
  partsCost: z.coerce.number().min(0).optional(),
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// Google Sheets specific types
export interface GoogleSheetsJob {
  date: string;
  customerName: string;
  mobile: string;
  tvModel: string;
  workDone: string;
  price: number;
  partsCost?: number;
  profit: number;
}

export interface DashboardStats {
  totalJobs: number;
  totalRevenue: number;
  totalPartsCost: number;
  netProfit: number;
}
