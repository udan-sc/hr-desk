import calculatorsRaw from '../data/platform/calculators.json';
import processesRaw from '../data/platform/processes.json';
import calendarRaw from '../data/platform/calendar.json';
import documentsRaw from '../data/platform/documents.json';
import interpretationsRaw from '../data/platform/interpretations.json';
import glossaryRaw from '../data/platform/glossary.json';
import changesRaw from '../data/platform/changes.json';
import precedentsRaw from '../data/platform/precedents.json';
import { findProvision } from './data';

/* (law, article) 인용을 실제 조문 데이터와 대조해 링크를 붙인다.
   데이터에 없는 인용은 링크 없이 텍스트로만 남는다 — 죽은 링크를 만들지 않는다. */
export function resolveCitations(citations) {
  return (citations || []).map((c) => {
    const p = findProvision(c.law, c.article);
    return {
      law: c.law,
      article: c.article,
      title: p?.title || null,
      href: p?.href || null,
    };
  });
}

export const calculators = calculatorsRaw;
export const processes = processesRaw;
export const documents = documentsRaw;

/* 캘린더는 월 배열을 정리해 두 가지 뷰(월별·전체)에서 쓴다. */
export const obligations = calendarRaw.map((o, i) => ({
  ...o,
  id: `ob-${i + 1}`,
  months: Array.isArray(o.months) ? o.months.filter((m) => m >= 1 && m <= 12) : [],
}));

export const obligationsByMonth = (month) =>
  obligations.filter((o) => o.months.includes(month));

/* 고용노동부 행정해석 — (법령, 조문)으로 찾는다 */
const interpIndex = new Map(
  interpretationsRaw.map((r) => [`${r.law}|${r.article}`, r.interpretations || []])
);
export const interpretationsFor = (law, article) => interpIndex.get(`${law}|${article}`) || [];
export const interpretationStats = {
  provisions: interpretationsRaw.length,
  items: interpretationsRaw.reduce((n, r) => n + (r.interpretations || []).length, 0),
};

/* 국가법령정보센터 '중앙부처 1차 해석' 검색. 확인된 회시가 없을 때 직접 찾아볼 경로를 준다. */
export const LAW_GO_KR_INTERPRETATION_SEARCH = (query) =>
  `https://www.law.go.kr/LSW/cgmExpcSc.do?menuId=15&query=${encodeURIComponent(query)}`;

/* 규정·서식 항목의 앵커 — 문턱 지도 등에서 해당 서류로 바로 이동할 때 쓴다 */
export const docAnchor = (d) => `doc-${documentsRaw.indexOf(d) + 1}`;

export const calculatorByKey = (key) => calculators.find((c) => c.key === key) || null;
export const processBySlug = (slug) => processes.find((p) => p.slug === slug) || null;

/* 용어 사전 — 분류 순서는 여기 고정된 차례를 따른다 */
export const GLOSSARY_CATEGORIES = ['임금', '근로시간·휴일·휴게', '휴가', '계약·신분', '해고·퇴직', '모성보호·돌봄', '괴롭힘·차별', '보험·적용'];
export const glossary = glossaryRaw;

/* 달라지는 노동법 — 시행일 순, 앵커 id는 데이터에 박힌 값을 그대로 쓴다 */
export const changes = [...changesRaw].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));

/* 조문과 연결된 개정 — 조문 상세 상단 배너용 */
export const changesForProvision = (law, article) =>
  changes.filter((c) => (c.citations || []).some((x) => x.law === law && x.article === article));

export const glossaryById = new Map(glossary.map((g) => [g.id, g]));

/* 조문 본문에서 용어 사전 항목을 자동으로 찾아 링크하기 위한 별칭.
   짧은 별칭은 엉뚱한 단어에 걸리기 쉬워 뺐다(예: '시용'). 긴 별칭부터 맞춘다. */
const TERM_ALIASES = [
  ['통상임금', 'ordinary-wage'],
  ['평균임금', 'average-wage'],
  ['최저임금 산입범위', 'minimum-wage-scope'],
  ['최저임금에 산입', 'minimum-wage-scope'],
  ['주휴수당', 'weekly-holiday-pay'],
  ['주휴일', 'weekly-holiday-pay'],
  ['포괄임금', 'inclusive-wage'],
  ['법정근로시간', 'statutory-hours'],
  ['연장근로', 'statutory-hours'],
  ['소정근로시간', 'contractual-hours'],
  ['휴게시간', 'rest-day-leave-break'],
  ['공휴일', 'public-holidays'],
  ['연차 유급휴가', 'annual-leave'],
  ['연차유급휴가', 'annual-leave'],
  ['연차휴가', 'annual-leave'],
  ['사용촉진', 'leave-promotion'],
  ['상시 근로자', 'headcount'],
  ['상시근로자', 'headcount'],
  ['수습', 'probation'],
  ['기간제근로자', 'nonregular-types'],
  ['단시간근로자', 'nonregular-types'],
  ['파견근로자', 'nonregular-types'],
  ['기간의 정함이 없는 근로계약', 'permanent-conversion'],
  ['무기계약', 'permanent-conversion'],
  ['근로자대표', 'worker-rep'],
  ['취업규칙', 'rules-of-employment'],
  ['해고예고', 'dismissal-notice-term'],
  ['해고의 예고', 'dismissal-notice-term'],
  ['부당해고 구제신청', 'unfair-dismissal'],
  ['부당해고', 'unfair-dismissal'],
  ['권고사직', 'resignation-vs-dismissal'],
  ['퇴직급여', 'severance-pension'],
  ['퇴직연금', 'severance-pension'],
  ['퇴직금', 'severance-pension'],
  ['계속근로기간', 'continuous-service'],
  ['계속근로', 'continuous-service'],
  ['육아기 근로시간 단축', 'parental-leave'],
  ['육아휴직', 'parental-leave'],
  ['출산전후휴가', 'maternity-leave'],
  ['직장 내 괴롭힘', 'harassment'],
  ['4대보험', 'four-insurances'],
].filter(([, id]) => glossaryById.has(id));

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const termMatcher = {
  source: TERM_ALIASES.map(([a]) => a)
    .sort((a, b) => b.length - a.length)
    .map(escapeRe)
    .join('|'),
  idOf: Object.fromEntries(TERM_ALIASES),
};

