import raw from '../data/provisions.json';

export const BASE_DATE = '2026. 9. 11.';

export { CATEGORY_SLUG, CATEGORY_BLURB, categoryHref } from './categories';
import { CATEGORY_SLUG, CATEGORY_BLURB } from './categories';

export { LAW_OFFICIAL, officialLaw, lawGoKrUrl, provisionHref } from './lawlinks';
import { officialLaw as _official, provisionHref as _pHref } from './lawlinks';

function articleOrder(article) {
  const m = (article || '').match(/제(\d+)조(?:의(\d+))?/);
  return m ? Number(m[1]) * 100 + Number(m[2] || 0) : 99999;
}

/* 평탄화한 조문 목록 — 순서는 분야 → 법령 → 조문번호 (merge 단계에서 이미 정렬됨) */
export const provisions = raw.flatMap((area) =>
  area.provisions.map((p) => ({
    ...p,
    /* 상시 근로자 수 적용 하한. 데이터에 값이 없으면 appliesUnder5로부터 최소한의 값을 만든다. */
    threshold: p.threshold || (p.appliesUnder5 ? 1 : 5),
    thresholdNote: p.thresholdNote || (p.appliesUnder5 ? '규모 무관 적용' : '상시 5명 이상 적용'),
    category: area.category,
    categorySlug: CATEGORY_SLUG[area.category],
    href: _pHref(p),
    order: articleOrder(p.article),
  }))
);

export const provisionKey = (p) => `${p.law}|${p.article}`;

/* 목록 화면용 경량 레코드. 조문 전문(평균 1.9KB × 187개)을 홈 화면에 전부 실으면
   HTML이 900KB를 넘어가므로, 목록에는 미리보기만 싣고 전문은 /search-index.json으로 따로 받는다. */
const PREVIEW_LEN = 300;
export const browseProvisions = provisions.map((p) => ({
  key: provisionKey(p),
  law: p.law,
  article: p.article,
  title: p.title,
  summary: p.summary,
  keywords: p.keywords,
  appliesUnder5: p.appliesUnder5,
  threshold: p.threshold,
  thresholdNote: p.thresholdNote,
  penalty: p.penalty,
  category: p.category,
  href: p.href,
  order: p.order,
  preview: p.text.length > PREVIEW_LEN ? p.text.slice(0, PREVIEW_LEN).trimEnd() + '…' : p.text,
  hasMore: p.text.length > PREVIEW_LEN,
}));

export const categories = raw.map((area) => ({
  name: area.category,
  slug: CATEGORY_SLUG[area.category],
  blurb: CATEGORY_BLURB[area.category],
  count: area.provisions.length,
}));

export const laws = Object.entries(
  provisions.reduce((acc, p) => ((acc[p.law] = (acc[p.law] || 0) + 1), acc), {})
)
  .map(([name, count]) => ({ name, count, official: _official(name) }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ko'));

export const stats = {
  provisions: provisions.length,
  laws: laws.length,
  categories: categories.length,
  appliesUnder5: provisions.filter((p) => p.appliesUnder5).length,
};

/* 조문 본문을 항(項) 단위로 쪼갠다. 본문은 "① … ② …"처럼 한 줄로 이어져 있어
   그대로 두면 벽처럼 읽히고, 실무 해설(※)은 조문 원문이 아니므로 따로 세워 둔다. */
export function splitProvisionText(text) {
  return String(text || '')
    .split(/(?=[①-⑮])|(?=※)/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ kind: s.startsWith('※') ? 'note' : 'clause', text: s }));
}

export const findProvision = (law, article) =>
  provisions.find((p) => p.law === law && p.article === article) || null;

export const categoryBySlug = (slug) => categories.find((c) => c.slug === slug) || null;

/* 관련 조문. 같은 분야·같은 법령을 뼈대로 삼고 키워드 겹침으로 순위를 매긴다.
   키워드 한 개만 겹쳐도 관련으로 보면 "연차휴가 ↔ 직장 내 괴롭힘"처럼 엉뚱한 조합이 섞이므로,
   분야가 다르면 키워드가 2개 이상 겹쳐야 통과하도록 문턱(6점)을 둔다. */
