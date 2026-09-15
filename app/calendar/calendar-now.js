'use client';

import { useEffect, useState } from 'react';

/* 현재 달 카드에 표시를 붙인다. 페이지는 정적으로 빌드되므로
   '이번 달' 판정은 반드시 클라이언트에서 해야 한다(빌드 시점 고정 방지). */
export default function CalendarNow({ month, children }) {
  const [now, setNow] = useState(false);
  useEffect(() => {
    setNow(new Date().getMonth() + 1 === month);
  }, [month]);
  const kids = Array.isArray(children) ? children : [children];
  return (
    <section className={`cal-month${now ? ' now' : ''}`}>
      {kids.map((k, i) =>
        k?.type === 'h2' && now ? (
          <h2 key={i}>
            {k.props.children} <span className="now-tag">이번 달</span>
          </h2>
        ) : (
          <span key={i} style={{ display: 'contents' }}>{k}</span>
        )
      )}
    </section>
  );
}
