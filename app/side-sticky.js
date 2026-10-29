'use client';

import { useEffect } from 'react';

/* 조문 화면 오른쪽 열(.art-side)을 넓은 화면에서 스크롤을 따라오게(sticky) 한다.
   열 전체가 화면 높이 안에 들어갈 때만 .stick을 붙여 열 전체가 따라오게 하고, 더 길면 CSS가 맨 위 근거 복사 카드만 따라오게 한다
   (열 전체를 붙이면 sticky가 아래쪽을 화면 밖에 가둬 버린다).
   높이는 인원 설정·창 크기에 따라 바뀌니 ResizeObserver로 다시 잰다. 화면에는 아무것도 그리지 않는다. */
export default function SideSticky({ selector = '.art-side', room = 32 }) {
  useEffect(() => {
    const el = document.querySelector(selector);
    if (!el) return;
    const wide = window.matchMedia('(min-width: 1100px)');
    /* 열 높이는 첫 카드 위끝부터 마지막 카드 아래끝까지로 잰다 — .stick이 없을 때는 CSS가 열을 본문 끝까지 늘려
       offsetHeight가 내용 높이가 아니다 */
    const contentHeight = () => {
      const a = el.firstElementChild;
      const b = el.lastElementChild;
      return a && b ? b.getBoundingClientRect().bottom - a.getBoundingClientRect().top : el.offsetHeight;
    };
    const fit = () => el.classList.toggle('stick', wide.matches && contentHeight() + room <= window.innerHeight);
    fit();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    /* 열이 늘어나 있으면 카드 높이가 바뀌어도 열 크기는 그대로일 수 있어 카드도 따로 지켜본다 */
    for (const c of el.children) ro?.observe(c);
    window.addEventListener('resize', fit);
    wide.addEventListener?.('change', fit);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', fit);
      wide.removeEventListener?.('change', fit);
      el.classList.remove('stick');
    };
  }, [selector, room]);
  return null;
}
