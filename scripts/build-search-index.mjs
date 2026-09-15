/* 조문 전문 색인을 public/search-index.json으로 굽는다.
   정적 호스팅(GitHub Pages)에는 라우트 핸들러가 없으므로 빌드 전에 파일로 만들어 둔다.
   data/provisions.json을 고치면 pnpm build가 자동으로 다시 굽는다. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const raw = JSON.parse(fs.readFileSync(path.join(root, 'data/provisions.json'), 'utf8'));
const rows = raw.flatMap((area) => area.provisions.map((p) => [`${p.law}|${p.article}`, p.text]));

const outDir = path.join(root, 'public');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'search-index.json');
fs.writeFileSync(outFile, JSON.stringify(rows));
console.log(`search-index.json: ${rows.length}건, ${Math.round(fs.statSync(outFile).size / 1024)}KB`);
