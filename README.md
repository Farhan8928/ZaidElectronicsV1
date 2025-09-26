Zaid Repair Tracker

Modern web app for managing repair jobs, analytics, and one-click WhatsApp report sharing. Split into `client` (React + Vite + Tailwind) and `server` (Node/Express) for easy local development and Vercel deployment.

Project Structure
- client/: React app (Vite), Tailwind, React Query
- server/: Express APIs (WhatsApp integration, Sheets proxy)

Prerequisites
- Node.js 18+
- Google Apps Script Web App URL (with doGet/doPost implemented)
- WhatsApp Web-compatible browser (for first-time QR scan)

Environment Variables
Create `client/.env.local`:
```
VITE_BACKEND_URL=http://localhost:3001
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/xxxx/exec
# Optional: opens the sheet directly from Export page
VITE_GOOGLE_SHEETS_URL=https://docs.google.com/spreadsheets/d/xxxx
```

Install and Run (Dev)
1) Client
```
cd client
npm i
npm run dev
# http://localhost:5000
```

2) Server
```
cd server
npm i
npm run dev
# http://localhost:3001
```

Client Dev Proxy
- The client proxies `/api/whatsapp/*` to `http://localhost:3001` during development.

Key Features
- Robust date normalization (supports YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, Excel serial, ISO strings)
- Apps Script integration (fetch/add/update/delete jobs) via GET/POST
- React Query caching and retry for resilience
- Export to CSV/Excel/PDF with custom date and column selection
- WhatsApp integration with QR flow and status checks
- PIN-gated routes using InputOTP

APIs (Server)

Base URL (dev): `http://localhost:3001`

1) WhatsApp
- GET `/api/whatsapp/qr`
  - Returns: `{ success: boolean, qr?: string }` where `qr` is a `data:image/png;base64,...` URL.
  - Use to display the QR code to link WhatsApp session on first run.

- GET `/api/whatsapp/status`
  - Returns: `{ success: boolean, status: 'loading' | 'ready' | 'disconnected' }`
  - Use to poll readiness before sending messages.

- POST `/api/whatsapp/send`
  - Body (JSON):
    ```
    {
      "to": "+91XXXXXXXXXX", // E.164 or local, server resolves proper chat id
      "message": "string"
    }
    ```
  - Returns: `{ success: boolean, error?: string }`
  - Notes: Wait until `/status` is `ready`. First-time use requires scanning QR from `/qr`.

2) Google Sheets Proxy (Apps Script)
- Design intent: the server exposes `/api/sheets` that forwards requests to your Apps Script Web App to avoid CORS and allow timeouts/retries.
- Common patterns used by the client:

  - GET `/api/sheets?action=getAllJobs&appsScriptUrl=<ENCODED_APPS_SCRIPT_URL>`
    - Returns: `{ success: true, data: GoogleSheetsJob[] }`

  - POST `/api/sheets`
    - Body (JSON):
      ```
      {
        "appsScriptUrl": "https://script.google.com/macros/s/xxxx/exec",
        "action": "addJob" | "updateJob" | "deleteJob",
        "id": "0",             // for update/delete
        "data": {                // for add/update
          "date": "2025-09-06",
          "customerName": "...",
          "mobile": "...",
          "tvModel": "...",
          "workDone": "...",
          "price": 0,
          "partsCost": 0,
          "profit": 0
        }
      }
      ```
    - Returns: `{ success: boolean, data?: any, error?: string }`

Postman Testing Guide

Collection setup tip:
- Set a `baseUrl` variable = `http://localhost:3001`.

1) WhatsApp
- QR
  - Method: GET
  - URL: `{{baseUrl}}/api/whatsapp/qr`
  - Test: Open the `qr` data URL in a browser to confirm it renders a QR image.

- Status
  - Method: GET
  - URL: `{{baseUrl}}/api/whatsapp/status`
  - Expected: `{ success: true, status: 'ready' }` after linking.

- Send Message
  - Method: POST
  - URL: `{{baseUrl}}/api/whatsapp/send`
  - Body (JSON):
    ```
    {
      "to": "+918928040454",
      "message": "Test from Postman"
    }
    ```
  - Expected: `{ success: true }`.

2) Google Sheets via Proxy
- Get All Jobs
  - Method: GET
  - URL: `{{baseUrl}}/api/sheets?action=getAllJobs&appsScriptUrl={{appsScriptUrl}}`
  - Tests: Check that `data` is an array with job rows. Dates will be normalized.

- Add Job
  - Method: POST
  - URL: `{{baseUrl}}/api/sheets`
  - Body (JSON):
    ```
    {
      "appsScriptUrl": "{{appsScriptUrl}}",
      "action": "addJob",
      "data": {
        "date": "2025-09-24",
        "customerName": "Sample",
        "mobile": "9999999999",
        "tvModel": "Samsung 32",
        "workDone": "Panel change",
        "price": 1800,
        "partsCost": 0,
        "profit": 1800
      }
    }
    ```

- Update Job
  - Method: POST
  - URL: `{{baseUrl}}/api/sheets`
  - Body (JSON):
    ```
    {
      "appsScriptUrl": "{{appsScriptUrl}}",
      "action": "updateJob",
      "id": "2",
      "data": {
        "date": "2025-09-24",
        "customerName": "Updated Name",
        "mobile": "9999999999",
        "tvModel": "Thomson 32",
        "workDone": "Resolder",
        "price": 1900,
        "partsCost": 100,
        "profit": 1800
      }
    }
    ```

- Delete Job
  - Method: POST
  - URL: `{{baseUrl}}/api/sheets`
  - Body (JSON):
    ```
    {
      "appsScriptUrl": "{{appsScriptUrl}}",
      "action": "deleteJob",
      "id": "2"
    }
    ```

Client-Side Optimizations
- requestWithRetry: exponential backoff and timeouts on network calls
- React Query caching: reduces repeated requests and smooths UI
- Date normalization: consistent `YYYY-MM-DD` to avoid timezone shifts
- Local state after mutations followed by full reload on success (ensures UI consistency even on slow networks)

Server-Side Reliability (WhatsApp)
- QR and status endpoints are safe even if the client is still initializing
- Login readiness checks to avoid “WAPI not ready” errors
- Number resolution and stabilization delays before sending
- Persistent sessions using local auth to avoid frequent rescans

Deployment (Vercel)
- Client: Deploy `client/` as a Vite static front-end
- Server: Deploy `server/` as a Node server or convert to Vercel serverless functions
  - Ensure routes are mounted at `/api/whatsapp` (and `/api/sheets` if used)
  - Set environment variables in Vercel for Apps Script URL(s)

Notes & Troubleshooting
- If WhatsApp send returns 404 in dev, ensure the server is running on `http://localhost:3001` and the client proxy is active
- If Apps Script responds “Invalid action”, redeploy the script ensuring `doGet`/`doPost` include all actions (getAllJobs, addJob, updateJob, deleteJob)
- If styles don’t load, confirm `client/index.html` includes the stylesheet and Tailwind configs are `.cjs`

License
MIT


