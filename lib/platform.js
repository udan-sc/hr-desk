import calculatorsRaw from '../data/platform/calculators.json';
import processesRaw from '../data/platform/processes.json';
import calendarRaw from '../data/platform/calendar.json';
import documentsRaw from '../data/platform/documents.json';
import interpretationsRaw from '../data/platform/interpretations.json';
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

export const calculatorByKey = (key) => calculators.find((c) => c.key === key) || null;
export const processBySlug = (slug) => processes.find((p) => p.slug === slug) || null;
