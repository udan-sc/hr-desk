import { provisions, categories } from '../lib/data';
import { calculators, processes } from '../lib/platform';
import { SITE_URL } from '../lib/site';

/* 정적 내보내기(output: export)에서는 이 선언이 있어야 파일로 구워진다. */
export const dynamic = 'force-static';

export default function sitemap() {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'monthly', priority: 1 },
    ...['law', 'calc', 'process', 'calendar', 'docs', 'topic'].map((p) => ({
      url: `${SITE_URL}/${p}`,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
    ...calculators.map((c) => ({
      url: `${SITE_URL}/calc/${c.key}`,
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
    ...processes.map((p) => ({
      url: `${SITE_URL}/process/${p.slug}`,
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
    ...categories.map((c) => ({
      url: `${SITE_URL}/topic/${c.slug}`,
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
    ...provisions.map((p) => ({
      url: `${SITE_URL}${p.href}`,
      changeFrequency: 'yearly',
      priority: 0.6,
    })),
  ];
}
