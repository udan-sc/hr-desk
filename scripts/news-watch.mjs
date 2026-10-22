/* 인사노무 뉴스·오늘의 주요 이슈 — GitHub Actions가 하루 세 번 돌린다(사람·AI 개입 없음).

   출처
   - 고용노동부 보도자료(목록 페이지)·정책자료(RSS) — 공식
   - 매일노동뉴스(RSS) — 노동 전문지
   - 구글 뉴스 검색(RSS) — 인사노무 키워드로 걸러 쓴다
   저작권 때문에 기사 본문은 싣지 않고 제목·출처·시각·원문 링크만 쓴다.

   '오늘의 주요 이슈'는 요약이 아니라 집계다: 최근 기사 제목에서 주제별 키워드가 몇 건 나왔는지 세어
   순위를 매기고, 주제마다 이 사이트의 관련 조문·판례·계산기 링크를 붙인다.
   결과: data/auto/news.json. 한 출처가 실패해도 나머지로 계속하고, 전부 실패하면 지난 결과를 둔다. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'data/auto/news.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const NOW = Date.now();
const KST = 9 * 3600 * 1000;

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (hr-desk news watch)' } });
      if (res.ok) return await res.text();
    } catch {
      /* 잠시 뒤 다시 */
    }
    await sleep(1000 * (i + 1));
  }
  throw new Error(`받지 못함: ${url}`);
}

const decode = (s) =>
  String(s || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`));
  return m ? decode(m[1]) : '';
};
/* "2026-10-22 06:30:06"(한국 시각) 또는 RFC 822 날짜를 밀리초로 */
function toMs(s) {
  const t = String(s || '').trim();
  const kst = t.match(/^(\d{4})[.-](\d{2})[.-](\d{2})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (kst) return Date.UTC(+kst[1], +kst[2] - 1, +kst[3], +(kst[4] || 9), +(kst[5] || 0), +(kst[6] || 0)) - KST;
  const ms = Date.parse(t);
  return Number.isNaN(ms) ? null : ms;
}
const items = (xml) => [...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/g)].map((m) => m[0]);

/* ── 출처별 수집 ── */
async function moelPress() {
  const html = await get('https://www.moel.go.kr/news/enews/report/enewsList.do');
  /* 목록의 각 행: 제목 링크 뒤 같은 행에 등록일 */
  const rows = [...html.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((m) => m[0]);
  const out = [];
  for (const r of rows) {
    const a = r.match(/enewsView\.do\?news_seq=(\d+)[^>]*>([\s\S]*?)<\/a>/);
    const d = r.match(/(20\d{2})\.(\d{2})\.(\d{2})/);
    if (!a || !d) continue;
    out.push({
      title: decode(a[2]),
      url: `https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=${a[1]}`,
      ms: toMs(`${d[1]}-${d[2]}-${d[3]}`),
      source: '고용노동부 보도자료',
      kind: 'official',
    });
  }
  return out;
}
async function moelPolicy() {
  const xml = await get('https://www.moel.go.kr/rss/policy.do');
  return items(xml).map((b) => ({
    title: tag(b, 'title'),
    url: tag(b, 'link'),
    ms: toMs(tag(b, 'dc:date')),
    source: '고용노동부 정책자료',
    kind: 'official',
  }));
}
async function laborToday() {
  const xml = await get('https://www.labortoday.co.kr/rss/allArticle.xml');
  return items(xml).map((b) => ({
    title: tag(b, 'title'),
    url: tag(b, 'link'),
    ms: toMs(tag(b, 'pubDate')),
    source: '매일노동뉴스',
    kind: 'news',
  }));
}
/* 구글 뉴스 — 주제별 검색어(최근 2일). 연예·스포츠 매체는 뺀다. */
const GOOGLE_QUERIES = [
  '고용노동부',
  '근로기준법 OR 노동법 개정',
  '임금체불',
  '중대재해 OR 산업재해',
  '최저임금',
  '통상임금 OR 퇴직금 OR 연차수당',
  '직장 내 괴롭힘',
  '육아휴직 OR 출산휴가',
  '노란봉투법 OR 노동조합법 OR 단체교섭',
  '근로시간 단축 OR 주4.5일제 OR 정년연장',
];
const NOISY_SOURCES = /스포츠|OSEN|엑스포츠|마이데일리|텐아시아|enews|iMBC|스타뉴스|조이뉴스|TV리포트|뉴스엔|일간스포츠|톱스타|비즈엔터/;
/* 퇴직연금 상품 수익률 같은 금융 홍보 기사는 인사 실무와 무관해 뺀다 */
const FINANCE_NOISE = /수익률|은행|증권|자산운용|운용사|펀드|ETF|IRP|적립금|보험사|카드사|금리/;
async function googleNews() {
  const out = [];
  for (const q of GOOGLE_QUERIES) {
    try {
      const xml = await get(
        `https://news.google.com/rss/search?q=${encodeURIComponent(q + ' when:2d')}&hl=ko&gl=KR&ceid=KR:ko`
      );
      for (const b of items(xml)) {
        const source = tag(b, 'source') || '언론';
        if (NOISY_SOURCES.test(source)) continue;
        const raw = tag(b, 'title');
        const title = raw.endsWith(` - ${source}`) ? raw.slice(0, -(source.length + 3)) : raw;
        if (FINANCE_NOISE.test(title)) continue;
        out.push({ title, url: tag(b, 'link'), ms: toMs(tag(b, 'pubDate')), source, kind: 'news' });
      }
    } catch {
      /* 검색어 하나가 실패해도 나머지로 */
    }
    await sleep(400);
  }
  return out;
}

