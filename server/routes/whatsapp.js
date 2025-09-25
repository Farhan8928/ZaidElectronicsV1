import express from 'express';
import { sendWhatsAppText, getQrImage, getConnectionStatus } from '../services/whatsappService.js';

const router = express.Router();

// POST /api/whatsapp/send
router.post('/send', async (req, res) => {
  try {
    const { to, message } = req.body;
    const result = await sendWhatsAppText({ to, message });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/whatsapp/qr - returns base64 data URL
router.get('/qr', async (_req, res) => {
  try {
    const qr = await getQrImage();
    res.json({ success: true, data: { qr } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/whatsapp/status - returns connection status
router.get('/status', async (_req, res) => {
  try {
    const status = await getConnectionStatus();
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export { router as whatsappRouter };


