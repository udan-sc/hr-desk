import calculatorsRaw from '../data/platform/calculators.json';
import processesRaw from '../data/platform/processes.json';
import calendarRaw from '../data/platform/calendar.json';
import documentsRaw from '../data/platform/documents.json';
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

export const calculatorByKey = (key) => calculators.find((c) => c.key === key) || null;
export const processBySlug = (slug) => processes.find((p) => p.slug === slug) || null;
