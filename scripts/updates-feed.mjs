/* '이번 주 바뀐 것' 장부 — 새로 공포·시행된 개정, 새 판례, 사이트 소식을 날짜와 함께 모은다.
   결과: data/auto/updates.json → 빌드 때 public/updates.json(다음 실행이 읽을 장부)과 public/updates.xml(RSS)로 나간다.

   배포 서버에는 저장 공간이 없어서, 지난번 배포본의 장부(<사이트>/updates.json)를 받아 와
   "언제 처음 알렸는지"를 이어 간다. 받지 못하면(첫 배포·접속 실패) 저장소에 커밋된 장부로 이어 쓰고,
   그것도 없으면 각 사건의 날짜로 시작한다.
   - firstSeen(화면의 날짜): 공포·새 판례는 처음 발견한 날, 시행·시행 임박·사이트 소식은 그 일의 날짜
   - firstSeenAt(RSS 게시 시각): 모든 항목이 장부에 처음 실린 실제 시각 — 구독 도구는 '마지막 확인 뒤에 게시된 것'만 알리므로
   지난 장부에서 이어 남기는 것은 발견형(공포·판례)뿐이다 — 시행·사이트 소식은 매번 원본에서 다시 계산한다.
   이 스크립트는 기계적으로 모으기만 하고, 해설은 사람이 검증해 넣은 달라지는 노동법(changes.json)의 것만 쓴다. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p, fallback) => {
  const f = path.join(root, p);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : fallback;
};
const OUT = path.join(root, 'data/auto/updates.json');
const SITE = (process.env.UPDATES_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://udan-sc.github.io/hr-desk').replace(/\/$/, '');
const KEEP_DAYS = 120;
const SOON_DAYS = 7;
const TYPES = ['promulgated', 'effective', 'soon', 'precedent', 'site'];
const DISCOVERED = new Set(['promulgated', 'precedent']);

const runAt = new Date().toISOString();
const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const since = addDays(today, -KEEP_DAYS);
const cut = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n).trimEnd() + '…' : t;
};
const fmt = (iso) => iso.split('-').map(Number).join('. ') + '.';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/* 장부 항목 모양 확인 — 하나라도 깨진 항목이 빌드(RSS 생성)를 막지 않게 걸러 낸다 */
const validItem = (x) =>
  x &&
  typeof x.id === 'string' &&
  TYPES.includes(x.type) &&
  ISO_DAY.test(x.date || '') &&
  ISO_DAY.test(x.firstSeen || '') &&
  typeof x.title === 'string' &&
  typeof x.href === 'string' &&
  (x.href.startsWith('/') || x.href.startsWith('https://www.law.go.kr/'));
const validLedger = (j) => (j && Array.isArray(j.items) ? { ...j, items: j.items.filter(validItem) } : null);

