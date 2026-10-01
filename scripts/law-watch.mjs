/* 법령 자동 감시 — 매주 GitHub Actions가 돌린다(사람·AI 개입 없음, 국가법령정보센터 원문만 사용).

   하는 일
   1. 우리 사이트가 다루는 법령마다 개정 이력을 받아 '공포됐지만 아직 시행 전'인 개정을 찾는다.
   2. 우리 조문 187개의 원문을 받아, 기준일(BASE_DATE) 시점 원문과 글자 단위로 비교해 바뀐 조문을 찾는다.
   3. 시행 예정 개정 각각에 대해 우리 조문 중 무엇이 바뀌는지 원문끼리 비교해 찾는다.

   사용법
     node scripts/law-watch.mjs              → data/auto/law-watch.json 갱신 (사이트 빌드가 읽음)
     node scripts/law-watch.mjs --baseline   → data/auto/law-baseline.json 생성 (기준일 시점 원문 지문, 커밋해 둠)

   원문을 못 받아도 빌드는 멈추지 않는다: 실패한 법령은 errors에 남기고 이전 결과를 유지한다. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { LAW_OFFICIAL } from '../lib/lawlinks.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://www.law.go.kr';
const BASE_DATE = '2026-09-11'; /* lib/data.js의 BASE_DATE와 같은 날 — 사이트 조문 요약의 기준일 */
const AUTO_DIR = path.join(root, 'data/auto');
const WATCH_FILE = path.join(AUTO_DIR, 'law-watch.json');
const BASELINE_FILE = path.join(AUTO_DIR, 'law-baseline.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(encodeURI(url), { headers: { 'User-Agent': 'Mozilla/5.0 (hr-desk law watch)' } });
      if (res.ok) return await res.text();
    } catch {
      /* 잠시 뒤 다시 */
    }
    await sleep(1000 * (i + 1));
  }
  throw new Error(`받지 못함: ${url}`);
}
const toText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
const ymd = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
const hash = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 16);
const officialOf = (law) => LAW_OFFICIAL[law] || law;

/* 사이트 조문 표기("제43조의2·제43조의3", "제23조제2항")를 원문 조 단위 키("43-2", "23")로 */
function articleKeys(article) {
  return String(article)
    .split('·')
    .map((a) => a.match(/제(\d+)조(?:의(\d+))?/))
    .filter(Boolean)
    .map((m) => (m[2] ? `${m[1]}-${m[2]}` : m[1]));
}

/* 법령 본문에서 조문별 원문을 잘라낸다. 같은 조가 두 번 나오면(부칙 등) 본문의 첫 번째를 쓴다. */
function splitArticles(text) {
  const re = /제(\d+)조(?:의(\d+))?\s*(?=\(|삭제)/g;
  const heads = [];
  let m;
  while ((m = re.exec(text))) {
    /* "제60조(연차 유급휴가)" 꼴의 조 머리만 — 본문 속 "제60조(…)에 따른" 인용과 구분하기 위해
       괄호 안이 짧고 바로 ①이나 본문이 이어지는지는 따지지 않고, 순서상 첫 등장만 쓴다 */
    heads.push({ key: m[2] ? `${m[1]}-${m[2]}` : m[1], at: m.index });
  }
  const out = {};
  heads.forEach((h, i) => {
    if (out[h.key]) return;
    const end = i + 1 < heads.length ? heads[i + 1].at : text.length;
    out[h.key] = text.slice(h.at, end).trim();
  });
  return out;
}
const norm = (s) => s.replace(/\s+/g, '').replace(/[<>\[\]]/g, '');

/* 조문 원문 속 <개정 2020. 3. 31.> · [본조신설 …] · [전문개정 …] 표시에서 가장 최근 날짜 */
function latestAmend(articleText) {
  const marks = articleText.match(/<[^>]*(개정|신설)[^>]*>|\[[^\]]*(신설|개정)[^\]]*\]/g) || [];
  let best = null;
  for (const mk of marks) {
    for (const d of mk.matchAll(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./g)) {
      const iso = `${d[1]}-${d[2].padStart(2, '0')}-${d[3].padStart(2, '0')}`;
      if (!best || iso > best) best = iso;
    }
  }
  return best;
}

