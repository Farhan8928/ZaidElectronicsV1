# Google Sheets API Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

## Step 2: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the details:
   - Service account name: `zaid-repair-tracker`
   - Service account ID: `zaid-repair-tracker`
   - Description: `Service account for Zaid Repair Tracker`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

## Step 3: Create Service Account Key

1. In the Credentials page, find your service account
2. Click on the service account email
3. Go to "Keys" tab
4. Click "Add Key" > "Create new key"
5. Choose "JSON" format
6. Download the JSON file
7. **IMPORTANT**: Keep this file secure and never commit it to version control

## Step 4: Share Your Google Sheet

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1HzF3Cqc7VCH3aYC_SX5xNrg7iPFYycHhfbaDBto0A98/edit
2. Click "Share" button
3. Add the service account email (from the JSON file, field: `client_email`)
4. Give it "Editor" permissions
5. Click "Send"

## Step 5: Configure Environment Variables

Create a `.env` file in your project root with:

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1HzF3Cqc7VCH3aYC_SX5xNrg7iPFYycHhfbaDBto0A98
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
GOOGLE_PROJECT_ID=your-project-id
```

## Step 6: Update Server Configuration

The server will automatically use these environment variables to authenticate with Google Sheets API.

## Security Notes

- Never commit the service account JSON file to version control
- Add `.env` to your `.gitignore` file
- The service account has access only to the specific sheet you shared
- You can revoke access anytime by removing the service account from the sheet's sharing settings

