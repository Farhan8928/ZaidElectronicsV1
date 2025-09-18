import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Since we're using Google Sheets as the backend, we don't need Express API routes
  // All data operations will go directly to Google Sheets via the frontend
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Zaid Electronics Job Management Portal' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
