# Express Server Setup for Zaid Repair Tracker

## Overview
This project now uses an Express server instead of Google Apps Script to handle Google Sheets integration, which solves CORS issues and provides better control over the API.

## Your Google Sheet
- **Sheet URL**: https://docs.google.com/spreadsheets/d/1HzF3Cqc7VCH3aYC_SX5xNrg7iPFYycHhfbaDBto0A98/edit?usp=sharing
- **Sheet ID**: `1HzF3Cqc7VCH3aYC_SX5xNrg7iPFYycHhfbaDBto0A98`

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Express Server
```bash
npm run server
```
The server will run on `http://localhost:3001`

### 3. Start the Frontend (in a new terminal)
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

### 4. Run Both Together (Optional)
```bash
npm run dev:full
```
This runs both the server and frontend concurrently.

## API Endpoints

### Health Check
- **GET** `/api/health` - Check if server is running

### Google Sheets Operations
- **GET** `/api/sheets?action=getAllJobs` - Get all jobs
- **POST** `/api/sheets` - Add, update, or delete jobs
  - `action: 'addJob'` - Add a new job
  - `action: 'updateJob'` - Update existing job
  - `action: 'deleteJob'` - Delete a job
- **GET** `/api/sheets/dashboard` - Get dashboard statistics
- **GET** `/api/sheets?action=exportCSV` - Export jobs to CSV

## Current Implementation

### Development Mode
The current implementation uses in-memory storage for development purposes. This means:
- Data is stored temporarily in the server's memory
- Data will be lost when the server restarts
- Perfect for testing and development

### Production Setup (Future)
To connect to your actual Google Sheet, you'll need to:

1. **Set up Google Cloud Project**
   - Create a project in Google Cloud Console
   - Enable Google Sheets API
   - Create a service account
   - Download the service account key

2. **Configure Authentication**
   - Add the service account email to your Google Sheet with edit permissions
   - Set up environment variables for the service account credentials

3. **Update the Service**
   - Replace the in-memory storage with actual Google Sheets API calls
   - Implement proper error handling and retry logic

## File Structure
```
server/
├── index.js                 # Main Express server
├── routes/
│   └── googleSheets.js      # API routes for Google Sheets operations
├── services/
│   └── googleSheetsService.js # Business logic for Google Sheets
└── config.js                # Configuration settings
```

## CORS Configuration
The server is configured to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative port)
- `http://localhost:5000` (Preview port)

## Testing
1. Start the Express server: `npm run server`
2. Start the frontend: `npm run dev`
3. Open `http://localhost:5173` in your browser
4. Test adding, viewing, and managing jobs

## Troubleshooting

### Server Won't Start
- Check if port 3001 is available
- Ensure all dependencies are installed: `npm install`

### CORS Errors
- Make sure the Express server is running on port 3001
- Check that the frontend is making requests to `http://localhost:3001/api/sheets`

### Data Not Persisting
- This is expected in development mode
- Data is stored in memory and will be lost on server restart
- For production, implement actual Google Sheets API integration

## Next Steps
1. Test the current setup thoroughly
2. Set up Google Cloud Project and service account
3. Implement actual Google Sheets API integration
4. Add proper error handling and logging
5. Deploy to a hosting service (Heroku, Railway, etc.)

