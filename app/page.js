import Link from 'next/link';
import { cards, stats, BASE_DATE, provisions } from '../lib/data';
import { NAV_GROUPS } from '../lib/modules';
import { obligations, changes, autoChanges, documents, precedents, qa, wizards } from '../lib/platform';
import UpcomingChanges from './upcoming-changes';
import StatusBoard from './status-board';
import NewsBoard from './news-board';
import HomeMonth from './home-month';
import HeadcountBar from './headcount-bar';
import RecentProvisions from './recent-provisions';
import UpdatesMini from './updates/updates-mini';
import { asset } from '../lib/site';

export const metadata = {
  alternates: { canonical: '/' },
};

const byMonth = {};
for (let m = 1; m <= 12; m++) byMonth[m] = obligations.filter((o) => o.months.includes(m)).map(({ id, title, timing, threshold, thresholdMin, penalty, cadence }) => ({ id, title, timing, threshold, thresholdMin, penalty, cadence }));

/* 검색창 아래 '바로 판정' — 판정 도우미가 실린 것만 보인다 */
const QUICK = [
  { key: 'worker-status', label: '근로자에 해당할까?' },
  { key: 'headcount', label: '상시 근로자 몇 명?' },
  { key: 'severance-eligible', label: '퇴직금 줘야 할까?' },
  { key: 'dismissal-notice', label: '해고예고 필요할까?' },
  { key: 'parental', label: '육아휴직 대상일까?' },
];

export default function HomePage() {
  const quick = QUICK.filter((q) => wizards.some((w) => w.key === q.key));
  return (
    <main className="home">
      <div className="wrap">
        <section className="hero">
          <h1>인사·노무 실무, 근거 조문까지 한 번에</h1>
          <p className="hero-lead">
            조문 {stats.provisions}개 · 판례 {precedents.length}건{qa.length ? ` · 실무 Q&A ${qa.length}선` : ''}을 바탕으로 찾고, 판정하고,
            챙길 일을 봅니다. 모든 안내에 근거 조문이 붙어 있어 결재·통보 문서에 그대로 쓸 수 있습니다.
          </p>

          <form className="home-search searchbar" action={asset('/law/')} method="get" role="search">
            <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.3" y2="16.3" />
            </svg>
            <input type="search" name="q" placeholder="조문 검색 — 예: 연차 수당, 주휴, 해고 예고, 육아휴직 급여" aria-label="조문 검색" autoComplete="off" />
            <button className="go" type="submit">
              검색
            </button>
          </form>

          {quick.length > 0 && (
            <nav className="hero-chips" aria-label="바로 판정">
              <span className="lbl">바로 판정</span>
              {quick.map((q) => (
                <Link key={q.key} className="hchip" href={`/check/${q.key}`}>
                  {q.label}
                </Link>
              ))}
            </nav>
          )}
          <RecentProvisions />
        </section>

        <section className="hsec" aria-labelledby="h-go">
          <div className="sec-head">
            <h2 id="h-go">무엇을 하시겠어요?</h2>
          </div>
          <div className="qgroups">
            {NAV_GROUPS.map((g) => (
              <div key={g.key} className="qg">
                <h3 className="qg-h">{g.label}</h3>
                <p className="qg-d">{g.desc}</p>
                {g.items.map((m) => (
                  <Link key={m.slug} className="gi" href={m.href}>
                    <span className="gi-mk" aria-hidden="true">{m.mark}</span>
                    <span className="gi-tx">
                      <span className="gi-n">{m.name}</span>
                      <span className="gi-t">{m.tip}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="hsec" aria-labelledby="h-co">
          <div className="sec-head">
            <h2 id="h-co">우리 회사 기준</h2>
            <span className="note">인원을 한 번 넣어 두면 모든 화면이 우리 회사 규모로 표시됩니다</span>
          </div>
          <div className="home-co">
            <HeadcountBar hint="예: 87을 넣으면 노무법전·캘린더·규정서식에서 우리 규모에 해당 없는 항목이 흐리게 표시됩니다." />
            <StatusBoard
              provisions={provisions.map((p) => p.threshold)}
              obligations={obligations.map((o) => o.thresholdMin || 1)}
              docs={documents.map((d) => ({ t: d.thresholdMin || 1, must: d.obligation === '법정 의무' }))}
              changeDates={[...changes, ...autoChanges].map((c) => c.effectiveDate)}
            />
          </div>
        </section>

        <section className="hsec" aria-labelledby="h-today">
          <div className="sec-head">
            <h2 id="h-today">오늘 살펴볼 것</h2>
          </div>
          <div className="home-today">
            <NewsBoard />
            <div className="today-side">
              <UpdatesMini />
              <UpcomingChanges
                items={[...changes, ...autoChanges]
                  .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))
                  .map(({ id, effectiveDate, law, title, auto }) => ({ id, effectiveDate, law, title, auto: Boolean(auto) }))}
              />
            </div>
          </div>
        </section>

        <HomeMonth byMonth={byMonth} />

        <section className="hsec" aria-labelledby="h-cards">
          <div className="sec-head">
            <h2 id="h-cards">한눈에 보는 기준</h2>
            <Link className="more" href="/law">
              노무법전에서 전체 보기 →
            </Link>
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
                <span className="ref">
                  {c.law} {c.article}
                </span>
              </Link>
            ))}
          </div>
          <p className="hsec-foot">{BASE_DATE} 시행 법령 기준 · 카드를 누르면 근거 조문으로 이동합니다.</p>
        </section>
      </div>
    </main>
  );
}
