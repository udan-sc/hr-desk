import './globals.css';
import Link from 'next/link';
import { Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google';
import { stats, BASE_DATE } from '../lib/data';
import { MODULES, SITE_NAME, SITE_TAGLINE } from '../lib/modules';
import { SITE_URL } from '../lib/site';
import NavLinks from './nav-links';
import { HeadcountProvider } from './headcount-context';

/* 셀프호스팅 폰트. 한글 글리프는 unicode-range 조각으로 필요한 만큼만 내려받으므로
   subsets에는 프리로드할 latin만 지정한다. */
const sans = Noto_Sans_KR({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});
const serif = Noto_Serif_KR({
  weight: ['700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: `노동법 조문 ${stats.provisions}개, 노무 계산기, 상황별 업무 절차, 법정 의무 캘린더, 규정·서식을 한곳에 모은 인사·총무 실무 도구. ${BASE_DATE} 시행 법령 기준.`,
  keywords: ['인사', '총무', '노무', '노동법', '근로기준법', '연차 계산', '퇴직금 계산', '법정 의무 교육', '5인 미만 사업장'],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'ko_KR',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: `조문 ${stats.provisions}개 · 계산기 · 업무 절차 · 법정 캘린더 · 규정과 서식`,
  },
};

export const viewport = { width: 'device-width', initialScale: 1 };

const CSP = [
  "default-src 'self'",
  process.env.NODE_ENV === 'development'
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={`${sans.variable} ${serif.variable}`}>
      <head>
        {/* 정적 호스팅이라 응답 헤더를 줄 수 없어 meta로 대신한다.
            frame-ancestors·X-Content-Type-Options는 meta로 적용되지 않으므로 호스팅 설정에 맡긴다.
            dev 서버의 HMR은 eval을 쓰므로 개발 중에만 unsafe-eval을 허용한다 —
            빼면 하이드레이션이 조용히 깨져서 useEffect가 아예 돌지 않는다. */}
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body>
        <HeadcountProvider>
        <header className="site-head">
          <div className="wrap">
            <Link className="brand" href="/">
              <span className="seal" aria-hidden="true">人</span>
              <span>
                <span className="bn">{SITE_NAME}</span>
                <span className="bt">{SITE_TAGLINE}</span>
              </span>
            </Link>
            <nav className="site-nav" aria-label="주요 메뉴">
              <NavLinks modules={MODULES} />
              <span className="meta">{BASE_DATE} 기준</span>
            </nav>
          </div>
        </header>

        {children}

        <footer className="site-foot">
          <div className="wrap">
            <p>
              {BASE_DATE} 시행 법령을 기준으로 한 참조용 자료입니다. 계산 결과와 절차 안내는 일반적인 경우를 전제로 하며,
              개별 사안의 판단은 원문 조문과 행정해석·판례 확인이 필요합니다. 조문 원문은 각 항목의 국가법령정보센터
              링크에서 볼 수 있습니다.
            </p>
            <div className="fl">
              {MODULES.map((m) => (
                <Link key={m.slug} href={m.href}>
                  {m.name}
                </Link>
              ))}
              <a href="https://www.law.go.kr" target="_blank" rel="noopener noreferrer">
                국가법령정보센터<span className="vh"> (새 창)</span> <span aria-hidden="true">↗</span>
              </a>
              <a href="https://www.moel.go.kr" target="_blank" rel="noopener noreferrer">
                고용노동부<span className="vh"> (새 창)</span> <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </footer>
        </HeadcountProvider>
      </body>
    </html>
  );
}
