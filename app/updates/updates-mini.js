import { updates } from '../../lib/platform';
import UpdateItem from './update-item';
import CardHead from '../home-card';

/* 이번 주 = 월요일부터 오늘까지('이번 주 바뀐 것' 화면과 같은 기준) */
const weekStart = (iso) => {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};

/* 홈 '이번 주 바뀐 것' 카드 — 이번 주 것이 적으면 최근 것으로 채워 늘 몇 줄은 보이게 한다 */
export default function UpdatesMini({ max = 5 }) {
  const today = updates.today;
  const items = (updates.items || []).filter((x) => x.type !== 'soon');
  if (!today || !items.length) return null;
  const from = weekStart(today);
  const week = items.filter((x) => x.firstSeen >= from);
  const shown = (week.length >= 3 ? week : items).slice(0, max);

  return (
    <section className="hd-card hd-upd" aria-labelledby="um-h">
      <CardHead
        id="um-h"
        icon="updates"
        title={week.length >= 3 ? '이번 주 바뀐 것' : '최근 바뀐 것'}
        badge={
          week.length > 0 ? (
            <span className="hd-badge">
              {/* 한 덩어리로 감싸야 flex 항목으로 쪼개지며 '이번 주' 뒤 띄어쓰기가 사라지지 않는다 */}
              <span>
                이번 주 <span className="mono">{week.length}</span>건
              </span>
            </span>
          ) : null
        }
        moreHref="/updates"
        more="전체·구독"
      />
      <ul className="upd-list compact">
        {shown.map((x) => (
          <UpdateItem key={x.id} x={x} today={today} compact />
        ))}
      </ul>
    </section>
  );
}
