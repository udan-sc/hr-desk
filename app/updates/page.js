import Link from 'next/link';
import { updates, changes, autoChanges } from '../../lib/platform';
import { SITE_URL } from '../../lib/site';
import CopyButton from '../copy-button';
import UpdateItem, { kDate } from './update-item';
import PageSearch from '../page-search';

export const metadata = {
  title: '이번 주 바뀐 것',
  description: '새로 공포·시행된 노동법 개정, 새 대법원 판례, 사이트 새 기능을 날짜순으로 모았습니다. RSS로 구독할 수 있습니다.',
  alternates: { canonical: '/updates' },
};

const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/* 지난 기록은 월요일~일요일 한 주씩 묶는다 */
const weekStart = (iso) => {
  const d = new Date(iso + 'T00:00:00Z');
  return addDays(iso, -((d.getUTCDay() + 6) % 7));
};

export default function UpdatesPage() {
  const today = updates.today || new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  /* '이번 주'는 월요일부터 오늘까지 — 지난 기록의 월~일 묶음과 겹치지 않게 */
  const from = weekStart(today);
  /* '시행 임박' 알림은 RSS 구독자용 — 화면에서는 아래 '곧 시행' 목록이 같은 역할을 한다 */
  const items = (updates.items || []).filter((x) => x.type !== 'soon');
  const week = items.filter((x) => x.firstSeen >= from);
  const older = items.filter((x) => x.firstSeen < from);
  const weeks = [];
  for (const x of older) {
    const w = weekStart(x.firstSeen);
    const last = weeks[weeks.length - 1];
    if (last && last.start === w) last.items.push(x);
    else weeks.push({ start: w, items: [x] });
  }
  const soon = [...changes, ...autoChanges]
    .filter((c) => c.effectiveDate > today && c.effectiveDate <= addDays(today, 30))
    .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  const feed = `${SITE_URL}/updates.xml`;

  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">매일 자동 집계 · RSS 구독</div>
          <h1>이번 주 바뀐 것</h1>
          <p>
            새로 공포되거나 시행된 노동법 개정, 새로 나온 대법원 판례, 이 사이트에 새로 생긴 기능을 날짜순으로 모았습니다.
            개정 여부는 국가법령정보센터 원문으로 매일 확인합니다.
          </p>
        </header>
        <PageSearch item=".upd, .soon-list li" group=".upd-week, .upd-sec" placeholder="예: 근로기준법, 판례, 시행" />

        <div className="upd-layout">
          <div className="upd-col">
            <section className="upd-sec" aria-labelledby="upd-week">
              <div className="sec-head">
                <h2 id="upd-week">이번 주</h2>
                <span className="note">
                  {kDate(from)} ~ {kDate(today)} · {week.length}건
                </span>
              </div>
              {week.length ? (
                <ul className="upd-list">
                  {week.map((x) => (
                    <UpdateItem key={x.id} x={x} today={today} />
                  ))}
                </ul>
              ) : (
                <p className="upd-empty">이번 주에 새로 공포·시행된 개정이나 새 판례는 없습니다. 아래 지난 기록과 곧 시행되는 개정을 확인하세요.</p>
              )}
            </section>

            {weeks.length > 0 && (
              <section className="upd-sec" aria-labelledby="upd-past">
                <div className="sec-head">
                  <h2 id="upd-past">지난 기록</h2>
                  <span className="note">최근 120일</span>
                </div>
                {weeks.map((w) => (
                  <div key={w.start} className="upd-week">
                    <h3>
                      {kDate(w.start)} ~ {kDate(addDays(w.start, 6))}
                    </h3>
                    <ul className="upd-list">
                      {w.items.map((x) => (
                        <UpdateItem key={x.id} x={x} today={today} />
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}
          </div>

          <aside className="upd-side">
            <section className="tpanel" aria-labelledby="upd-rss">
              <h2 id="upd-rss" className="tpanel-h">RSS로 구독하기</h2>
              <p className="tpanel-p">이 주소를 구독하면 새 소식이 생길 때마다 받아 볼 수 있습니다.</p>
              <div className="feed-url">
                <code>{feed}</code>
                <CopyButton text={feed} label="주소 복사" className="sm" />
              </div>
              <details className="feed-how">
                <summary>구독 방법 보기</summary>
                <dl>
                  <dt>Outlook (Windows 데스크톱)</dt>
                  <dd>왼쪽 폴더 목록의 ‘RSS 피드’ 폴더를 오른쪽 클릭 → ‘새 RSS 피드 추가’ → 주소 붙여넣기. 새 Outlook·웹 Outlook에는 이 기능이 없을 수 있습니다.</dd>
                  <dt>Slack</dt>
                  <dd>워크스페이스에 RSS 앱을 추가한 뒤, 받을 채널에서 <code>/feed subscribe 주소</code>를 입력합니다.</dd>
                  <dt>Microsoft Teams</dt>
                  <dd>채널의 ‘워크플로’에서 RSS 피드를 채널에 게시하는 템플릿을 골라 주소를 넣습니다.</dd>
                  <dt>피드 리더 (Feedly·Inoreader 등)</dt>
                  <dd>‘구독 추가’ 칸에 주소를 붙여넣습니다.</dd>
                </dl>
              </details>
            </section>

            <section className="tpanel" aria-labelledby="upd-soon">
              <div className="tpanel-hrow">
                <h2 id="upd-soon" className="tpanel-h">30일 안에 시행</h2>
                <Link className="more" href="/changes">
                  전체 →
                </Link>
              </div>
              {soon.length ? (
                <ul className="soon-list">
                  {soon.map((c) => (
                    <li key={c.id}>
                      <Link href={`/changes#${c.id}`}>
                        <span className="soon-d">{kDate(c.effectiveDate)}</span>
                        <span className="soon-t">{c.title}</span>
                        <span className="soon-law">{c.law}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="tpanel-p">30일 안에 시행되는 개정은 없습니다.</p>
              )}
            </section>

            <p className="upd-note">
              모으는 것: 우리 사이트가 다루는 19개 법령의 개정 공포·시행, 달라지는 노동법에 정리한 개정의 시행, 자동 수집된 새
              대법원 판례, 사이트 새 기능. {kDate(today)} 기준으로 하루 세 번 갱신됩니다.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
