import { provisions, categories } from '../lib/data';
import { calculators, processes, wizards } from '../lib/platform';
import { SITE_URL } from '../lib/site';

/* 정적 내보내기(output: export)에서는 이 선언이 있어야 파일로 구워진다. */
export const dynamic = 'force-static';

/* 배포본은 주소 끝에 /가 붙는 형태(trailingSlash)라 사이트맵도 그 주소로 적는다 — 아니면 모두 301 리다이렉트로 잡힌다 */
const u = (p) => `${SITE_URL}${p.endsWith('/') ? p : p + '/'}`;

export default function sitemap() {
  return [
    { url: u('/'), changeFrequency: 'monthly', priority: 1 },
    ...['law', 'calc', 'process', 'calendar', 'docs', 'topic', 'terms', 'changes', 'thresholds', 'favorites', 'cases', 'news', 'qa', 'check', 'updates'].map((p) => ({
      url: u(`/${p}`),
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
    ...calculators.map((c) => ({
      url: u(`/calc/${c.key}`),
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
    ...wizards.map((w) => ({
      url: u(`/check/${w.key}`),
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
    ...processes.map((p) => ({
      url: u(`/process/${p.slug}`),
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
    ...categories.map((c) => ({
      url: u(`/topic/${c.slug}`),
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
    ...provisions.map((p) => ({
      url: u(p.href),
      changeFrequency: 'yearly',
      priority: 0.6,
    })),
  ];
}
