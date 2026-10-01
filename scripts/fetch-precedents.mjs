/* 판례 원문 가져오기.
   data/platform/precedents-src.json(사람·AI가 고른 사건번호와 연결 조문, 한 줄 요지)을 읽어
   국가법령정보센터 원문에서 법원·선고일·사건명·판시사항·판결요지·참조조문을 글자 그대로 가져와
   data/platform/precedents.json을 만든다. 원문에서 찾을 수 없는 사건번호는 싣지 않는다.

   사용법
     node scripts/fetch-precedents.mjs                 → precedents-src.json 전체를 받아 precedents.json 생성
     node scripts/fetch-precedents.mjs --check 2020다247190 2023다302838
                                                       → 사건번호마다 원문 존재 여부와 공식 표제만 확인 (선정 단계용)
     node scripts/fetch-precedents.mjs --dump 2020다247190
                                                       → 판시사항·판결요지까지 출력 (한 줄 요지 작성·검증용) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://www.law.go.kr';
export const caseUrl = (no) => `${BASE}/판례/(${no})`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(encodeURI(url), { headers: { 'User-Agent': 'Mozilla/5.0 (hr-desk precedent fetcher)' } });
      if (res.ok) return await res.text();
    } catch {
      /* 잠시 뒤 다시 */
    }
    await sleep(800 * (i + 1));
  }
  return null;
}

function toText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

/* 【판시사항】 같은 머리표 사이의 본문을 잘라낸다 */
function section(text, name) {
  const start = text.indexOf(`【${name}】`);
  if (start < 0) return '';
  const from = start + name.length + 2;
  const next = text.indexOf('【', from);
  return text
    .slice(from, next < 0 ? undefined : next)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

const COURT_LEVEL = (court) =>
  court === '대법원' ? '대법원' : /고등법원/.test(court) ? '고등법원' : /행정법원/.test(court) ? '행정법원' : '지방법원';

/* 사건번호 하나를 원문에서 찾아 공식 정보를 돌려준다. 못 찾으면 null */
export async function fetchCase(no, { full = true } = {}) {
  const shell = await get(caseUrl(no));
  const seq = shell && (shell.match(/precSeq=(\d+)/) || [])[1];
  if (!seq) return null;
  const html = await get(`${BASE}/LSW/precInfoP.do?precSeq=${seq}`);
  if (!html) return null;
  const text = toText(html);
  const t = text.match(/\[([가-힣]+법원)\s*(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(?:자\s*)?선고\s*([^\]]+?)\s*(전원합의체\s*)?(판결|결정)[^\]]*\]/);
  if (!t) return null;
  const caseNos = t[5].replace(/\s+/g, '');
  /* 같은 번호 다른 사건이 걸리지 않도록 표제에 사건번호가 실제로 들어 있는지 확인한다 */
  if (!caseNos.includes(no.replace(/\s+/g, ''))) return null;
  const titleIdx = text.indexOf(t[0]);
  const before = text.slice(Math.max(0, titleIdx - 300), titleIdx);
  const caseName = (before.split(/주소복사/).pop() || '').replace(/\s+/g, ' ').trim();
  const date = `${t[2]}-${t[3].padStart(2, '0')}-${t[4].padStart(2, '0')}`;
  const base = {
    caseNo: no,
    precSeq: Number(seq),
    court: t[1],
    level: COURT_LEVEL(t[1]),
    date,
    kind: `${t[6] ? '전원합의체 ' : ''}${t[7]}`,
    caseName,
    title: t[0].slice(1, -1).replace(/\s+/g, ' '),
    url: caseUrl(no),
  };
  if (!full) return base;
  return {
    ...base,
    issues: section(text, '판시사항'),
    summary: section(text, '판결요지'),
    refs: section(text, '참조조문'),
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--check' || args[0] === '--dump') {
    const full = args[0] === '--dump';
    for (const no of args.slice(1)) {
      const r = await fetchCase(no, { full });
      if (!r) console.log(JSON.stringify({ caseNo: no, found: false }));
      else if (!full) console.log(JSON.stringify({ caseNo: no, found: true, title: r.title, caseName: r.caseName, hasHolding: undefined }));
      else console.log(JSON.stringify({ found: true, ...r }, null, 1));
      await sleep(250);
    }
    return;
  }

  const srcPath = path.join(root, 'data/platform/precedents-src.json');
  const outPath = path.join(root, 'data/platform/precedents.json');
  const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  const prev = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf8')) : [];
  const cache = new Map(prev.map((p) => [p.caseNo, p]));
  const out = [];
  const dropped = [];
  for (const s of src) {
    let r = cache.get(s.caseNo);
    if (!r || process.env.REFRESH) {
      r = await fetchCase(s.caseNo);
      await sleep(250);
    }
    if (!r) {
      dropped.push(`${s.caseNo}: 원문을 찾을 수 없음`);
      continue;
    }
    if (!r.issues && !r.summary) {
      dropped.push(`${s.caseNo}: 판시사항·판결요지가 없는 판례`);
      continue;
    }
    out.push({ ...r, provisions: s.provisions || [], category: s.category || '', point: s.point || '' });
  }
  out.sort((a, b) => b.date.localeCompare(a.date));
  fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
  console.log(`판례 ${out.length}건 저장 · 제외 ${dropped.length}건`);
  dropped.forEach((d) => console.log('  제외: ' + d));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
