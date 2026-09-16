/* 정적 호스팅(GitHub Pages)에는 라우트 핸들러가 없으므로 빌드 전에 색인을 파일로 만들어 둔다.
   data/*.json을 고치면 pnpm build가 자동으로 다시 굽는다.
   - search-index.json: 조문 전문 (노무법전 전문 검색용)
   - palette-index.json: 통합 검색(Ctrl+K)용 경량 색인 — 조문·분야·계산기·절차·캘린더·서식·메뉴 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORY_SLUG, CATEGORY_BLURB } from '../lib/categories.js';
import { MODULES } from '../lib/modules.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const raw = readJson('data/provisions.json');
const calculators = readJson('data/platform/calculators.json');
const processes = readJson('data/platform/processes.json');
const calendar = readJson('data/platform/calendar.json');
const documents = readJson('data/platform/documents.json');

/* ── 1. 조문 전문 색인 ── */
const rows = raw.flatMap((area) => area.provisions.map((p) => [`${p.law}|${p.article}`, p.text]));

/* ── 2. 통합 검색 색인 ──
   항목: { g: 묶음, t: 제목, d: 짧은 설명, k: 추가 검색어, h: 이동 주소 } */
const cut = (s, n = 64) => {
  const t = (s || '').trim();
  return t.length > n ? t.slice(0, n).trimEnd() + '…' : t;
};

const palette = [
  ...MODULES.map((m) => ({ g: '메뉴', t: m.name, d: cut(m.blurb), k: m.short, h: m.href })),
  ...raw.flatMap((area) =>
    area.provisions.map((p) => ({
      g: '조문',
      t: `${p.law} ${p.article} — ${p.title}`,
      d: cut(p.summary),
      k: (p.keywords || []).join(' '),
      h: `/law/${encodeURIComponent(p.law)}/${encodeURIComponent(p.article)}`,
    }))
  ),
  ...Object.entries(CATEGORY_SLUG).map(([name, slug]) => ({
    g: '분야',
    t: name,
    d: cut(CATEGORY_BLURB[name]),
    k: '분야 카테고리',
    h: `/topic/${slug}`,
  })),
  ...calculators.map((c) => ({ g: '계산기', t: c.name, d: cut(c.purpose), k: '계산 계산기', h: `/calc/${c.key}` })),
  ...processes.map((p) => ({ g: '절차', t: p.title, d: cut(p.summary || p.blurb || ''), k: '절차 체크리스트', h: `/process/${p.slug}` })),
  ...calendar.map((o) => ({
    g: '캘린더',
    t: o.title,
    d: cut(`${o.cadence || ''} ${o.timing || ''}`.trim()),
    k: `법정 의무 ${o.target || ''}`,
    h: '/calendar',
  })),
  ...documents.map((d) => ({ g: '서식', t: d.name, d: cut(d.purpose), k: `서류 서식 ${d.kind || ''}`, h: '/docs' })),
];

const outDir = path.join(root, 'public');
fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, 'search-index.json');
fs.writeFileSync(outFile, JSON.stringify(rows));
const palFile = path.join(outDir, 'palette-index.json');
fs.writeFileSync(palFile, JSON.stringify(palette));
console.log(
  `search-index.json: ${rows.length}건, ${Math.round(fs.statSync(outFile).size / 1024)}KB · ` +
  `palette-index.json: ${palette.length}건, ${Math.round(fs.statSync(palFile).size / 1024)}KB`
);
