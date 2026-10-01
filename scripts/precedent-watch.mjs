/* 새 판례 자동 수집 — 법제처 Open API 인증키(LAW_OC)가 있을 때만 동작한다.
   GitHub 저장소 Settings → Secrets → Actions에 LAW_OC(open.law.go.kr에서 받은 인증키 ID)를 넣으면 켜진다.

   1. 우리 법령 이름으로 최근 대법원 판례를 검색한다(Open API — 검색만 키가 필요).
   2. 기준일 이후 선고된 판례 중 수록 판례에 없는 것을 골라, 원문(판시사항·판결요지·참조조문)을
      국가법령정보센터에서 글자 그대로 받는다(scripts/fetch-precedents.mjs).
   3. 참조조문에 우리 조문이 들어 있는 판례만 그 조문에 연결해 data/auto/precedents-auto.json에 쓴다.
      → 사람이 고르지 않았으므로 화면에 '자동 추가' 표시가 붙고, 한 줄 요지는 비어 있다. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchCase } from './fetch-precedents.mjs';
import { LAW_OFFICIAL } from '../lib/lawlinks.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'data/auto/precedents-auto.json');
const SINCE = '2026-09-11'; /* 수록 판례를 고른 기준일 — 이 뒤에 선고된 판례만 자동으로 더한다 */
const OC = process.env.LAW_OC || '';
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const write = (obj) => {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(obj, null, 1));
};

/* 응답 모양이 조금 달라도 '사건번호'가 있는 객체를 모두 모은다 */
function collect(node, out = []) {
  if (Array.isArray(node)) node.forEach((x) => collect(x, out));
  else if (node && typeof node === 'object') {
    if (node['사건번호']) out.push(node);
    Object.values(node).forEach((v) => collect(v, out));
  }
  return out;
}

async function main() {
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { items: [] };
  if (!OC) {
    write({ ...prev, checkedAt: prev.checkedAt || null, enabled: false, note: '인증키(LAW_OC)가 없어 건너뜀' });
    console.log('LAW_OC가 없어 새 판례 수집을 건너뜁니다.');
    return;
  }

  const raw = JSON.parse(fs.readFileSync(path.join(root, 'data/provisions.json'), 'utf8'));
  const provisions = raw.flatMap((a) => a.provisions.map((p) => ({ law: p.law, article: p.article, category: a.category })));
  const curated = new Set(JSON.parse(fs.readFileSync(path.join(root, 'data/platform/precedents.json'), 'utf8')).map((p) => p.caseNo));
  const known = new Map((prev.items || []).map((p) => [p.caseNo, p]));
  const laws = [...new Set(provisions.map((p) => p.law))];
  const errors = [];

  const candidates = new Map();
  for (const law of laws) {
    const name = LAW_OFFICIAL[law] || law;
    const url =
      `https://www.law.go.kr/DRF/lawSearch.do?OC=${encodeURIComponent(OC)}&target=prec&type=JSON` +
      `&query=${encodeURIComponent(name)}&search=2&sort=ddes&display=100&org=400201`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      for (const r of collect(json)) {
        const no = String(r['사건번호']).replace(/\s+/g, '');
        const d = String(r['선고일자'] || '').replace(/\D/g, '');
        const date = d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : '';
        if (date && date > SINCE && !curated.has(no)) candidates.set(no, date);
      }
    } catch (e) {
      errors.push(`${law} 검색 실패: ${e.message}`);
    }
    await sleep(300);
  }

  const items = [];
  for (const [no] of candidates) {
    if (known.has(no)) {
      items.push(known.get(no));
      continue;
    }
    const c = await fetchCase(no);
    await sleep(300);
    if (!c || c.level !== '대법원' || (!c.issues && !c.summary)) continue;
    /* 참조조문에 우리 조문이 직접 나오는 판례만 연결한다(예: "근로기준법 제60조") */
    const refs = (c.refs || '').replace(/\s+/g, ' ');
    const linked = provisions.filter((p) => {
      const name = LAW_OFFICIAL[p.law] || p.law;
      return String(p.article)
        .split('·')
        .map((a) => (a.match(/제\d+조(?:의\d+)?/) || [])[0])
        .filter(Boolean)
        .some((a) => new RegExp(`(?<!구\\s?)(${name}|${p.law})\\s*${a}(?![의\\d])`).test(refs));
    });
    if (!linked.length) continue;
    items.push({
      ...c,
      provisions: linked.slice(0, 3).map((p) => ({ law: p.law, article: p.article })),
      category: linked[0].category,
      point: '',
      auto: true,
    });
  }

  items.sort((a, b) => b.date.localeCompare(a.date));
  write({ checkedAt: today, enabled: true, since: SINCE, errors, items });
  console.log(`새 판례 ${items.length}건 (후보 ${candidates.size}건) · 오류 ${errors.length}건`);
}

main().catch((e) => {
  console.error(e);
  process.exit(0); /* 수집 실패로 배포가 막히지 않게 한다 */
});
