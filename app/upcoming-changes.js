'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/* 홈에 띄우는 "곧 시행되는 개정" — 무엇이 다가오는지 보는 날짜 기준이어야 하므로
   마운트 후에 오늘 이후 항목을 골라낸다(정적 빌드와 어긋나지 않게 마운트 전에는 비움). */
export default function UpcomingChanges({ items }) {
  const [next, setNext] = useState(null);
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setNext(items.filter((c) => new Date(c.effectiveDate + 'T00:00:00') > today).slice(0, 3));
  }, [items]);
  if (!next || next.length === 0) return null;

  const dday = (iso) => {
    const ms = new Date(iso + 'T00:00:00') - new Date(new Date().toDateString());
    return Math.round(ms / 86400000);
  };
  const fmt = (iso) => {
    const [y, m, d] = iso.split('-');
    return `${y}. ${Number(m)}. ${Number(d)}.`;
  };

  return (
    <section className="upcoming" aria-label="곧 시행되는 개정">
      <div className="up-head">
        <h2>곧 시행되는 개정</h2>
        <Link className="more" href="/changes">
          연도별 전체 보기 →
        </Link>
      </div>
      <div className="up-list">
        {next.map((c) => (
          <Link key={c.id} className="up-item" href={`/changes#${c.id}`}>
            <span className="up-when">
              {fmt(c.effectiveDate)}
              <small>D-{dday(c.effectiveDate)}</small>
            </span>
            <span className="up-what">
              <span className="up-law">{c.law}</span>
              {c.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
