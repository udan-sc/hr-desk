/* GitHub Pages는 서버 없이 정적 파일만 서빙한다. 그래서
   - output: 'export'로 전부 미리 구워 내보내고
   - 하위 경로(/hr-desk)에서 열리므로 basePath를 붙이고
   - 디렉터리+index.html 형태여야 /law 같은 주소가 열리므로 trailingSlash를 켠다.
   보안 헤더는 서버가 없어 응답 헤더로 줄 수 없고, app/layout.js의 meta 태그로 대신한다. */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
};

export default nextConfig;
