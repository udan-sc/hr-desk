'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useHeadcount } from './headcount-context';
import { applies } from '../lib/headcount';

/* 홈의 "이번 달 챙길 일". 정적 빌드라 현재 달은 클라이언트에서 정한다.
   마운트 전에는 아무것도 그리지 않아 서버 렌더와 어긋나지 않는다. */
export default function HomeMonth({ byMonth }) {
  const [month, setMonth] = useState(null);
  const { headcount } = useHeadcount();
  useEffect(() => setMonth(new Date().getMonth() + 1), []);
  if (!month) return null;
  const all = byMonth[month] || [];
  const items = all.filter((o) => applies(headcount, o.thresholdMin));
  const skipped = all.length - items.length;

  return (
    <section className="home-sec">
      <div className="sec-head">
        <h2>{month}월에 챙길 법정 의무</h2>
        <span style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
          {skipped > 0 && <span className="note">우리 규모에 해당 없는 {skipped}건 제외</span>}
          <Link className="more" href="/calendar">연간 캘린더 전체 보기 →</Link>
        </span>
      </div>
      {items.length === 0 ? (
        <p style={{ fontSize: 13.5, color: 'var(--ink2)' }}>
          {headcount ? '이번 달에 우리 규모가 챙길 정기 의무는 없습니다.' : '이번 달로 시기가 정해진 정기 의무는 없습니다.'} 수시 의무는 캘린더에서 확인하세요.
        </p>
      ) : (
        <div className="month-list">
          {items.map((o) => (
            <Link key={o.id} className="month-item" href={`/calendar#${o.id}`}>
              <span className="mt">{o.title}</span>
              <span className="md">{o.timing} · {o.threshold}</span>
              <span className="mw">{o.penalty ? `미이행 시 ${o.penalty}` : o.cadence}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
