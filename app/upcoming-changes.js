'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CardHead from './home-card';

/* 홈의 "곧 시행"(시안 C 타임라인) — 무엇이 다가오는지 보는 날짜 기준이어야 하므로
   마운트 후에 오늘 이후 항목과 D-day를 계산한다(정적 빌드와 어긋나지 않게 마운트 전에는 틀만 그림).
   30일 안에 시행되는 것은 호박색으로 마감 임박을 알린다. */
const MAX = 6;
const SOON = 30;

const fmt = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${y}. ${Number(m)}. ${Number(d)}.`;
};

export default function UpcomingChanges({ items }) {
  const [next, setNext] = useState(null);
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setNext(
      items
        .filter((c) => new Date(c.effectiveDate + 'T00:00:00') > today)
        .slice(0, MAX)
        .map((c) => ({ ...c, d: Math.round((new Date(c.effectiveDate + 'T00:00:00') - today) / 86400000) }))
    );
  }, [items]);

  return (
    <section className="hd-card hd-soon" aria-labelledby="up-h" aria-busy={!next || undefined}>
      <CardHead id="up-h" icon="changes" title="곧 시행" sub="달라지는 노동법 · 시행일 순" moreHref="/changes" more="달라지는 노동법 전체" />
      {!next ? (
        <div className="hd-wait short" />
      ) : next.length === 0 ? (
        <p className="hd-empty">오늘 이후 시행 예정인 개정이 없습니다. 지난 개정은 달라지는 노동법에서 볼 수 있습니다.</p>
      ) : (
        <ol className="hu-list">
          {next.map((c, i) => (
            <li key={c.id} className={`hu-item${i === 0 ? ' first' : ''}`}>
              <span className="hu-dot" aria-hidden="true" />
              <Link className="hu-a" href={`/changes#${c.id}`}>
                <span className="hu-when">
                  <time className="mono" dateTime={c.effectiveDate}>
                    {fmt(c.effectiveDate)}
                  </time>
                  <span className={`hu-d mono${c.d <= SOON ? ' soon' : ''}`} aria-hidden="true">
                    D-{c.d}
                  </span>
                  <span className="vh">, {c.d}일 남음</span>
                </span>
                <span className="hu-t">{c.title}</span>
                <span className="hu-law">
                  {c.law}
                  {c.auto && <span className="tl-auto">자동 감지</span>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
