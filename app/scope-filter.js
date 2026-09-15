'use client';

import { useEffect, useState } from 'react';
import { useHeadcount } from './headcount-context';
import { applies } from '../lib/headcount';

/* 규모에 맞지 않는 항목을 셈해서 알려주고, 원하면 목록에서 숨긴다.
   항목 본체는 서버에서 그려지므로 숨김은 body 클래스 하나로 CSS에 맡기고,
   달력 안의 링크처럼 배지가 없는 줄만 data-threshold를 보고 직접 접는다. */
export default function ScopeFilter({ items, label }) {
  const { headcount } = useHeadcount();
  const [hide, setHide] = useState(false);

  const total = items.length;
  const inScope = items.filter((it) => applies(headcount, it.threshold)).length;
  const out = total - inScope;

  useEffect(() => {
    const on = hide && headcount > 0 && out > 0;
    document.body.classList.toggle('hide-out-of-scope', on);
    return () => document.body.classList.remove('hide-out-of-scope');
  }, [hide, headcount, out]);

  useEffect(() => {
    const nodes = document.querySelectorAll('[data-threshold]');
    nodes.forEach((el) => {
      const t = Number(el.dataset.threshold) || 1;
      const off = headcount > 0 && headcount < t;
      el.classList.toggle('out-of-scope', off);
      el.hidden = hide && off;
    });
  }, [headcount, hide]);

  if (!headcount) return null;

  return (
    <p className="hc-summary" role="status" aria-live="polite">
      <span>
        상시 {headcount}명 기준 — {label} {total}건 가운데 <b>{inScope}건</b>이 적용됩니다.
        {out > 0 && ` 나머지 ${out}건은 아직 해당하지 않습니다.`}
      </span>
      {out > 0 && (
        <button type="button" aria-pressed={hide} onClick={() => setHide((v) => !v)}>
          {hide ? `해당 없는 ${out}건 다시 보기` : `해당 없는 ${out}건 숨기기`}
        </button>
      )}
    </p>
  );
}
