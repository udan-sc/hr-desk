'use client';

import { useEffect } from 'react';

/* 용어 툴팁을 Esc로 닫을 수 있게 한다(WCAG 1.4.13). 마우스가 그 용어를 벗어나거나
   포커스가 다른 곳으로 옮겨가면 다시 뜰 수 있게 풀어 준다. */
export default function TipDismiss() {
  useEffect(() => {
    const root = document.documentElement;
    const onKey = (e) => {
      if (e.key === 'Escape') root.classList.add('tips-off');
    };
    const onOut = (e) => {
      const t = e.target.closest?.('.term');
      if (t && !t.contains(e.relatedTarget)) root.classList.remove('tips-off');
    };
    const onFocus = () => root.classList.remove('tips-off');
    document.addEventListener('keydown', onKey);
    document.addEventListener('mouseout', onOut);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mouseout', onOut);
      document.removeEventListener('focusin', onFocus);
      root.classList.remove('tips-off');
    };
  }, []);
  return null;
}
