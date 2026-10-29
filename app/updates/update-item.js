import Link from 'next/link';
import { UPDATE_TYPES } from '../../lib/platform';

export const kDate = (iso) => (iso ? iso.split('-').map(Number).join('. ') + '.' : '');
const short = (iso) => (iso ? iso.split('-').slice(1).map(Number).join('. ') + '.' : '');

/* 왼쪽 날짜(처음 알린 날)만으로 부족한 경우만 한 줄 덧붙인다 — 공포는 시행일이 따로 있다 */
export function updateMeta(x, today) {
  if (x.type === 'promulgated') {
    /* 한 법률이 날짜를 나눠 시행되면 시행일을 모두 적는다 */
    const ds = x.efYds || (x.efYd ? [x.efYd] : []);
    const last = ds[ds.length - 1];
    return `${kDate(x.date)} 공포 · ${ds.map(kDate).join(', ')} ${last && last <= today ? '시행' : '시행 예정'}`;
  }
  if (x.type === 'soon') return `${kDate(x.efYd)} 시행`;
  return '';
}

/* '바뀐 것' 한 줄 — 이번 주 바뀐 것 페이지와 홈에서 함께 쓴다 */
export default function UpdateItem({ x, today, compact = false }) {
  return (
    <li className={`upd t-${x.type}`}>
      <time className="upd-day" dateTime={x.firstSeen}>
        {short(x.firstSeen)}
      </time>
      <div className="upd-main">
        <div className="upd-top">
          <span className="upd-type">{UPDATE_TYPES[x.type]}</span>
          {x.law && x.type !== 'precedent' && <span className="upd-law">{x.law}</span>}
        </div>
        {/* 이월된 판례처럼 이번 빌드에 없는 것은 국가법령정보센터 원문으로 잇는다 */}
        {x.href.startsWith('http') ? (
          <a className="upd-title" href={x.href} target="_blank" rel="noopener noreferrer">
            {x.title}
            <span className="vh"> (국가법령정보센터, 새 창)</span> <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <Link className="upd-title" href={x.href}>
            {x.title}
          </Link>
        )}
        {!compact && x.summary && <p className="upd-sum">{x.summary}</p>}
        {updateMeta(x, today) && <span className="upd-meta">{updateMeta(x, today)}</span>}
      </div>
    </li>
  );
}
