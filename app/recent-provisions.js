'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/* 최근 본 조문 — 이 브라우저에만 저장(localStorage)되고 서버로는 가지 않는다.
   hydration이 어긋나지 않도록 저장소는 마운트 후에만 읽는다. */
const KEY = 'nomu-recent';
const MAX = 8;

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => x && x.law && x.article) : [];
  } catch {
    return [];
  }
};

/* 조문 상세에 심어 두면 방문을 기록한다. 화면에는 아무것도 그리지 않는다. */
export function RecentTracker({ law, article, title }) {
  useEffect(() => {
    try {
      const list = read().filter((x) => !(x.law === law && x.article === article));
      list.unshift({ law, article, title });
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    } catch {
      /* 시크릿 창 등에서 저장이 막혀도 열람은 그대로 */
    }
  }, [law, article, title]);
  return null;
}

export default function RecentProvisions() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    setItems(read());
  }, []);
  if (!items.length) return null;

  return (
    <nav className="recent-row" aria-label="최근 본 조문">
      <span className="rr-label">최근 본 조문</span>
      {items.map((x) => (
        <Link
          key={`${x.law}|${x.article}`}
          className="rr-chip"
          href={`/law/${encodeURIComponent(x.law)}/${encodeURIComponent(x.article)}`}
        >
          {x.law} {x.article}
          {x.title ? <small>{x.title}</small> : null}
        </Link>
      ))}
    </nav>
  );
}
