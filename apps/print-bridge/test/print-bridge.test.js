import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import net from 'node:net';
import { createPrintBridgeServer } from '../src/server.js';

describe('Local Print Bridge Microservice Tests', () => {
  let server;
  let serverPort;
  let dummyPrinter;
  let dummyPrinterPort;
  let receivedBytes = Buffer.alloc(0);

  beforeAll(async () => {
    // Spin up a mock TCP thermal printer on an ephemeral port
    dummyPrinter = net.createServer((socket) => {
      socket.on('data', (data) => {
        receivedBytes = Buffer.concat([receivedBytes, data]);
      });
      socket.on('end', () => {
        socket.end();
      });
    });

    await new Promise((resolve) => dummyPrinter.listen(0, '127.0.0.1', resolve));
    dummyPrinterPort = dummyPrinter.address().port;

    // Spin up Print Bridge server
    server = createPrintBridgeServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    serverPort = server.address().port;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await new Promise((resolve) => dummyPrinter.close(resolve));
  });

  it('responds to GET /health with status ok', async () => {
    const res = await fetch(`http://127.0.0.1:${serverPort}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('print-bridge');
  });

  it('rejects POST /print when printerIp is missing', async () => {
    const res = await fetch(`http://127.0.0.1:${serverPort}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test slip' }),
    });
    expect(res.status).toBe(400);
  });

  it('successfully relays raw thermal print data over TCP to printer', async () => {
    const testContent = '--- KOT SLIP: TABLE 4 ---\n1x Biryani\n';
    const res = await fetch(`http://127.0.0.1:${serverPort}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerIp: '127.0.0.1',
        printerPort: dummyPrinterPort,
        content: testContent,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(receivedBytes.toString('utf-8')).toContain('KOT SLIP: TABLE 4');
  });
});
