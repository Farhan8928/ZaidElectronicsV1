import qrcode from 'qrcode';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

let clientPromise = null;
let latestQrBase64 = '';
let isConnected = false;
let connectionState = 'loading';

function getClient() {
  if (!clientPromise) {
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: 'repair-tracker-session' }),
      puppeteer: {
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    client.on('qr', async (qr) => {
      try {
        latestQrBase64 = await qrcode.toDataURL(qr);
        connectionState = 'qrcode';
        isConnected = false;
      } catch (e) {
        latestQrBase64 = '';
      }
    });

    client.on('ready', () => {
      isConnected = true;
      connectionState = 'connected';
    });
    client.on('authenticated', () => {
      isConnected = true;
      connectionState = 'connected';
    });
    client.on('auth_failure', () => {
      isConnected = false;
      connectionState = 'disconnected';
    });
    client.on('disconnected', () => {
      isConnected = false;
      connectionState = 'disconnected';
    });

    clientPromise = client.initialize().then(() => client);
  }
  return clientPromise;
}

export async function sendWhatsAppText({ to, message }) {
  if (!to) throw new Error('Missing recipient phone');
  if (!message) throw new Error('Missing message');

  const client = await getClient();
  await waitUntilReady(60000);
  const phone = normalizePhone(to);
  // Resolve WhatsApp number ID
  const numberId = await client.getNumberId(phone);
  if (!numberId || !numberId._serialized) {
    throw new Error('Invalid WhatsApp number');
  }
  await client.sendMessage(numberId._serialized, message);
  return { ok: true };
}

export async function getQrImage() {
  await getClient();
  return latestQrBase64;
}

export async function getConnectionStatus() {
  await getClient();
  return { connected: isConnected, status: connectionState, hasQr: !!latestQrBase64 };
}

function normalizePhone(raw) {
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`; // default to +91
  return digits;
}

async function waitUntilReady(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (isConnected) return;
    await delay(500);
  }
  throw new Error(`WhatsApp not ready (status=${connectionState})`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

