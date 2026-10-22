/* 정적 호스팅(GitHub Pages)에는 라우트 핸들러가 없으므로 빌드 전에 색인을 파일로 만들어 둔다.
   data/*.json을 고치면 pnpm build가 자동으로 다시 굽는다.
   - search-index.json: 조문 전문 (노무법전 전문 검색용)
   - palette-index.json: 통합 검색(Ctrl+K)용 경량 색인 — 조문·분야·계산기·절차·캘린더·서식·메뉴 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORY_SLUG, CATEGORY_BLURB } from '../lib/categories.js';
import { MODULES } from '../lib/modules.js';
import { SITE_URL } from '../lib/site.js';

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
const qa = readJson('data/platform/qa.json');
const wizards = readJson('data/platform/wizards.json');
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

/* 메뉴 이름에 없는 말로도 찾아지게 */
const MENU_WORDS = {
  thresholds: '인원 규모 문턱 상시 근로자',
  news: '뉴스 소식 보도자료 이슈 오늘',
  favorites: '즐겨찾기 별표 공유',
  updates: '업데이트 새소식 변경 RSS 구독 이번주',
  qa: '질문 FAQ 자주 묻는',
  check: '판정 판단 대상 여부 체크',
};

const palette = [
  ...MODULES.map((m) => ({ g: '메뉴', t: m.name, d: cut(m.blurb), k: `${m.short} ${MENU_WORDS[m.slug] || ''}`, h: m.href })),
  ...wizards.map((w) => ({ g: '판정', t: w.title, d: cut(w.intro, 56), k: `판정 도우미 대상 여부 ${w.key}`, h: `/check/${w.key}` })),
  ...qa.map((q) => ({
    g: 'Q&A',
    t: q.question,
    d: cut(q.short, 56),
    k: `질문 ${q.category} ${q.provisions.map((x) => `${x.law} ${x.article}`).join(' ')}`,
    h: `/qa#${q.id}`,
  })),
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
/* 이번 주 바뀐 것 — 다음 실행이 이어 쓸 장부(updates.json)와 RSS(updates.xml) */
/* 장부 파일이 없으면(새로 받은 저장소 등) 빈 장부를 만들어 둔다 — lib/platform.js가 이 파일을 불러온다 */
if (!fs.existsSync(path.join(root, 'data/auto/updates.json'))) {
  fs.mkdirSync(path.join(root, 'data/auto'), { recursive: true });
  fs.writeFileSync(path.join(root, 'data/auto/updates.json'), JSON.stringify({ updatedAt: null, today: null, ledger: 'none', items: [] }, null, 1));
}
const updates = readJson('data/auto/updates.json');
fs.writeFileSync(path.join(outDir, 'updates.json'), JSON.stringify(updates));
const TYPE_LABEL = { promulgated: '공포', effective: '시행', soon: '시행 임박', precedent: '새 판례', site: '사이트 소식' };
/* XML 1.0이 허용하지 않는 제어 문자는 빼고 특수 문자는 이스케이프 */
const xml = (v) =>
  String(v ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const kDate = (iso) => iso.split('-').map(Number).join('. ') + '.';
/* 게시 시각은 장부에 처음 실린 실제 시각(firstSeenAt) — 구독 도구는 '마지막 확인 뒤 게시'만 알리므로 지어낸 시각을 쓰면 놓친다 */
const rssDate = (x) => {
  const d = new Date(x.firstSeenAt || `${x.firstSeen}T07:00:00+09:00`);
  return (Number.isNaN(d.getTime()) ? new Date(`${x.firstSeen}T07:00:00+09:00`) : d).toUTCString();
};
/* 배포본은 주소 끝에 /가 붙는 형태(trailingSlash)라 맞춰 준다. URL 객체로 만들면 한글만 인코딩되고
   이미 인코딩된 %XX(예: 병합 사건번호의 쉼표 %2C)는 그대로 남는다. 바깥 주소(국가법령정보센터)는 그대로 */
const abs = (h) => {
  if (/^https?:\/\//.test(h)) return new URL(h).href;
  const [, p, rest] = h.match(/^([^?#]*)(.*)$/);
  return new URL(`${SITE_URL}${p.endsWith('/') ? p : p + '/'}${rest}`).href;
};
const rssItems = updates.items.slice(0, 60).map((x) => {
  const ds = x.efYds || (x.efYd ? [x.efYd] : []);
  const when = (x.type === 'promulgated' || x.type === 'soon') && ds.length ? ` — ${ds.map(kDate).join(', ')} 시행` : '';
  /* 시행 임박은 시행일을, 그 밖에는 사건 날짜를 적는다(시행 임박의 date는 '시행 7일 전'이라 게시일과 어긋날 수 있음) */
  const desc = [x.summary, `${TYPE_LABEL[x.type]} · ${kDate(x.type === 'soon' && x.efYd ? x.efYd : x.date)}`].filter(Boolean).join('\n');
  return [
    '<item>',
    `<title>${xml(`[${TYPE_LABEL[x.type]}] ${x.title}${when}`)}</title>`,
    `<link>${xml(abs(x.href))}</link>`,
    `<guid isPermaLink="false">hr-desk:${xml(x.id)}</guid>`,
    `<pubDate>${rssDate(x)}</pubDate>`,
    `<category>${xml(TYPE_LABEL[x.type])}</category>`,
    `<description>${xml(desc)}</description>`,
    '</item>',
  ].join('');
});
fs.writeFileSync(
  path.join(outDir, 'updates.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    '<title>인사총무 데스크 — 바뀐 것</title>',
    `<link>${xml(abs('/updates'))}</link>`,
    `<atom:link href="${xml(SITE_URL + '/updates.xml')}" rel="self" type="application/rss+xml"/>`,
    '<description>노동법 개정 공포·시행, 새 대법원 판례, 사이트 새 기능을 모아 알려 드립니다. 국가법령정보센터 원문 기준으로 매일 확인합니다.</description>',
    '<language>ko</language>',
    `<lastBuildDate>${new Date(updates.updatedAt || Date.now()).toUTCString()}</lastBuildDate>`,
    '<ttl>360</ttl>',
    ...rssItems,
    '</channel>',
    '</rss>',
  ].join('\n')
);

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
    news: (() => {
      const n = fs.existsSync(path.join(root, 'data/auto/news.json')) ? readJson('data/auto/news.json') : {};
      return { updatedAt: n.updatedAt || null, runner: n.runner || null, sources: n.status || {}, items: (n.items || []).length, issues: (n.issues || []).map((i) => `${i.label} ${i.count}`) };
    })(),
    precedents: {
      enabled: Boolean(precWatch.enabled),
      checkedAt: precWatch.checkedAt || null,
      searchedLaws: precWatch.searched ?? null,
      candidates: precWatch.candidates ?? null,
      errors: (precWatch.errors || []).slice(0, 5),
      added: autoPrec.length,
    },
  }, null, 1)
);
console.log(
  `search-index.json: ${rows.length}건, ${Math.round(fs.statSync(outFile).size / 1024)}KB · ` +
  `palette-index.json: ${palette.length}건, ${Math.round(fs.statSync(palFile).size / 1024)}KB`
);
