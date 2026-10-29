import './globals.css';
import Link from 'next/link';
import { Noto_Sans_KR, JetBrains_Mono } from 'next/font/google';
import { stats, BASE_DATE } from '../lib/data';
import { NAV_GROUPS, SITE_NAME, SITE_TAGLINE } from '../lib/modules';
import { SITE_URL } from '../lib/site';
import SiteNav, { NavProvider, AppSide, MenuButton, TopTitle, SkipLink } from './site-nav';
import CommandPalette from './command-palette';
import HeadcountPill from './headcount-pill';
import ToTop from './to-top';
import Icon from './nav-icons';
import { HeadcountProvider } from './headcount-context';
import { watchStatus, precedents, qa } from '../lib/platform';

/* 셀프호스팅 폰트(CSP상 외부 글꼴을 못 쓰므로 빌드 때 내려받아 같이 내보낸다).
   본문은 Noto Sans KR 한 벌 — 위계는 굵기로만 나눈다. 날짜·D-day·큰 숫자·건수·사건번호·단축키는 JetBrains Mono.
   한글 글리프는 unicode-range 조각으로 필요한 만큼만 내려받으므로 subsets에는 프리로드할 latin만 지정한다. */
const sans = Noto_Sans_KR({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});
const mono = JetBrains_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
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

/* 사이드 메뉴 항목 옆 건수 — 실제 자료 개수만(없거나 0이면 표시하지 않음) */
const NAV_COUNTS = Object.fromEntries(
  Object.entries({ law: stats.provisions, cases: precedents.length, qa: qa.length }).filter(([, n]) => n > 0)
);

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <head>
        {/* 정적 호스팅이라 응답 헤더를 줄 수 없어 meta로 대신한다.
            frame-ancestors·X-Content-Type-Options는 meta로 적용되지 않으므로 호스팅 설정에 맡긴다.
            dev 서버의 HMR은 eval을 쓰므로 개발 중에만 unsafe-eval을 허용한다 —
            빼면 하이드레이션이 조용히 깨져서 useEffect가 아예 돌지 않는다. */}
        <meta httpEquiv="Content-Security-Policy" content={CSP} />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link rel="alternate" type="application/rss+xml" title={`${SITE_NAME} — 바뀐 것`} href={`${SITE_URL}/updates.xml`} />
      </head>
      <body>
        <HeadcountProvider>
        <NavProvider>
        <SkipLink />
        {/* 골격(시안 C): 왼쪽 사이드 메뉴 + 오른쪽 본문 열(상단 막대 · 본문 · 바닥글) */}
        <div className="shell">
          <AppSide>
            <Link className="as-brand" href="/">
              <span className="brand-mk" aria-hidden="true">
                <Icon name="brand" size={18} stroke={2} />
              </span>
              <span className="as-brand-tx">
                <span className="bn">{SITE_NAME}</span>
                <span className="bt">{SITE_TAGLINE}</span>
              </span>
            </Link>
            <SiteNav groups={NAV_GROUPS} counts={NAV_COUNTS} />
            <div className="as-base">
              <p className="as-base-l">
                <span className="as-dot" aria-hidden="true" />
                법령 기준일
              </p>
              <p className="as-base-d">{BASE_DATE} 시행</p>
              <a href="https://www.law.go.kr" target="_blank" rel="noopener noreferrer">
                국가법령정보센터 원문<span className="vh"> (새 창)</span>
                <Icon name="external" size={12} stroke={2} />
              </a>
            </div>
          </AppSide>

          <div className="shell-main">
            <header className="topbar">
              <MenuButton />
              <Link className="top-brand" href="/">
                <span className="brand-mk" aria-hidden="true">
                  <Icon name="brand" size={16} stroke={2} />
                </span>
                <span className="bn">{SITE_NAME}</span>
              </Link>
              <TopTitle groups={NAV_GROUPS} />
              <CommandPalette />
              <div className="top-tools">
                <HeadcountPill />
                <Link className="icon-btn" href="/favorites" aria-label="즐겨찾기">
                  <Icon name="favorites" size={16} />
                </Link>
              </div>
            </header>

            <div id="main-content" className="shell-body" tabIndex={-1}>
              {children}
            </div>
            <ToTop />

            <footer className="site-foot">
              <div className="wrap">
                <div className="foot-groups">
                  {NAV_GROUPS.map((g) => (
                    <nav key={g.key} className="fg" aria-label={g.label}>
                      <h2 className="fg-h">{g.label}</h2>
                      {g.items.map((m) => (
                        <Link key={m.slug} href={m.href}>
                          {m.name}
                        </Link>
                      ))}
                    </nav>
                  ))}
                  <nav className="fg" aria-label="공식 사이트">
                    <h2 className="fg-h">원문 확인</h2>
                    <a href="https://www.law.go.kr" target="_blank" rel="noopener noreferrer">
                      국가법령정보센터<span className="vh"> (새 창)</span> <span aria-hidden="true">↗</span>
                    </a>
                    <a href="https://www.moel.go.kr" target="_blank" rel="noopener noreferrer">
                      고용노동부<span className="vh"> (새 창)</span> <span aria-hidden="true">↗</span>
                    </a>
                    <a href={`${SITE_URL}/updates.xml`}>바뀐 것 RSS</a>
                  </nav>
                </div>
                <div className="foot-note">
                  <p>
                    {BASE_DATE} 시행 법령을 기준으로 한 참조용 자료입니다. 계산 결과와 절차 안내는 일반적인 경우를 전제로 하며,
                    개별 사안의 판단은 원문 조문과 행정해석·판례 확인이 필요합니다. 조문 원문은 각 항목의 국가법령정보센터
                    링크에서 볼 수 있습니다.
                  </p>
                  {watchStatus.checkedAt && (
                    <p className="watch-foot">
                      법령 원문 자동 확인: {watchStatus.checkedAt.replace(/-0?/g, '. ')}. · 매일 국가법령정보센터 기준으로 개정 여부를 확인합니다.
                    </p>
                  )}
                </div>
              </div>
            </footer>
          </div>
        </div>
        </NavProvider>
        </HeadcountProvider>
      </body>
    </html>
  );
}
