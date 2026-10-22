import Link from 'next/link';
import { updates } from '../../lib/platform';
import UpdateItem from './update-item';

/* 이번 주 = 월요일부터 오늘까지('이번 주 바뀐 것' 화면과 같은 기준) */
const weekStart = (iso) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

/* 홈 '이번 주 바뀐 것' — 이번 주 것이 적으면 최근 것으로 채워 늘 몇 줄은 보이게 한다 */
export default function UpdatesMini({ max = 5 }) {
  const today = updates.today;
  const items = (updates.items || []).filter((x) => x.type !== 'soon');
  if (!today || !items.length) return null;
  const from = weekStart(today);
  const week = items.filter((x) => x.firstSeen >= from);
  const shown = (week.length >= 3 ? week : items).slice(0, max);

  return (
    <section className="tpanel" aria-labelledby="um-h">
      <div className="tpanel-hrow">
        <h3 id="um-h" className="tpanel-h">
          {week.length >= 3 ? '이번 주 바뀐 것' : '최근 바뀐 것'}
        </h3>
        {week.length > 0 && <span className="tpanel-note">이번 주 {week.length}건</span>}
        <Link className="more" href="/updates">
          전체·구독 →
        </Link>
      </div>
      <ul className="upd-list compact">
        {shown.map((x) => (
          <UpdateItem key={x.id} x={x} today={today} compact />
        ))}
      </ul>
    </section>
  );
}
