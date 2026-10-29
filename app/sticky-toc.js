'use client';

import { useEffect, useRef, useState } from 'react';

/* 긴 페이지용 따라다니는 목차. 화면에 들어온 구획을 감시해 현재 위치를 표시한다.
   목차 실제 높이를 --stoc-h 에 넣어 앵커 대상의 scroll-margin과 감시 영역이 목차에 가려지지 않게 맞춘다. */
export default function StickyToc({ items }) {
  const [active, setActive] = useState(null);
  const navRef = useRef(null);

  useEffect(() => {
    const measure = () => {
      const h = navRef.current?.offsetHeight || 48;
      document.documentElement.style.setProperty('--stoc-h', `${h}px`);
      return h;
    };
    let io = null;
    const observe = () => {
      io?.disconnect();
      const h = measure();
      const els = items.map((it) => document.getElementById(it.id)).filter(Boolean);
      if (!els.length || typeof IntersectionObserver === 'undefined') return;
      const visible = new Map();
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => visible.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null));
          let best = null;
          let bestTop = Infinity;
          visible.forEach((top, id) => {
            if (top !== null && top < bestTop) {
              bestTop = top;
              best = id;
            }
          });
          if (best) setActive(best);
        },
        { rootMargin: `-${h + 8}px 0px -60% 0px`, threshold: 0 }
      );
      els.forEach((el) => io.observe(el));
    };
    observe();
    window.addEventListener('resize', observe);
    return () => {
      io?.disconnect();
      window.removeEventListener('resize', observe);
      document.documentElement.style.removeProperty('--stoc-h');
    };
  }, [items]);

  /* 휴대폰에서는 목차가 한 줄 가로 스크롤이다 — 현재 묶음이 바뀌면 그 링크가 보이도록 목차만 가로로 민다.
     scrollIntoView는 페이지까지 세로로 움직일 수 있어 쓰지 않는다. 오른쪽 흐린 끝(32px)은 비켜 둔다 */
  useEffect(() => {
    const nav = navRef.current;
    const on = nav?.querySelector('.on');
    if (!nav || !on || nav.scrollWidth <= nav.clientWidth) return;
    const left = on.offsetLeft;
    const right = left + on.offsetWidth;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (left < nav.scrollLeft) nav.scrollTo({ left: Math.max(0, left - 16), behavior });
    else if (right > nav.scrollLeft + nav.clientWidth - 32) nav.scrollTo({ left: right - nav.clientWidth + 40, behavior });
  }, [active]);

  return (
    <nav className="stoc" aria-label="목차" ref={navRef}>
      {items.map((it) => (
        <a
          key={it.id}
          className={`tag${active === it.id ? ' on' : ''}`}
          href={`#${encodeURIComponent(it.id)}`}
          aria-current={active === it.id ? 'location' : undefined}
        >
          {it.label}
          {it.count != null && <span className="stoc-n">{it.count}</span>}
        </a>
      ))}
    </nav>
  );
}
