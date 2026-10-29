// Servidor local para testar sem a Vercel: ADMIN_PASSWORD=teste node scripts/dev-server.js
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
process.env.ADMIN_PASSWORD ||= 'teste';

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (d) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(d)); };
  if (url.pathname.startsWith('/api/')) {
    let raw = '';
    for await (const c of req) raw += c;
    req.body = raw ? JSON.parse(raw) : {};
    const mod = await import(pathToFileURL(path.join(root, 'api', url.pathname.slice(5) + '.js')).href);
    return mod.default(req, res);
  }
  let file = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!path.extname(file)) file += '.html';
  try {
    const data = await fs.readFile(path.join(root, file));
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  } catch { res.statusCode = 404; res.end('404'); }
}).listen(process.env.PORT || 3000, () => console.log('http://localhost:' + (process.env.PORT || 3000)));
