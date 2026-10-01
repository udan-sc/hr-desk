import calculatorsRaw from '../data/platform/calculators.json';
import processesRaw from '../data/platform/processes.json';
import calendarRaw from '../data/platform/calendar.json';
import documentsRaw from '../data/platform/documents.json';
import interpretationsRaw from '../data/platform/interpretations.json';
import glossaryRaw from '../data/platform/glossary.json';
import changesRaw from '../data/platform/changes.json';
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
