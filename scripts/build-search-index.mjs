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
const glossary = readJson('data/platform/glossary.json');
const changes = readJson('data/platform/changes.json');
const curatedPrec = readJson('data/platform/precedents.json');
/* 매주 자동 추가된 새 판례(인증키가 있을 때)도 판결요지 파일·통합 검색에 함께 넣는다 */
const autoPrec = fs.existsSync(path.join(root, 'data/auto/precedents-auto.json'))
  ? (readJson('data/auto/precedents-auto.json').items || []).filter((p) => !curatedPrec.some((q) => q.caseNo === p.caseNo))
  : [];
const precedents = [...curatedPrec, ...autoPrec];
const lawWatch = fs.existsSync(path.join(root, 'data/auto/law-watch.json')) ? readJson('data/auto/law-watch.json') : { laws: {} };
const curatedChangeKeys = new Set(changes.map((c) => `${c.law}|${c.effectiveDate}`));
const autoChanges = Object.entries(lawWatch.laws || {}).flatMap(([law, l]) =>
  (l.upcoming || [])
    .filter((u) => u.notable && !curatedChangeKeys.has(`${law}|${u.efYd}`) && !curatedChangeKeys.has(`${l.official}|${u.efYd}`))
    .map((u) => ({ law, ...u }))
);

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
  { g: '메뉴', t: '규모별 문턱 지도', d: '5·10·30·50명 문턱을 넘을 때 새로 생기는 조문·의무·서류', k: '인원 규모 문턱 상시 근로자', h: '/thresholds' },
  { g: '메뉴', t: '즐겨찾기 모아보기', d: '별표한 조문을 한곳에, 링크로 팀 공유', k: '즐겨찾기 별표 공유', h: '/favorites' },
  ...precedents.map((p) => ({
    g: '판례',
    t: `${p.caseNo} — ${p.caseName}`.slice(0, 80),
    d: cut(p.point || p.issues, 56),
    k: `판례 ${p.court} ${p.category || ''} ${(p.provisions || []).map((x) => x.law + ' ' + x.article).join(' ')}`,
    h: `/cases?q=${encodeURIComponent(p.caseNo)}`,
  })),
  ...autoChanges.map((u) => ({
    g: '개정',
    t: `${u.efYd.replace(/-/g, '. ')}. ${u.law} ${u.kind} (자동 감지)`,
    d: cut(u.reason || `법률 제${u.lawNo}호`, 56),
    k: `개정 시행 자동 ${u.law} ${(u.changedArticles || []).join(' ')}`,
    h: `/changes#auto-${u.law}-${u.efYd}-${u.lawNo}`,
  })),
  ...changes.map((c) => ({
    g: '개정',
    t: `${c.effectiveDate.replace(/-/g, '. ')}. ${c.title}`,
    d: cut(c.change, 56),
    k: `개정 시행 ${c.law} ${c.scope || ''}`,
    h: `/changes#${c.id}`,
  })),
  ...glossary.map((g) => ({
    g: '용어',
    t: g.term,
    d: cut(g.plain || g.definition, 56),
    k: `용어 ${(g.related || []).join(' ')}`,
    h: `/terms#${g.id}`,
  })),
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
/* 판례 목록 화면은 판결요지를 펼칠 때 그 판례 것만 받아온다: public/prec/<원문 일련번호>.json = [판결요지, 참조조문]
   (283건을 한 파일로 묶으면 800KB가 넘어 휴대폰에서 첫 펼침이 느리다) */
const precDir = path.join(outDir, 'prec');
fs.rmSync(precDir, { recursive: true, force: true });
fs.mkdirSync(precDir, { recursive: true });
for (const p of precedents) fs.writeFileSync(path.join(precDir, `${p.precSeq}.json`), JSON.stringify([p.summary || '', p.refs || '']));
fs.rmSync(path.join(outDir, 'precedents-full.json'), { force: true });
/* 매주 자동 확인 상태 — 배포된 사이트에서 /auto-status.json으로 확인할 수 있다 */
const precWatch = fs.existsSync(path.join(root, 'data/auto/precedents-auto.json')) ? readJson('data/auto/precedents-auto.json') : {};
fs.writeFileSync(
  path.join(outDir, 'auto-status.json'),
  JSON.stringify({
    law: {
      checkedAt: lawWatch.checkedAt || null,
      runAt: lawWatch.runAt || null,
      runner: lawWatch.runner || null,
      ok: lawWatch.ok ?? null,
      errors: lawWatch.errors || [],
      changedProvisions: Object.values(lawWatch.provisions || {}).filter((p) => p.changedSinceBase).length,
      upcoming: Object.values(lawWatch.laws || {}).reduce((n, l) => n + (l.upcoming || []).length, 0),
      autoChanges: autoChanges.length,
    },
    precedents: { enabled: Boolean(precWatch.enabled), checkedAt: precWatch.checkedAt || null, added: autoPrec.length },
  }, null, 1)
);
console.log(
  `search-index.json: ${rows.length}건, ${Math.round(fs.statSync(outFile).size / 1024)}KB · ` +
  `palette-index.json: ${palette.length}건, ${Math.round(fs.statSync(palFile).size / 1024)}KB`
);
