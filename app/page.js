import Link from 'next/link';
import { cards, stats, BASE_DATE, provisions } from '../lib/data';
import { obligations, changes, autoChanges, documents, precedents, qa, wizards } from '../lib/platform';
import UpcomingChanges from './upcoming-changes';
import StatusBoard from './status-board';
import NewsBoard, { NewsOfficial } from './news-board';
import HomeMonth from './home-month';
import HeadcountBar from './headcount-bar';
import RecentProvisions from './recent-provisions';
import UpdatesMini from './updates/updates-mini';
import CardScale from './card-scale';
import CardHead from './home-card';
import HomeToday from './home-today';
import Icon from './nav-icons';

export const metadata = {
  alternates: { canonical: '/' },
};

const byMonth = {};
for (let m = 1; m <= 12; m++) byMonth[m] = obligations.filter((o) => o.months.includes(m)).map(({ id, title, timing, threshold, thresholdMin, penalty, cadence }) => ({ id, title, timing, threshold, thresholdMin, penalty, cadence }));

/* 맨 위 '바로 판정' — 판정 도우미가 실린 것만 보인다 */
const QUICK = [
  { key: 'worker-status', label: '근로자에 해당할까?' },
  { key: 'headcount', label: '상시 근로자 몇 명?' },
  { key: 'severance-eligible', label: '퇴직금 줘야 할까?' },
  { key: 'dismissal-notice', label: '해고예고 필요할까?' },
  { key: 'parental', label: '육아휴직 대상일까?' },
];

/* 홈 = '오늘' 대시보드(시안 C · 워크스페이스).
   메뉴 바로 가기는 왼쪽 사이드 메뉴(좁은 화면은 상단 메뉴 버튼)와 바닥글이 맡으므로 홈에는 두지 않는다.
   검색은 상단 막대의 통합 검색(Ctrl K)이 맡는다.
   배치: 머리(오늘 날짜·기준일·바로 판정)
         → [이번 달 챙길 일 · 곧 시행 · 오늘의 인사노무 이슈 | 우리 회사 기준 · 이번 주 바뀐 것 · 고용노동부 발표]
         → 한눈에 보는 기준. 좁아지면 왼쪽 열, 오른쪽 열 순서대로 한 줄씩 쌓인다.
   이번 달 할 일은 달마다 1~9건으로 들쭉날쭉해 소식을 두 카드로 나눠 양쪽 열 높이를 맞췄다. */
export default function HomePage() {
  const quick = QUICK.filter((q) => wizards.some((w) => w.key === q.key));
  const hcWizard = wizards.some((w) => w.key === 'headcount');
  return (
    <main className="home">
      <div className="wrap hd">
        <section className="hd-hero" aria-labelledby="home-title">
          <div className="hd-meta">
            <HomeToday />
            <span className="hd-base">
              <Icon name="ok" size={14} stroke={2} />
              {BASE_DATE} 시행 법령 기준
            </span>
          </div>
          <h1 id="home-title">인사·노무 실무, 근거 조문까지 한 번에</h1>
          <p className="hd-lead">
            조문 {stats.provisions}개 · 판례 {precedents.length}건{qa.length ? ` · 실무 Q&A ${qa.length}선` : ''}을 바탕으로 찾고, 판정하고,
            챙길 일을 봅니다. 모든 안내에 근거 조문이 붙어 있어 결재·통보 문서에 그대로 쓸 수 있습니다.
          </p>

          {quick.length > 0 && (
            <nav className="hd-quick" aria-labelledby="hq-h">
              <h2 id="hq-h" className="hd-quick-h">
                <Icon name="check" size={16} />
                바로 판정
              </h2>
              <ul className="hd-quick-list">
                {quick.map((q) => (
                  <li key={q.key}>
                    <Link className="hd-qchip" href={`/check/${q.key}`}>
                      {q.label}
                      <Icon name="arrow" size={14} stroke={2} />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className="hd-more hd-quick-all" href="/check">
                판정 도우미 전체
                <Icon name="chevron" size={14} stroke={2} />
              </Link>
            </nav>
          )}
          {/* 최근 본 조문 — 이 브라우저에 기록이 있을 때만 보인다 */}
          <div className="hd-recent">
            <RecentProvisions />
          </div>
        </section>

        <div className="hd-grid">
          <div className="hd-col hd-col-main">
            <HomeMonth byMonth={byMonth} />
            <UpcomingChanges
              items={[...changes, ...autoChanges]
                .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))
                .map(({ id, effectiveDate, law, title, auto }) => ({ id, effectiveDate, law, title, auto: Boolean(auto) }))}
            />
            <NewsBoard />
          </div>
          <div className="hd-col hd-col-side">
            <section className="hd-card hd-co" aria-labelledby="h-co">
              <CardHead
                id="h-co"
                icon="users"
                title="우리 회사 기준"
                sub="인원을 한 번 넣어 두면 모든 화면이 우리 회사 규모로 표시됩니다"
                moreHref="/thresholds"
                more="문턱 지도"
              />
              <div className="hd-co-body">
                <HeadcountBar hint="예: 87을 넣으면 노무법전·캘린더·규정서식에서 우리 규모에 해당 없는 항목이 흐리게 표시됩니다." />
                <StatusBoard
                  provisions={provisions.map((p) => p.threshold)}
                  obligations={obligations.map((o) => o.thresholdMin || 1)}
                  docs={documents.map((d) => ({ t: d.thresholdMin || 1, must: d.obligation === '법정 의무' }))}
                  changeDates={[...changes, ...autoChanges].map((c) => c.effectiveDate)}
                />
                {hcWizard && (
                  <Link className="hd-link" href="/check/headcount">
                    상시 근로자 수 계산하기
                    <Icon name="arrow" size={14} stroke={2} />
                  </Link>
                )}
              </div>
            </section>
            <UpdatesMini />
            <NewsOfficial />
          </div>
        </div>

        <section className="hd-std" aria-labelledby="h-cards">
          <div className="hd-sec-head">
            <h2 id="h-cards">한눈에 보는 기준</h2>
            <span className="hd-sec-note">{BASE_DATE} 시행 법령 기준</span>
            <Link className="hd-more" href="/law">
              노무법전에서 전체 보기
              <Icon name="chevron" size={14} stroke={2} />
            </Link>
          </div>
          <div className="cards">
            {cards.slice(0, 8).map((c) => (
              <Link key={c.k} className="card" href={c.href}>
                <span className="card-top">
                  <span className="k">{c.k}</span>
                  <CardScale threshold={c.threshold} note={c.thresholdNote} />
                </span>
                <span className="v">
                  {c.v}
                  <small>{c.u}</small>
                </span>
                <span className="sub">{c.sub}</span>
                <span className="ref">
                  <Icon name="file" size={14} stroke={1.9} className="ref-ic" />
                  {c.law} {c.article}
                  <Icon name="chevron" size={12} stroke={2} className="ref-go" />
                </span>
              </Link>
            ))}
          </div>
          <p className="hd-foot">카드를 누르면 근거 조문으로 이동합니다.</p>
        </section>
      </div>
    </main>
  );
}
