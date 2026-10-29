'use client';

import { useEffect, useState } from 'react';
import Icon from './nav-icons';

/* '맨 위로' 단추 — 1100px 미만(사이드 메뉴가 서랍이 되고 상단 막대가 따라오지 않는 화면)에서만 보인다(CSS).
   노무법전·판례처럼 아주 긴 화면에서 메뉴·통합 검색·인원 알약이 있는 상단 막대로 한 번에 돌아가게 한다.
   두 화면 넘게 내려갔을 때만 나타나고, 누르면 초점을 상단 막대의 메뉴 버튼으로 옮겨 키보드로도 바로 이어 쓴다. */
export default function ToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setShow(window.scrollY > window.innerHeight * 2));
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  if (!show) return null;

  const go = () => {
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    document.querySelector('.menu-btn')?.focus({ preventScroll: true });
  };

  return (
    <button type="button" className="to-top" aria-label="맨 위로" onClick={go}>
      <Icon name="chevron" size={18} stroke={2} />
    </button>
  );
}
