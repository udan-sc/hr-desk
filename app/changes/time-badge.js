'use client';

import { useEffect, useState } from 'react';

/* 시행일이 지났는지는 보는 시점 기준이어야 하므로(정적 사이트) 마운트 후 계산한다.
   마운트 전에는 아무것도 그리지 않아 hydration이 어긋나지 않는다. */
export default function TimeBadge({ date }) {
  const [state, setState] = useState(null);
  useEffect(() => {
    const today = new Date();
    const d = new Date(date + 'T00:00:00');
    setState(d <= today ? 'on' : 'todo');
  }, [date]);
  if (!state) return null;
  return <span className={`tl-state ${state}`}>{state === 'on' ? '시행 중' : '시행 예정'}</span>;
}
