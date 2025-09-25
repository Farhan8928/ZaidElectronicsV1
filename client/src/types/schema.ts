import { z } from "zod";

export interface GoogleSheetsJob {
  date: string;
  customerName: string;
  mobile: string | number;
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

// Validation schema used by react-hook-form zodResolver
export const insertJobSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, "Use format YYYY-MM-DD"),
  customerName: z.string().min(1, "Required"),
  mobile: z
    .union([
      z
        .string()
        .transform((v) => v.trim())
        .refine((v) => v.length > 0, "Required"),
      z.number().transform((n) => String(n)),
    ])
    .transform((v) => (typeof v === "number" ? String(v) : v)),
  tvModel: z.string().min(1, "Required"),
  workDone: z.string().min(1, "Required"),
  price: z
    .number({ invalid_type_error: "Must be a number" })
    .finite()
    .nonnegative(),
  partsCost: z
    .number({ invalid_type_error: "Must be a number" })
    .finite()
    .nonnegative()
    .optional()
    .default(0),
  profit: z
    .number({ invalid_type_error: "Must be a number" })
    .finite(),
});

export type InsertJobInput = z.infer<typeof insertJobSchema>;