/* 지난 배포본 장부: 404(아직 배포 전)와 접속 실패를 구분하고, 실패는 몇 번 다시 시도한다 */
async function loadDeployed() {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${SITE}/updates.json?t=${Date.now()}`, {
        headers: { 'User-Agent': 'hr-desk updates', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(15000),
      });
      if (res.status === 404) return { status: 'none' };
      if (res.ok) {
        const j = validLedger(await res.json());
        if (j) return { status: 'ok', ledger: j };
      }
    } catch {
      /* 잠시 뒤 다시 */
    }
    await sleep(2000 * (i + 1));
  }
  return { status: 'error' };
}

async function main() {
  const lawWatch = readJson('data/auto/law-watch.json', { laws: {}, provisions: {} });
  const changes = readJson('data/platform/changes.json', []);
  const precAuto = readJson('data/auto/precedents-auto.json', { items: [] });
  const siteNews = readJson('data/platform/site-updates.json', []);
  const provs = readJson('data/provisions.json', []).flatMap((a) => a.provisions);
  const provHref = (law, article) =>
    provs.some((p) => p.law === law && p.article === article) ? `/law/${encodeURIComponent(law)}/${encodeURIComponent(article)}` : null;

  const deployed = await loadDeployed();
  /* 배포본 장부를 받지 못했는데(접속 실패) 낡은 저장소 장부로 이어 쓰면, 그사이 발견한 항목의 날짜가 바뀌거나
     사라진 채 굳는다. 그래서 이번 회차는 장부를 만들지 않고 실패로 끝낸다(배포도 멈춤 — 다음 회차가 다시 시도).
     저장소 장부로 이어 쓰는 것은 아직 배포본이 없을 때(404, 첫 배포)뿐이다. */
  if (deployed.status === 'error') {
    console.error(`지난 배포본 장부(${SITE}/updates.json)를 받지 못해 이번 회차는 장부를 갱신하지 않습니다.`);
    process.exitCode = 1;
    return;
  }
  const committed = validLedger(readJson('data/auto/updates.json', null));
  const ledger = deployed.status === 'ok' ? deployed.ledger : committed;
  const ledgerFrom = deployed.status === 'ok' ? 'deployed' : committed ? 'repo (배포본 없음)' : 'none';
  const prev = new Map((ledger?.items || []).map((x) => [x.id, x]));

  const curatedOf = (law, official, efYd) => changes.filter((c) => (c.law === law || c.law === official) && c.effectiveDate === efYd);

  /* ── 1. 공포된 법률 단위 기록(법령+법률번호) — 시행일이 여러 날로 나뉜 법률도 공포는 한 번이다 ── */
  const acts = new Map();
  const addVersion = (law, official, lawNo, ancYd, kind, v) => {
    if (!lawNo || !ancYd) return;
    const key = `${law}|${lawNo}`;
    if (!acts.has(key)) acts.set(key, { law, official, lawNo, ancYd, kind, versions: [] });
    const act = acts.get(key);
    if (!act.versions.some((x) => x.efYd === v.efYd)) act.versions.push(v);
  };
  for (const [law, l] of Object.entries(lawWatch.laws || {})) {
    for (const u of l.upcoming || []) {
      if (!u.notable && !curatedOf(law, l.official, u.efYd).length) continue;
      addVersion(law, l.official, u.lawNo, u.ancYd, u.kind, { efYd: u.efYd, changedArticles: u.changedArticles || [], reason: u.reason || '' });
    }
    const c = l.current;
    if (c?.ancYd && c.efYd) {
      /* 현행 개정이 우리 조문을 바꿨는지: 기준일 뒤 원문이 바뀌었고 마지막 개정 표시가 이 개정의 공포일인 조문 */
      const changed = Object.entries(lawWatch.provisions || {})
        .filter(([k, p]) => k.startsWith(law + '|') && p.changedSinceBase && p.latestAmend === c.ancYd)
        .map(([k]) => k.split('|')[1]);
      if (changed.length || curatedOf(law, l.official, c.efYd).length)
        addVersion(law, l.official, c.lawNo, c.ancYd, c.kind, { efYd: c.efYd, changedArticles: changed, reason: '' });
    }
  }
  /* 지난 장부의 공포·시행 임박 기록이 가진 개정 정보도 이어 받는다 — 해설 없이 자동 감지된 개정이
     시행일에 '시행 예정'에서 빠져도 시행 소식을 낼 수 있게 */
  for (const x of prev.values()) {
    const m = x.type === 'promulgated' || x.type === 'soon' ? x.meta : null;
    if (m?.law && Array.isArray(m.versions)) m.versions.forEach((v) => addVersion(m.law, m.official, m.lawNo, m.ancYd, m.kind, v));
  }

  const events = [];
  const versionHref = (act, v, curated) => {
    if (curated.length) return `/changes#${curated[0].id}`;
    if (v.efYd > today) return `/changes#auto-${act.law}-${v.efYd}-${act.lawNo}`;
    return v.changedArticles.map((a) => provHref(act.law, a)).find(Boolean) || '/changes';
  };

  for (const act of acts.values()) {
    act.versions.sort((a, b) => a.efYd.localeCompare(b.efYd));
    const title = `${act.law} ${act.kind || '개정'}`;
    const perVersion = act.versions.map((v) => ({ v, curated: curatedOf(act.law, act.official, v.efYd) }));
    if (act.ancYd >= since) {
      const titles = perVersion.flatMap((p) => p.curated.map((c) => c.title));
      const firstUpcoming = perVersion.find((p) => p.v.efYd > today) || perVersion[0];
      events.push({
        id: `prom-${act.law}-${act.lawNo}`,
        type: 'promulgated',
        date: act.ancYd,
        efYds: act.versions.map((v) => v.efYd),
        title,
        summary: titles.length ? titles.join(' · ') : cut(act.versions.find((v) => v.reason)?.reason, 150) || '',
        href: versionHref(act, firstUpcoming.v, firstUpcoming.curated),
        law: act.law,
        meta: { law: act.law, official: act.official, lawNo: act.lawNo, ancYd: act.ancYd, kind: act.kind, versions: act.versions },
      });
    }
    /* 사람이 해설을 붙인 시행분은 아래 changes.json 쪽에서 시행 소식을 낸다 */
    for (const { v, curated } of perVersion) {
      if (curated.length) continue;
      const href = versionHref(act, v, curated);
      const arts = v.changedArticles.join(', ');
      if (v.efYd <= today && v.efYd >= since)
        events.push({ id: `eff-${act.law}-${act.lawNo}-${v.efYd}`, type: 'effective', date: v.efYd, title, summary: arts ? `바뀐 우리 조문: ${arts}` : cut(v.reason, 150), href, law: act.law });
      if (v.efYd > today && addDays(v.efYd, -SOON_DAYS) <= today)
        events.push({
          id: `soon-${act.law}-${act.lawNo}-${v.efYd}`,
          type: 'soon',
          date: addDays(v.efYd, -SOON_DAYS),
          efYd: v.efYd,
          title,
          summary: arts ? `바뀌는 우리 조문: ${arts}` : cut(v.reason, 150),
          href,
          law: act.law,
          meta: { law: act.law, official: act.official, lawNo: act.lawNo, ancYd: act.ancYd, kind: act.kind, versions: [v] },
        });
    }
  }

  /* ── 2. 달라지는 노동법(사람이 검증한 해설) — 시행·시행 임박 ──
     자동 감지로 먼저 알린 개정에 나중에 해설을 붙이면, 그 알림의 id(RSS guid)를 물려받아 같은 소식이 두 번 나가지 않게 한다 */
  const autoPrev = new Map();
  for (const x of prev.values()) {
    if ((x.type === 'effective' || x.type === 'soon') && !/^(eff|soon)-c-/.test(x.id) && x.law)
      autoPrev.set(`${x.type}|${x.law}|${x.type === 'soon' ? x.efYd : x.date}`, x.id);
  }
  const takeId = (type, c, fallback) => {
    const k = `${type}|${c.law}|${c.effectiveDate}`;
    const id = autoPrev.get(k);
    if (!id) return fallback;
    autoPrev.delete(k);
    return id;
  };
  for (const c of changes) {
    const href = `/changes#${c.id}`;
    if (c.effectiveDate <= today && c.effectiveDate >= since)
      events.push({ id: takeId('effective', c, `eff-${c.id}`), type: 'effective', date: c.effectiveDate, title: c.title, summary: cut(c.change, 150), href, law: c.law });
    if (c.effectiveDate > today && addDays(c.effectiveDate, -SOON_DAYS) <= today)
      events.push({ id: takeId('soon', c, `soon-${c.id}`), type: 'soon', date: addDays(c.effectiveDate, -SOON_DAYS), efYd: c.effectiveDate, title: c.title, summary: cut(c.change, 150), href, law: c.law });
  }

  /* ── 3. 자동 수집된 새 판례 ── */
  for (const p of precAuto.items || []) {
    if (!ISO_DAY.test(p.date || '') || !p.caseNo) continue;
    events.push({
      id: `prec-${p.caseNo}`,
      type: 'precedent',
      date: p.date,
      title: `${p.court || '대법원'} ${fmt(p.date)} 선고 ${p.caseNo} ${p.caseName || ''}`.trim(),
      summary: cut(p.issues, 150),
      href: `/cases?q=${encodeURIComponent(p.caseNo)}`,
    });
  }

  /* ── 4. 사이트 소식(새 기능·자료 추가) ── */
  for (const s of siteNews) {
    if (!ISO_DAY.test(s.date || '') || s.date < since || s.date > today) continue;
    events.push({ id: `site-${s.id}`, type: 'site', date: s.date, title: s.title, summary: s.summary || '', href: s.href || '/' });
  }

  /* ── 장부 합치기 ── */
  const seen = new Set();
  const items = [];
  for (const e of events) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    const old = prev.get(e.id);
    let firstSeen = DISCOVERED.has(e.type) ? old?.firstSeen || (ledger ? today : e.date) : e.date;
    if (firstSeen < e.date) firstSeen = e.date;
    items.push({ ...e, firstSeen, firstSeenAt: old?.firstSeenAt || runAt });
  }
  /* 이번 계산에 없지만 장부에 남은 발견형(예: 수집이 잠깐 실패한 판례)은 보존 기간 안이면 이어 둔다.
     이번 빌드의 판례 목록에 없는 판례는 사이트 안 검색이 비므로 국가법령정보센터 원문으로 잇는다 */
  for (const x of prev.values()) {
    if (seen.has(x.id) || !DISCOVERED.has(x.type)) continue;
    if (x.type === 'precedent') items.push({ ...x, href: `https://www.law.go.kr/판례/(${x.id.replace(/^prec-/, '')})` });
    else items.push(x);
  }

  const ORDER = { site: 0, effective: 1, promulgated: 2, precedent: 3, soon: 4 };
  const kept = items
    .filter((x) => x.firstSeen >= since)
    .sort((a, b) => b.firstSeen.localeCompare(a.firstSeen) || ORDER[a.type] - ORDER[b.type] || a.title.localeCompare(b.title, 'ko'));
  const out = { updatedAt: runAt, today, ledger: ledgerFrom, items: kept };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  const week = kept.filter((x) => x.firstSeen >= addDays(today, -6));
  console.log(`바뀐 것 장부 ${kept.length}건(이번 주 ${week.length}건) · 지난 장부: ${ledgerFrom}${ledger ? ` ${prev.size}건` : ''}`);
}

main().catch((e) => {
  console.error(e);
  /* 실패는 Actions 화면에 드러나게 하되(continue-on-error라 배포는 계속), 지난 장부 파일은 그대로 쓴다 */
  process.exitCode = 1;
});
