# Quick Start Guide - Connect to Your Google Sheet

## Current Status
Your Express server is working perfectly, but it's currently using in-memory storage (data disappears when server restarts). To connect to your actual Google Sheet, follow these steps:

## Option 1: Quick Test (No Authentication Required)
For immediate testing, the server will work with in-memory storage. Your data will be stored temporarily and you can test all features.

## Option 2: Connect to Real Google Sheet (Recommended)

### Step 1: Get Service Account Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create a service account and download the JSON key file

### Step 2: Share Your Sheet
1. Open your sheet: https://docs.google.com/spreadsheets/d/1HzF3Cqc7VCH3aYC_SX5xNrg7iPFYycHhfbaDBto0A98/edit
2. Click "Share"
3. Add the service account email (from JSON file)
4. Give it "Editor" permissions

### Step 3: Set Environment Variables
Create a `.env` file in your project root:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1HzF3Cqc7VCH3aYC_SX5xNrg7iPFYycHhfbaDBto0A98
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
GOOGLE_PROJECT_ID=your-project-id
```

### Step 4: Restart Server
```bash
npm run server
```

## Testing Your Setup

### 1. Start the Server
```bash
npm run server
```

### 2. Start the Frontend
```bash
npm run dev
```

### 3. Test Adding a Job
1. Open http://localhost:5000
2. Add a new job
3. Check your Google Sheet - the data should appear!

## Troubleshooting

### Server Shows "Using fallback mode"
- This means no service account credentials were found
- Check your `.env` file
- Make sure the service account has access to your sheet

### "Permission denied" errors
- Make sure you shared the sheet with the service account email
- Check that the service account has "Editor" permissions

### Data not appearing in sheet
- Check the server console for error messages
- Verify the spreadsheet ID is correct
- Make sure the sheet has the correct headers in row 1

## Current Features Working
✅ Add jobs  
✅ View all jobs  
✅ Update jobs  
✅ Delete jobs  
✅ Dashboard statistics  
✅ Export to CSV  
✅ CORS issues resolved  

## Your Sheet Structure
Your sheet should have these headers in row 1:
- Date
- CustomerName  
- Mobile
- TVModel
- WorkDone
- Price
- PartsCost
- Profit

The server will automatically add data starting from row 2.