/* ── 주제(이슈) 사전 — 제목에 키워드가 하나라도 있으면 그 주제의 기사로 센다 ── */
const TOPICS = [
  { key: 'wage-arrears', label: '임금체불', kw: ['임금체불', '체불', '임금 체불'], links: [['근로기준법 제43조(임금 지급)', '/law/근로기준법/제43조'], ['퇴직금 계산기', '/calc/severance-pay']] },
  { key: 'ordinary-wage', label: '통상임금·수당', kw: ['통상임금', '연장수당', '야간수당', '포괄임금', '휴일수당'], links: [['용어: 통상임금', '/terms#ordinary-wage'], ['통상임금 판례', '/cases?q=통상임금']] },
  { key: 'min-wage', label: '최저임금', kw: ['최저임금'], links: [['최저임금 점검 계산기', '/calc/minimum-wage'], ['최저임금법 제6조', '/law/최저임금법/제6조']] },
  { key: 'safety', label: '산업재해·중대재해', kw: ['중대재해', '산업재해', '산재', '사망사고', '안전보건', '추락', '끼임'], links: [['중대재해처벌법 제4조', '/law/중대재해처벌법/제4조'], ['산업안전 분야', '/topic/safety']] },
  { key: 'labor-relations', label: '노조·노사관계', kw: ['노란봉투법', '노조법', '노동조합', '파업', '단체교섭', '교섭', '원청', '하청노조', '쟁의'], links: [['노동조합법 제2조', '/law/노동조합법/제2조'], ['노사관계 분야', '/topic/labor-relations']] },
  { key: 'hours', label: '근로시간', kw: ['근로시간', '노동시간', '주4.5일', '4.5일제', '주 52시간', '52시간', '연장근로', '장시간'], links: [['근로기준법 제53조(연장근로)', '/law/근로기준법/제53조'], ['가산수당 계산기', '/calc/overtime-pay']] },
  { key: 'retirement-age', label: '정년·고령 고용', kw: ['정년', '계속고용', '고령자', '재고용'], links: [['고령자고용법 제19조(정년)', '/law/고령자고용법/제19조']] },
  { key: 'parental', label: '육아·출산·모성보호', kw: ['육아휴직', '출산휴가', '출산전후', '난임', '배우자 출산', '육아기', '모성'], links: [['남녀고용평등법 제19조(육아휴직)', '/law/남녀고용평등법/제19조'], ['모성보호 분야', '/topic/parental']] },
  { key: 'harassment', label: '직장 내 괴롭힘·성희롱', kw: ['괴롭힘', '성희롱', '갑질'], links: [['근로기준법 제76조의2', '/law/근로기준법/제76조의2'], ['괴롭힘 신고 대응 절차', '/process/harassment']] },
  { key: 'dismissal', label: '해고·구조조정', kw: ['해고', '부당해고', '구조조정', '희망퇴직', '권고사직'], links: [['근로기준법 제23조(해고 제한)', '/law/근로기준법/제23조'], ['해고예고 계산기', '/calc/dismissal-notice']] },
  { key: 'nonregular', label: '비정규·플랫폼·위장고용', kw: ['비정규', '파견', '하청', '플랫폼 노동', '플랫폼노동', '플랫폼 종사', '특수고용', '프리랜서', '위장고용', '가짜 3.3', '근로자성'], links: [['근로기준법 제2조(근로자 정의)', '/law/근로기준법/제2조'], ['기간제·파견 분야', '/topic/nonregular']] },
  { key: 'insurance', label: '고용보험·실업급여', kw: ['고용보험', '실업급여', '구직급여', '4대보험'], links: [['고용·산재보험 분야', '/topic/insurance']] },
  { key: 'pension', label: '퇴직금·퇴직연금', kw: ['퇴직연금', '퇴직금', '퇴직급여'], links: [['퇴직급여법 제8조', '/law/퇴직급여법/제8조'], ['퇴직금 계산기', '/calc/severance-pay']] },
];

