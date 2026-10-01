import Link from 'next/link';
import TimeBadge from './changes/time-badge';

const fmt = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${y}. ${Number(m)}. ${Number(d)}.`;
};

/* 조문 상세 상단 — 이 조문과 얽힌 개정이 있으면 먼저 알린다.
   조문 본문은 기준일 시점이라 그 뒤 시행되는 개정은 본문에 없기 때문이다. */
export default function ChangeNotice({ items }) {
  if (!items?.length) return null;
  return (
    <aside className="chg-notice" aria-label="관련 개정">
      <div className="cn-h">
        <span className="cn-mark" aria-hidden="true">改</span>
        이 조문과 관련된 개정 {items.length}건
      </div>
      {items.map((c) => (
        <Link key={c.id} className="cn-item" href={`/changes#${c.id}`}>
          <span className="cn-date">{fmt(c.effectiveDate)}</span>
          <TimeBadge date={c.effectiveDate} />
          <span className="cn-t">{c.title}</span>
          <span className="cn-law">{c.law}</span>
        </Link>
      ))}
    </aside>
  );
}
