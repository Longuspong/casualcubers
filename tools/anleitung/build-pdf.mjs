// Druckt die Bilder-Anleitung (tools/anleitung/page.html) als PDF nach
// public/anfaenger-bildanleitung.pdf.
//
// Braucht das vorinstallierte Chromium und playwright-core. Aufruf:
//   node tools/anleitung/build-pdf.mjs
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
const OUT = path.join(ROOT, 'public', 'anfaenger-bildanleitung.pdf');
const EXE = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.md': 'text/plain', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, url);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage();
await page.goto(`http://localhost:${port}/tools/anleitung/page.html`, { waitUntil: 'networkidle' });
await page.waitForFunction('window.__ready === true', { timeout: 8000 });
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
server.close();
console.log('PDF ->', OUT);