const normTitle = (t) => t.replace(/\[[^\]]*\]|\([^)]*\)|[^0-9A-Za-z가-힣]/g, '');
/* 같은 보도자료를 여러 매체가 받아쓴 기사는 제목이 조금씩 달라 두 글자 조각이 얼마나 겹치는지로 묶는다 */
const grams = (t) => { const n = normTitle(t); const g = new Set(); for (let i = 0; i < n.length - 1; i++) g.add(n.slice(i, i + 2)); return g; };
const similar = (a, b) => { let inter = 0; for (const x of a) if (b.has(x)) inter++; return inter / (a.size + b.size - inter || 1) >= 0.6; };

async function main() {
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
  const sources = [
    ['고용노동부 보도자료', moelPress],
    ['고용노동부 정책자료', moelPolicy],
    ['매일노동뉴스', laborToday],
    ['구글 뉴스', googleNews],
  ];
  const status = {};
  let all = [];
  for (const [name, fn] of sources) {
    try {
      const got = (await fn()).filter((x) => x.title && x.url && x.ms);
      status[name] = { ok: true, count: got.length };
      all.push(...got);
    } catch (e) {
      status[name] = { ok: false, error: String(e.message).slice(0, 120) };
    }
  }
  if (!all.length && prev) {
    console.log('모든 출처에서 받지 못해 이전 결과를 유지합니다.');
    return;
  }

  /* 공식 자료는 최근 10일, 언론 기사는 최근 3일만. 미래 날짜(시차 오류)는 지금으로 맞춘다. */
  all = all
    .map((x) => ({ ...x, ms: Math.min(x.ms, NOW) }))
    .filter((x) => NOW - x.ms <= (x.kind === 'official' ? 10 : 3) * 86400000);

  /* 같은 기사가 여러 검색어·매체로 겹치면 하나만 — 공식 > 전문지 > 일반 언론, 그다음 최신 */
  const rank = (x) => (x.kind === 'official' ? 0 : x.source === '매일노동뉴스' ? 1 : 2);
  all.sort((a, b) => rank(a) - rank(b) || b.ms - a.ms);
  const deduped = [];
  for (const x of all) {
    if (!normTitle(x.title)) continue;
    const g = grams(x.title);
    const same = deduped.find((y) => similar(g, y.g));
    if (same) {
      same.also += 1; /* 같은 이야기를 다룬 다른 기사 수 */
      continue;
    }
    deduped.push({ ...x, g, also: 0 });
  }

  /* 주제 표시 */
  for (const x of deduped) x.topics = TOPICS.filter((t) => t.kw.some((k) => x.title.includes(k))).map((t) => t.key);
  /* 일반 언론은 주제에 하나도 안 걸리면 뺀다(검색어만 우연히 맞은 기사 정리). 공식·전문지는 그대로 둔다. */
  const kept = deduped.filter((x) => x.kind === 'official' || x.source === '매일노동뉴스' || x.topics.length);
  kept.sort((a, b) => b.ms - a.ms);

  /* 오늘의 주요 이슈 — 최근 24시간, 서로 다른 이야기가 2건 이상인 주제를 많은 순으로 5개.
     같은 보도를 여러 매체가 받아쓴 것은 한 이야기로 센다(기사 수는 따로 표시). */
  const recent = kept.filter((x) => NOW - x.ms <= 24 * 3600000);
  const issues = TOPICS.map((t) => {
    const hits = recent.filter((x) => x.topics.includes(t.key));
    return {
      key: t.key,
      label: t.label,
      count: hits.length,
      articles: hits.reduce((n, x) => n + 1 + x.also, 0),
      officialCount: hits.filter((x) => x.kind === 'official').length,
      headlines: hits
        .slice()
        .sort((a, b) => rank(a) - rank(b) || b.ms - a.ms)
        .slice(0, 3)
        .map((x) => ({ title: x.title, url: x.url, source: x.source, ms: x.ms })),
      links: t.links.map(([label, href]) => ({ label, href })),
    };
  })
    .filter((i) => i.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const out = {
    updatedAt: new Date(NOW).toISOString(),
    runner: process.env.GITHUB_ACTIONS ? 'github-actions' : 'local',
    status,
    issues,
    /* 공식 발표는 따로 최대 20건을 늘 남긴다 — 언론 기사가 많은 날에도 밀려나지 않게 */
    items: [
      ...kept.filter((x) => x.kind === 'official').slice(0, 20),
      ...kept.filter((x) => x.kind !== 'official').slice(0, 150),
    ]
      .sort((a, b) => b.ms - a.ms)
      .map(({ title, url, ms, source, kind, topics, also }) => ({ title, url, ms, source, kind, topics, also })),
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(
    `뉴스 ${out.items.length}건 · 주요 이슈 ${issues.map((i) => `${i.label}(${i.count})`).join(', ') || '없음'} · ` +
      Object.entries(status).map(([k, v]) => `${k} ${v.ok ? v.count : '실패'}`).join(' / ')
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(0); /* 뉴스 수집 실패로 배포가 막히지 않게 한다 */
});
