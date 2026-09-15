/* 사이트 기준 URL과 하위 경로. layout(metadataBase)·sitemap·robots·클라이언트 fetch가 모두 이 값을 쓴다.
   NEXT_PUBLIC_* 는 빌드 시점에 인라인되므로 배포 빌드 전에 반드시 설정해야 한다.
   GitHub Pages 배포는 .github/workflows/deploy.yml이 두 값을 채워 준다. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3200${BASE_PATH}`;

/* basePath가 붙은 정적 파일 주소. Next의 <Link>는 자동으로 붙지만 fetch·form action은 직접 붙여야 한다. */
export const asset = (p) => `${BASE_PATH}${p}`;
