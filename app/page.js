import Link from 'next/link';
import { cards, stats, BASE_DATE } from '../lib/data';
import { MODULES, SITE_NAME } from '../lib/modules';
import { obligations } from '../lib/platform';
import HomeMonth from './home-month';
import HeadcountBar from './headcount-bar';
import { asset } from '../lib/site';

export const metadata = {
  alternates: { canonical: '/' },
};

const byMonth = {};
for (let m = 1; m <= 12; m++) byMonth[m] = obligations.filter((o) => o.months.includes(m)).map(({ id, title, timing, threshold, thresholdMin, penalty, cadence }) => ({ id, title, timing, threshold, thresholdMin, penalty, cadence }));

export default function HomePage() {
  return (
    <main>
      <div className="wrap">
        <section className="masthead">
          <h1>오늘 처리할 인사 업무, 근거 조문까지 한 번에</h1>
          <p>
            노동법 조문 {stats.provisions}개를 바탕으로 계산하고, 절차를 확인하고, 챙길 일정을 봅니다.
            모든 안내에는 근거 조문이 붙어 있어 결재와 통보 문서에 그대로 쓸 수 있습니다.
          </p>
        </section>

        <form className="home-search searchbar" action={asset('/law/')} method="get" role="search">
          <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.3" y2="16.3" />
          </svg>
          <input type="search" name="q" placeholder="예: 연차 수당, 주휴, 해고 예고, 육아휴직 급여" aria-label="조문 검색" autoComplete="off" />
          <button className="go" type="submit">검색</button>
        </form>

        <HeadcountBar hint="한 번 넣어 두면 노무법전·캘린더·규정서식이 모두 우리 회사 기준으로 표시됩니다." />

        <h2 className="vh">{SITE_NAME} 모듈</h2>
        <div className="mods">
          {MODULES.map((m) => (
            <Link key={m.slug} className="mod" href={m.href}>
              <span className="mk" aria-hidden="true">{m.mark}</span>
              <span className="mn">{m.name}</span>
              <span className="mb">{m.blurb}</span>
              <span className="mg">바로 가기 →</span>
            </Link>
          ))}
        </div>

        <HomeMonth byMonth={byMonth} />

        <section className="home-sec">
          <div className="sec-head">
            <h2>한눈에 보는 기준</h2>
            <Link className="more" href="/law">노무법전에서 전체 보기 →</Link>
          </div>
          <div className="cards">
            {cards.slice(0, 8).map((c) => (
              <Link key={c.k} className="card" href={c.href}>
                <span className="k">{c.k}</span>
                <span className="v">
                  {c.v}
                  <small>{c.u}</small>
                </span>
                <span className="sub">{c.sub}</span>
                <span className="ref">{c.law} {c.article}</span>
              </Link>
            ))}
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--ink3)', margin: '10px 2px 0' }}>{BASE_DATE} 시행 법령 기준 · 카드를 누르면 근거 조문으로 이동합니다.</p>
        </section>
      </div>
    </main>
  );
}