async function lawInfo(official) {
  const shell = await get(`${BASE}/법령/${official}`);
  const lsiSeq = (shell.match(/lsiSeq=(\d+)/) || [])[1];
  const efYd = (shell.match(/efYd=(\d{8})/) || [])[1];
  if (!lsiSeq) throw new Error(`법령을 찾지 못함: ${official}`);
  const info = await get(`${BASE}/LSW/lsInfoP.do?lsiSeq=${lsiSeq}&chrClsCd=010202&urlMode=lsInfoP&efYd=${efYd}&ancYnChk=0`);
  const lsId = (info.match(/id="lsId"\s+name="lsId"\s+value="(\d+)"/) || [])[1];
  if (!lsId) throw new Error(`법령 ID를 찾지 못함: ${official}`);
  const hst = await get(`${BASE}/LSW/lsHstListR.do?lsId=${lsId}`);
  const versions = [...hst.matchAll(/lsViewLsHst2\('(\d+)',\s*'(\d{8})',\s*'(\d+)',\s*'(\d{8})',\s*'\w*',\s*'\w*'\s*,\s*'([^']*)'\)/g)].map((v) => ({
    lsiSeq: v[1],
    ancYd: ymd(v[2]),
    lawNo: v[3],
    efYd: ymd(v[4]),
    kind: v[5],
  }));
  return { lsiSeq, efYd: ymd(efYd), lsId, versions };
}

/* 공식 '개정이유 및 주요내용' (법제처 제공) — 자동 감지된 개정을 설명할 때 글자 그대로 쓴다 */
const reasonCache = new Map();
const bodyCache = new Map(); /* 제정·개정문 전체 — 어느 조문을 고치는 개정인지 가릴 때 쓴다 */
async function amendReason(lsiSeq) {
  if (reasonCache.has(lsiSeq)) return reasonCache.get(lsiSeq);
  let reason = '';
  try {
    const html = await get(`${BASE}/LSW/lsRvsDocInfoR.do?lsiSeq=${lsiSeq}&chrClsCd=010202`);
    const t = html
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/[ \t]+/g, ' ');
    const docStart = t.indexOf('제정·개정문');
    bodyCache.set(lsiSeq, docStart >= 0 ? t.slice(docStart).replace(/\s+/g, ' ') : '');
    const start = t.indexOf('개정이유 및 주요내용');
    if (start >= 0) {
      const end = t.indexOf('<법제처 제공>', start);
      reason = t
        .slice(start + '개정이유 및 주요내용'.length, end > start ? end : start + 1500)
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .join('\n')
        .trim();
    }
  } catch {
    /* 개정이유를 못 받아도 감지 결과는 그대로 싣는다 */
  }
  reasonCache.set(lsiSeq, reason);
  return reason;
}

async function articlesAt(lsiSeq, efYd) {
  const body = await get(`${BASE}/LSW/lsInfoR.do?lsiSeq=${lsiSeq}&efYd=${efYd.replace(/-/g, '')}&chrClsCd=010202&ancYnChk=0`);
  return splitArticles(toText(body));
}

