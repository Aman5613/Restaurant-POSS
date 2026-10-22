import http from 'node:http';
import net from 'node:net';

export function sendToThermalPrinter(host, port = 9100, data, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let isFinished = false;

    socket.setTimeout(timeoutMs);

    socket.connect(port, host, () => {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
      socket.write(buffer, (err) => {
        if (err) {
          isFinished = true;
          socket.destroy();
          return reject(err);
        }
        socket.end();
      });
    });

    socket.on('close', () => {
      if (!isFinished) {
        isFinished = true;
        resolve({ success: true, host, port });
      }
    });

    socket.on('timeout', () => {
      if (!isFinished) {
        isFinished = true;
        socket.destroy();
        reject(new Error(`Connection to printer ${host}:${port} timed out`));
      }
    });

    socket.on('error', (err) => {
      if (!isFinished) {
        isFinished = true;
        socket.destroy();
        reject(err);
      }
    });
  });
}

export function createPrintBridgeServer() {
  return http.createServer(async (req, res) => {
    // Enable CORS for local POS web client
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'print-bridge', timestamp: new Date().toISOString() }));
      return;
    }

    if (req.method === 'POST' && req.url === '/print') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });

      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const { printerIp, printerPort = 9100, content, rawBytes } = payload;

          if (!printerIp) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'printerIp is required' }));
            return;
          }

          const dataToSend = rawBytes ? Buffer.from(rawBytes, 'base64') : (content || '');
          const result = await sendToThermalPrinter(printerIp, printerPort, dataToSend);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, ...result }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });
}

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 18181;
  const server = createPrintBridgeServer();
  server.listen(PORT, '127.0.0.1', () => {
    // eslint-disable-next-line no-console
    console.log(`Print Bridge running on http://127.0.0.1:${PORT}`);
  });
}
