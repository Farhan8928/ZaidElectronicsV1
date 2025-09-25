import { useEffect, useState } from "react";

export default function Whatsapp() {
  const [qr, setQr] = useState<string>("");
  const [status, setStatus] = useState<string>("loading");
  const [connected, setConnected] = useState<boolean>(false);
  const baseUrl = (import.meta as any)?.env?.VITE_BACKEND_URL || '';
  const api = (path: string) => (baseUrl ? `${baseUrl}${path}` : path);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const [s, q] = await Promise.all([
          fetch(api('/api/whatsapp/status')).then(r=>r.json()),
          fetch(api('/api/whatsapp/qr')).then(r=>r.json()),
        ]);
        if (!mounted) return;
        if (s?.success && s.data) {
          setConnected(!!s.data.connected);
          setStatus(String(s.data.status || ''));
        }
        if (q?.success && q.data) {
          setQr(String(q.data.qr || ''));
        }
      } catch (_) {}
    };
    fetchAll();
    const id = setInterval(fetchAll, 3000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md bg-card border border-border rounded-lg p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">WhatsApp Connection</h1>
        <p className="text-sm text-muted-foreground mb-6">Status: {connected ? 'Connected' : status}</p>
        {!connected && qr ? (
          <div className="flex items-center justify-center">
            <img src={qr} alt="WhatsApp QR" className="w-72 h-72 object-contain border rounded" />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">{connected ? 'Phone connected to WhatsApp' : 'Waiting for QR...'}</div>
        )}
      </div>
    </div>
  );
}


