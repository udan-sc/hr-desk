'use client';

import { useEffect, useState } from 'react';
import { useHeadcount } from '../headcount-context';
import { applies } from '../../lib/headcount';

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

/* 연간 뷰 — 12칸에 그 달의 의무를 점으로 찍어 한 해 부하가 한눈에 보이게 한다.
   점에는 data-threshold가 있어 규모 필터가 켜지면 함께 흐려진다. 현재 달은 마운트 후 표시. */
export default function YearStrip({ items, monthlyCount, anytimeCount }) {
  const [now, setNow] = useState(0);
  const { headcount } = useHeadcount();
  useEffect(() => {
    setNow(new Date().getMonth() + 1);
  }, []);

  return (
    <section className="ystrip" aria-label="연간 한눈에 보기">
      <div className="ys-grid">
        {MONTHS.map((name, i) => {
          const m = i + 1;
          const list = items.filter((o) => o.months.includes(m));
          /* 점은 규모 필터로 흐려지므로 숫자도 '적용 x/전체 y'로 맞춘다 */
          const inScope = headcount ? list.filter((o) => applies(headcount, o.thresholdMin)).length : list.length;
          return (
            <a key={m} className={`ys-cell${now === m ? ' now' : ''}`} href={`#cal-m-${m}`}>
              <span className="ys-m">{name}</span>
              {now === m && <span className="ys-now">이번 달</span>}
              <span className="ys-dots">
                {list.map((o) => (
                  <span key={o.id} className="ys-dot" data-threshold={o.thresholdMin} title={o.title} />
                ))}
              </span>
              <span className="ys-n">
                {!list.length ? '–' : headcount && inScope !== list.length ? `적용 ${inScope}/${list.length}` : `${list.length}건`}
              </span>
            </a>
          );
        })}
      </div>
      <p className="ys-note">
        점 하나가 의무 한 건입니다. 여기에 더해 <b>매달 반복 {monthlyCount}건</b>, <b>사건이 생기면 바로 {anytimeCount}건</b>이
        있습니다.
      </p>
    </section>
  );
}