async function main() {
  const baselineMode = process.argv.includes('--baseline');
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10); /* 한국 날짜 */
  const raw = JSON.parse(fs.readFileSync(path.join(root, 'data/provisions.json'), 'utf8'));
  const provisions = raw.flatMap((a) => a.provisions.map((p) => ({ law: p.law, article: p.article })));
  const laws = [...new Set(provisions.map((p) => p.law))];
  fs.mkdirSync(AUTO_DIR, { recursive: true });

  const prev = fs.existsSync(WATCH_FILE) ? JSON.parse(fs.readFileSync(WATCH_FILE, 'utf8')) : null;
  const baseline = !baselineMode && fs.existsSync(BASELINE_FILE) ? JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')) : null;

  const out = {
    checkedAt: today,
    /* 어디서 돌았는지 — 배포 뒤 GitHub 서버에서 실제로 원문을 받았는지 확인할 때 쓴다 */
    runner: process.env.GITHUB_ACTIONS ? 'github-actions' : 'local',
    runAt: new Date().toISOString(),
    baseDate: BASE_DATE,
    ok: true,
    errors: [],
    laws: {},
    provisions: {},
  };
  const baseOut = { baseDate: BASE_DATE, createdAt: today, hashes: {}, versions: {} };

  for (const law of laws) {
    const official = officialOf(law);
    try {
      const info = await lawInfo(official);
      await sleep(300);
      const mine = provisions.filter((p) => p.law === law);

      if (baselineMode) {
        /* 기준일에 시행 중이던 버전: 시행일이 기준일 이하인 것 중 가장 늦은 것 */
        const atBase = info.versions.filter((v) => v.efYd <= BASE_DATE).sort((a, b) => b.efYd.localeCompare(a.efYd))[0];
        if (!atBase) throw new Error(`기준일 시점 버전을 찾지 못함: ${official}`);
        const arts = await articlesAt(atBase.lsiSeq, atBase.efYd);
        await sleep(300);
        for (const p of mine) {
          const keys = articleKeys(p.article);
          baseOut.hashes[`${p.law}|${p.article}`] = keys.map((k) => (arts[k] ? hash(norm(arts[k])) : null));
        }
        baseOut.versions[law] = info.versions.map((v) => v.lsiSeq);
        console.log(`기준선 ${law}: ${atBase.efYd} 시행본, 조문 ${mine.length}개`);
        continue;
      }

      /* 같은 공포 법률이 날짜를 나눠 시행되면 버전 번호가 같으므로 시행일까지 맞춰 고른다 */
      const current = info.versions.find((v) => v.lsiSeq === info.lsiSeq && v.efYd === info.efYd) || { lsiSeq: info.lsiSeq, efYd: info.efYd };
      const arts = await articlesAt(info.lsiSeq, info.efYd);
      await sleep(300);

      /* 시행 예정 개정 — 시행일 순으로, 바로 앞 시점 원문과 비교해 '그 개정이 새로 바꾸는' 조문만 잡는다.
         (현재 원문과 비교하면 앞선 개정의 변경이 뒤 개정마다 되풀이되어 잡힌다)
         같은 날 시행되는 개정이 여럿이면 개정문에 그 조문이 적힌 개정에 돌린다. */
      const upcoming = [];
      const future = info.versions.filter((x) => x.efYd > today).sort((a, b) => a.efYd.localeCompare(b.efYd));
      const dates = [...new Set(future.map((v) => v.efYd))];
      let prevArts = arts;
      for (const date of dates) {
        const group = future.filter((v) => v.efYd === date);
        let changedKeys = [];
        try {
          const fut = await articlesAt(group[0].lsiSeq, date);
          await sleep(300);
          changedKeys = mine.filter((p) =>
            articleKeys(p.article).some((k) => (fut[k] ? norm(fut[k]) : '') !== (prevArts[k] ? norm(prevArts[k]) : ''))
          );
          prevArts = fut;
        } catch (e) {
          out.errors.push(`${law} ${date} 시행본 비교 실패: ${e.message}`);
        }
        for (const v of group) {
          let changed = changedKeys.map((p) => p.article);
          if (group.length > 1 && changed.length) {
            await amendReason(v.lsiSeq);
            const body = bodyCache.get(v.lsiSeq) || '';
            const mentioned = changedKeys
              .filter((p) => String(p.article).split('·').some((a) => new RegExp(`${(a.match(/제\d+조(?:의\d+)?/) || [''])[0]}(?![의\\d])`).test(body)))
              .map((p) => p.article);
            /* 개정문에서 하나도 못 찾으면(타법개정 등) 그룹 전체에 남겨 둔다 */
            if (mentioned.length) changed = mentioned;
            else if (body) changed = [];
          }
          /* 타법개정은 다른 법의 용어 정리처럼 우리와 무관한 경우가 많다 — 일부·전부개정·제정이거나
             우리 조문을 실제로 바꾸는 것만 '주목할 개정'으로 표시하고 공식 개정이유를 붙인다 */
          const notable = /일부개정|전부개정|제정/.test(v.kind) || changed.length > 0;
          const reason = notable ? await amendReason(v.lsiSeq) : '';
          upcoming.push({ ...v, changedArticles: changed, notable, reason });
        }
      }

      out.laws[law] = {
        official,
        lsId: info.lsId,
        current: { lsiSeq: current.lsiSeq, efYd: current.efYd, ancYd: current.ancYd || null, lawNo: current.lawNo || null, kind: current.kind || null },
        upcoming,
      };

      for (const p of mine) {
        const key = `${p.law}|${p.article}`;
        const ks = articleKeys(p.article);
        const texts = ks.map((k) => arts[k] || '');
        const nowHashes = texts.map((t) => (t ? hash(norm(t)) : null));
        const baseHashes = baseline?.hashes?.[key];
        const amend = texts.map(latestAmend).filter(Boolean).sort().pop() || null;
        out.provisions[key] = {
          latestAmend: amend,
          /* 기준선 지문이 있을 때만 판단한다(원문을 못 찾은 조는 비교하지 않음) */
          changedSinceBase: Boolean(baseHashes && nowHashes.some((h, i) => h && baseHashes[i] && h !== baseHashes[i])),
          upcoming: upcoming.filter((v) => v.changedArticles.includes(p.article)).map((v) => ({ efYd: v.efYd, lawNo: v.lawNo, ancYd: v.ancYd, lsiSeq: v.lsiSeq })),
          found: texts.every(Boolean),
        };
      }
      console.log(`확인 ${law}: 현행 ${current.efYd} 시행 · 시행 예정 ${upcoming.length}건`);
    } catch (e) {
      out.ok = false;
      out.errors.push(`${law}: ${e.message}`);
      console.log(`실패 ${law}: ${e.message}`);
      /* 이 법령은 지난 결과를 그대로 둔다 */
      if (prev?.laws?.[law]) out.laws[law] = prev.laws[law];
      for (const p of provisions.filter((x) => x.law === law)) {
        const k = `${p.law}|${p.article}`;
        if (prev?.provisions?.[k]) out.provisions[k] = prev.provisions[k];
      }
    }
  }

  if (baselineMode) {
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseOut, null, 1));
    console.log(`기준선 저장: 조문 ${Object.keys(baseOut.hashes).length}개`);
    return;
  }
  /* 한 법령도 못 받았으면 기존 파일을 덮어쓰지 않는다 */
  if (!Object.keys(out.laws).length && prev) {
    console.log('국가법령정보센터에 접속하지 못해 이전 결과를 유지합니다.');
    return;
  }
  fs.writeFileSync(WATCH_FILE, JSON.stringify(out, null, 1));
  const changed = Object.values(out.provisions).filter((x) => x.changedSinceBase).length;
  const up = Object.values(out.laws).reduce((n, l) => n + l.upcoming.length, 0);
  console.log(`저장: 기준일 뒤 바뀐 조문 ${changed}개 · 시행 예정 개정 ${up}건 · 오류 ${out.errors.length}건`);
}

main().catch((e) => {
  console.error(e);
  process.exit(0); /* 감시 실패로 배포가 막히지 않게 한다 */
});
