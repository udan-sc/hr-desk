import Link from 'next/link';
import { obligations, resolveCitations } from '../../lib/platform';
import { BASE_DATE } from '../../lib/data';
import CalendarNow from './calendar-now';
import { ScopeBadge } from '../scope-badges';
import HeadcountBar from '../headcount-bar';
import ScopeFilter from '../scope-filter';

export const metadata = {
  title: '법정 의무 캘린더',
  description: '성희롱 예방교육, 건강진단, 각종 신고처럼 해마다 챙겨야 하는 법정 의무를 달별로 봅니다. 놓치면 과태료가 나오는 일 위주로 모았습니다.',
  alternates: { canonical: '/calendar' },
};

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

/* 매월 반복 의무를 12개 칸에 모두 넣으면 그 달에만 해야 할 일이 묻힌다. 따로 세운다. */
const isEveryMonth = (o) => o.months.length === 12;
const monthly = obligations.filter(isEveryMonth);
const seasonal = obligations.filter((o) => !isEveryMonth(o) && o.months.length > 0);
const anytime = obligations.filter((o) => o.months.length === 0);

function Marks({ o }) {
  const cites = resolveCitations(o.citations).filter((x) => x.href);
  return (
    <div className="of">
      <ScopeBadge threshold={o.thresholdMin} full={o.thresholdFull} />
      <span className="badge pen">대상: {o.target} · {o.threshold}</span>
      {o.penalty && <span className="badge pen">미이행 시 {o.penalty}</span>}
      <span className="spacer" />
      {cites.map((x) => (
        <Link key={`${x.law}${x.article}`} className="tag" href={x.href}>
          {x.law} {x.article}
        </Link>
      ))}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">법정 의무 캘린더 · {BASE_DATE} 기준</div>
          <h1>이번 달엔 뭘 챙겨야 하나요?</h1>
          <p>
            놓치면 과태료가 나오거나 법 위반이 되는 의무 {obligations.length}건을 모았습니다. 시기가 정해진 것은 달력에,
            매달 반복하는 것과 사건이 생길 때 하는 것은 따로 세워 두었습니다.
          </p>
        </header>

        <HeadcountBar hint="인원을 넣으면 우리 회사가 챙겨야 할 의무만 가려 볼 수 있습니다." />
        <ScopeFilter
          items={obligations.map((o) => ({ id: o.id, threshold: o.thresholdMin }))}
          label="법정 의무"
        />

        {monthly.length > 0 && (
          <section style={{ marginBottom: 26 }}>
            <div className="sec-head">
              <h2>매달 반복</h2>
              <span className="note">달을 가리지 않고 매월 해야 하는 일</span>
            </div>
            <div className="month-list">
              {monthly.map((o) => (
                <a key={o.id} className="month-item" data-threshold={o.thresholdMin} href={`#${o.id}`}>
                  <span className="mt">{o.title}</span>
                  <span className="md">{o.timing} · {o.threshold}</span>
                  <span className="mw">{o.penalty ? `미이행 시 ${o.penalty}` : o.cadence}</span>
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="sec-head">
          <h2>달력</h2>
          <span className="note">시기가 정해진 의무 {seasonal.length}건</span>
        </div>
        <div className="cal-months">
          {MONTH_NAMES.map((name, idx) => {
            const m = idx + 1;
            const items = seasonal.filter((o) => o.months.includes(m));
            return (
              <CalendarNow key={m} month={m}>
                <h2>{name}</h2>
                {items.length === 0 ? (
                  <p className="none">이 달에만 하는 일 없음</p>
                ) : (
                  <ul>
                    {items.map((o) => (
                      <li key={o.id} data-threshold={o.thresholdMin}>
                        <a href={`#${o.id}`}>
                          {o.title}
                          <span className="when">{o.timing}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </CalendarNow>
            );
          })}
        </div>

        {anytime.length > 0 && (
          <section style={{ marginTop: 40 }}>
            <div className="sec-head">
              <h2>사건이 생기면 바로</h2>
              <span className="note">시기가 아니라 사유가 정해진 의무 {anytime.length}건</span>
            </div>
            <div className="ob-list">
              {anytime.map((o) => (
                <article key={o.id} className="ob" id={o.id}>
                  <div className="oh">
                    <h3>{o.title}</h3>
                    <span className="cadence">{o.cadence} · {o.timing}</span>
                  </div>
                  <p className="od">{o.detail}</p>
                  <Marks o={o} />
                </article>
              ))}
            </div>
          </section>
        )}

        <section style={{ marginTop: 40 }}>
          <div className="sec-head">
            <h2>시기가 정해진 의무 상세</h2>
            <span className="note">달력에서 고른 항목의 자세한 내용</span>
          </div>
          <div className="ob-list">
            {[...monthly, ...seasonal].map((o) => (
              <article key={o.id} className="ob" id={o.id}>
                <div className="oh">
                  <h3>{o.title}</h3>
                  <span className="cadence">{o.cadence} · {o.timing}</span>
                </div>
                <p className="od">{o.detail}</p>
                <Marks o={o} />
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