/* 판례 — 법원·선고일·판시사항·판결요지는 국가법령정보센터 원문 그대로(scripts/fetch-precedents.mjs),
   어떤 판례를 실을지와 연결 조문·한 줄 요지만 사람이 고른다(precedents-src.json). 최신순. */
export const precedents = [
  ...precedentsRaw,
  /* 매주 자동 추가된 새 판례(인증키가 있을 때) — 화면에 '자동 추가'로 구분된다 */
  ...(precedentsAutoRaw.items || []).filter((p) => !precedentsRaw.some((q) => q.caseNo === p.caseNo)),
].sort((a, b) => b.date.localeCompare(a.date));
const precIndex = new Map();
precedents.forEach((p) =>
  (p.provisions || []).forEach((x) => {
    const k = `${x.law}|${x.article}`;
    if (!precIndex.has(k)) precIndex.set(k, []);
    precIndex.get(k).push(p);
  })
);
export const precedentsFor = (law, article) => precIndex.get(`${law}|${article}`) || [];
export const precedentDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${y}. ${Number(m)}. ${Number(d)}.`;
};

/* 국가법령정보센터 판례 검색 — 수록되지 않은 판례를 더 찾아볼 때 */
export const LAW_GO_KR_PRECEDENT_SEARCH = (query) =>
  `https://www.law.go.kr/LSW/precSc.do?menuId=7&query=${encodeURIComponent(query)}`;

/* ── 매주 자동 확인(scripts/law-watch.mjs · precedent-watch.mjs) 결과 ──
   국가법령정보센터 원문만 쓰는 기계적 감지라, 사람이 쓴 해설 없이 공식 문구(개정이유)만 보여 준다. */
import lawWatchRaw from '../data/auto/law-watch.json';
import precedentsAutoRaw from '../data/auto/precedents-auto.json';

export const lawWatch = lawWatchRaw;
export const watchStatus = { checkedAt: lawWatchRaw.checkedAt, ok: lawWatchRaw.ok, baseDate: lawWatchRaw.baseDate };
export const watchFor = (law, article) => lawWatchRaw.provisions?.[`${law}|${article}`] || null;
export const lawVersionUrl = (lsiSeq, efYd) =>
  `https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=${lsiSeq}&efYd=${String(efYd).replace(/-/g, '')}&chrClsCd=010202&ancYnChk=0`;
export const amendReasonUrl = (lsiSeq) => `https://www.law.go.kr/LSW/lsRvsDocInfoR.do?lsiSeq=${lsiSeq}&chrClsCd=010202`;

/* 달라지는 노동법에 아직 없는 '주목할' 시행 예정 개정 — 같은 법령·같은 시행일 항목이 이미 있으면 뺀다 */
const curatedKey = new Set(
  changesRaw.flatMap((c) => [`${c.law}|${c.effectiveDate}`])
);
export const autoChanges = Object.entries(lawWatchRaw.laws || {})
  .flatMap(([law, l]) =>
    (l.upcoming || [])
      .filter((u) => u.notable && !curatedKey.has(`${law}|${u.efYd}`) && !curatedKey.has(`${l.official}|${u.efYd}`))
      .map((u) => ({
        id: `auto-${law}-${u.efYd}-${u.lawNo}`,
        auto: true,
        effectiveDate: u.efYd,
        law,
        title: `${law} ${u.kind}${u.changedArticles?.length ? ` — ${u.changedArticles.join('·')} 변경` : ''}`,
        reason: u.reason || '',
        promulgation: `${u.ancYd} 공포, 법률 제${u.lawNo}호 (${u.kind})`,
        sourceUrl: lawVersionUrl(u.lsiSeq, u.efYd),
        reasonUrl: amendReasonUrl(u.lsiSeq),
        citations: (u.changedArticles || []).map((article) => ({ law, article })),
      }))
  )
  .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));

/* 시행 예정 개정 중 이 조문을 바꾸는 것 — 조문 상세 알림용 */
export const upcomingForProvision = (law, article) => watchFor(law, article)?.upcoming || [];

/* 자동 추가된 새 판례(인증키가 있을 때만) — 사람이 고른 수록 판례와 합쳐 쓴다 */
export const precedentsAuto = (precedentsAutoRaw.items || []).filter((p) => !precedentsRaw.some((q) => q.caseNo === p.caseNo));
export const precedentWatch = { enabled: Boolean(precedentsAutoRaw.enabled), checkedAt: precedentsAutoRaw.checkedAt || null };
