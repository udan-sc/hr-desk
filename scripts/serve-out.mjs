/* 내보낸 out/을 GitHub Pages와 같은 하위 경로(/hr-desk)에 얹어 확인하는 임시 서버.
   배포에는 쓰이지 않는다. node scripts/serve-out.mjs */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '/hr-desk';
const PORT = Number(process.env.PORT) || 3202;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

http
  .createServer((req, res) => {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (url === BASE) url = BASE + '/';
    if (!url.startsWith(BASE + '/')) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end(`이 서버는 ${BASE}/ 아래만 서빙합니다.`);
    }
    let rel = url.slice(BASE.length);
    let file = path.join(root, rel);
    if (rel.endsWith('/')) file = path.join(file, 'index.html');
    if (!file.startsWith(root)) {
      res.writeHead(403);
      return res.end();
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const notFound = path.join(root, '404.html');
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'not found');
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, '127.0.0.1', () => console.log(`static out/ on http://127.0.0.1:${PORT}${BASE}/`));
