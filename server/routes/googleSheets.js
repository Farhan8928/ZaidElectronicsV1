import express from 'express';

const router = express.Router();

// Simple CSV parser for fallback from Apps Script exportCSV
function parseCsv(text) {
  const lines = (text || '').split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.replace(/^\"|\"$/g, '').trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    // naive CSV split handling quoted commas
    const cols = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < raw.length; c++) {
      const ch = raw[c];
      if (ch === '"') {
        if (inQuotes && raw[c + 1] === '"') { cur += '"'; c++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        cols.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    const obj = {};
    headers.forEach((h, idx) => {
      const val = (cols[idx] ?? '').replace(/^\"|\"$/g, '');
      obj[h] = val;
    });
    rows.push(obj);
  }
  return rows;
}

// Proxy function to forward requests to Google Apps Script
async function proxyToGoogleAppsScript(appsScriptUrl, action, data = null, id = null) {
  try {
    // For read we can use GET with action param. For write (add/update/delete), prefer POST with JSON body.
    const writeActions = new Set(['addJob','updateJob','deleteJob']);
    if (writeActions.has(action)) {
      console.log('Proxying to Google Apps Script (POST):', appsScriptUrl, action);
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data, id })
      });
      const result = await response.json();
      return {
        success: response.ok && result.success !== false,
        data: result.data ?? result,
        error: response.ok ? (result.error || null) : (result.error || 'Request failed')
      };
    }

    const url = `${appsScriptUrl}?action=${action}`;
    console.log('Proxying to Google Apps Script (GET):', url);
    const response = await fetch(url);
    const result = await response.json();
    
    return {
      success: response.ok,
      data: response.ok ? (result.data?.data || result.data || result) : null,
      error: response.ok ? null : result.error || 'Request failed'
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
}

// GET /api/sheets - Get all jobs or handle specific actions
router.get('/', async (req, res) => {
  try {
    const { action, appsScriptUrl } = req.query;

    if (!appsScriptUrl) {
      return res.status(400).json({
        success: false,
        error: 'Google Apps Script URL is required'
      });
    }

    if (action === 'getAllJobs') {
      const result = await proxyToGoogleAppsScript(appsScriptUrl, 'getAllJobs');
      // If Apps Script returned suspicious dates (all identical), try CSV fallback parsing
      if (result.success && Array.isArray(result.data) && result.data.length > 1) {
        const firstDate = result.data[0]?.date;
        const allSameDate = result.data.every(r => r?.date === firstDate);
        if (allSameDate) {
          try {
            const csvResult = await proxyToGoogleAppsScript(appsScriptUrl, 'exportCSV');
            if (csvResult.success && typeof csvResult.data === 'string') {
              const rows = parseCsv(csvResult.data);
              // Map CSV headers to expected fields
              const mapped = rows.map(r => ({
                date: r['Date'] ?? r['date'] ?? '',
                customerName: r['Customer Name'] ?? r['CustomerName'] ?? '',
                mobile: r['Mobile'] ?? '',
                tvModel: r['TV Model'] ?? r['TVModel'] ?? '',
                workDone: r['Work Done'] ?? r['WorkDone'] ?? '',
                price: Number(r['Price'] ?? 0) || 0,
                partsCost: Number(r['Parts Cost'] ?? r['PartsCost'] ?? 0) || 0,
                profit: Number(r['Profit'] ?? 0) || 0,
              }));
              return res.json({ success: true, data: mapped, error: null });
            }
          } catch (e) {
            console.warn('CSV fallback failed:', e?.message || e);
          }
        }
      }
      res.json(result);
    } else if (action === 'exportCSV') {
      const result = await proxyToGoogleAppsScript(appsScriptUrl, 'exportCSV');
      if (result.success) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="jobs.csv"');
        res.send(result.data);
      } else {
        res.status(500).json(result);
      }
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid action parameter'
      });
    }
  } catch (error) {
    console.error('Error in GET /api/sheets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/sheets - Add, update, or delete jobs via Google Apps Script
router.post('/', async (req, res) => {
  try {
    const { action, data, id, appsScriptUrl } = req.body;

    if (!appsScriptUrl) {
      return res.status(400).json({
        success: false,
        error: 'Google Apps Script URL is required'
      });
    }

    const result = await proxyToGoogleAppsScript(appsScriptUrl, action, data, id);
    res.json(result);
  } catch (error) {
    console.error('Error in POST /api/sheets:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/sheets/dashboard - Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const { appsScriptUrl } = req.query;
    
    if (!appsScriptUrl) {
      return res.status(400).json({
        success: false,
        error: 'Google Apps Script URL is required'
      });
    }

    const result = await proxyToGoogleAppsScript(appsScriptUrl, 'getAllJobs');
    
    if (!result.success) {
      return res.status(500).json(result);
    }

    const jobs = result.data || [];
    const totalJobs = jobs.length;
    const totalRevenue = jobs.reduce((sum, job) => sum + (job.price || 0), 0);
    const totalPartsCost = jobs.reduce((sum, job) => sum + (job.partsCost || 0), 0);
    const netProfit = totalRevenue - totalPartsCost;

    res.json({
      success: true,
      data: {
        totalJobs,
        totalRevenue,
        totalPartsCost,
        netProfit
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export { router as googleSheetsRouter };