export function relatedProvisions(target, limit = 5) {
  const kw = new Set((target.keywords || []).map((k) => k.replace(/\s+/g, '')));
  const scored = provisions
    .filter((p) => !(p.law === target.law && p.article === target.article))
    .map((p) => {
      const shared = (p.keywords || []).filter((k) => kw.has(k.replace(/\s+/g, ''))).length;
      const sameCat = p.category === target.category;
      const sameLaw = p.law === target.law;
      let score = shared * 3;
      if (sameCat && sameLaw) score += 6;
      else if (sameCat) score += 4;
      else if (sameLaw) score += 1;
      if (sameLaw) {
        const gap = Math.abs(p.order - target.order);
        if (gap <= 300) score += 2;
        else if (gap <= 1000) score += 1;
      }
      return { p, score };
    })
    .filter((x) => x.score >= 6)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Math.abs(a.p.order - target.order) - Math.abs(b.p.order - target.order)
    )
    .slice(0, limit)
    .map((x) => x.p);

  /* 단독 조문으로 이루어진 법령은 위 조건을 하나도 못 넘긴다. 같은 분야 조문으로 대체한다. */
  if (scored.length) return scored;
  return provisions
    .filter((p) => p.category === target.category && !(p.law === target.law && p.article === target.article))
    .slice(0, limit);
}

/* 홈 화면 "한눈에 보는 기준" 카드 — 근거 조문이 실제로 존재하는지 빌드 시점에 확인한다. */
const CARD_SOURCE = [
  { k: '최저임금 2026년', v: '10,320', u: '원/시간', sub: '월 2,156,880원 (209시간)', law: '최저임금법', article: '제5조' },
  { k: '최저임금 2027년', v: '10,700', u: '원/시간', sub: '월 2,236,300원 · 2027. 1. 1. 시행', law: '최저임금법', article: '제5조' },
  { k: '법정근로시간', v: '40', u: '시간/주', sub: '1일 8시간, 휴게시간 제외', law: '근로기준법', article: '제50조' },
  { k: '연장근로 한도', v: '12', u: '시간/주', sub: '당사자 합의 필요 · 주 최대 52시간', law: '근로기준법', article: '제53조' },
  { k: '연장·야간·휴일 가산', v: '50', u: '%', sub: '휴일 8시간 초과분은 100%', law: '근로기준법', article: '제56조' },
  { k: '연차 유급휴가', v: '15~25', u: '일', sub: '1년 미만은 1개월 개근 시 1일', law: '근로기준법', article: '제60조' },
  { k: '해고예고', v: '30', u: '일 전', sub: '미예고 시 30일분 통상임금', law: '근로기준법', article: '제26조' },
  { k: '퇴직금', v: '30', u: '일분/1년', sub: '평균임금 기준 · 1년 이상 근속', law: '퇴직급여법', article: '제8조' },
  { k: '금품청산', v: '14', u: '일 이내', sub: '퇴직 후 임금·퇴직금 지급', law: '근로기준법', article: '제36조' },
  { k: '부당해고 구제신청', v: '3', u: '개월 이내', sub: '지방노동위원회에 신청', law: '근로기준법', article: '제28조' },
  { k: '출산전후휴가', v: '90', u: '일', sub: '다태아 120일 · 미숙아 100일', law: '근로기준법', article: '제74조' },
  { k: '배우자 출산휴가', v: '20', u: '일', sub: '출산일부터 120일 이내 청구', law: '남녀고용평등법', article: '제18조의2' },
];

export const cards = CARD_SOURCE.map((c) => {
  const p = findProvision(c.law, c.article);
  if (!p) throw new Error(`기준 카드의 근거 조문을 찾을 수 없습니다: ${c.law} ${c.article}`);
  return { ...c, href: p.href };
});
