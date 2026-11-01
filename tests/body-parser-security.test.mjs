import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import http from 'node:http';
import { gzipSync } from 'node:zlib';
import test from 'node:test';
const store = new URL('../node_modules/.pnpm/', import.meta.url);
const dir = readdirSync(store).find(name => name.startsWith('body-parser@1.20.9'));
assert.ok(dir, 'Actual compatible patched body-parser 1.x must be installed');
const require = createRequire(new URL(`${dir}/node_modules/body-parser/package.json`, store));
const middleware = require('body-parser').json({ limit: '16kb' });

test('real HTTP middleware accepts valid JSON/gzip and rejects malformed trailing compressed data', { timeout: 5000 }, async () => {
  const server = http.createServer((req, res) => middleware(req, res, error => {
    res.statusCode = error ? error.status ?? 400 : 200;
    res.end(error ? 'rejected' : JSON.stringify(req.body));
  }));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const send = (body, compressed = false) => new Promise((resolve, reject) => {
    const headers = { 'content-type': 'application/json', 'content-length': body.length, connection: 'close' };
    if (compressed) headers['content-encoding'] = 'gzip';
    const req = http.request({ host: '127.0.0.1', port: server.address().port, method: 'POST', headers }, res => {
      let text = '';
      res.setEncoding('utf8'); res.on('data', part => { text += part; });
      res.on('end', () => resolve({ status: res.statusCode, text }));
    });
    req.on('error', reject); req.end(body);
  });
  try {
    const json = Buffer.from('{"safe":true}');
    assert.deepEqual(await send(json), { status: 200, text: '{"safe":true}' });
    assert.deepEqual(await send(gzipSync(json), true), { status: 200, text: '{"safe":true}' });
    assert.equal((await send(Buffer.concat([gzipSync(json), Buffer.from('invalid trailing bytes')]), true)).status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
