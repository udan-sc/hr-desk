import { SITE_URL } from '../lib/site';

/* 정적 내보내기(output: export)에서는 이 선언이 있어야 파일로 구워진다. */
export const dynamic = 'force-static';

export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
