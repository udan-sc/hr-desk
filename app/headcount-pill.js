'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useHeadcount } from './headcount-context';
import HeadcountBar from './headcount-bar';
import Icon from './nav-icons';

/* 상단 막대의 '상시 N명' 알약. 누르면 작은 창에서 인원을 바로 바꾼다(HeadcountBar를 그대로 쓴다).
   인원이 아직 없으면 '우리 회사 인원 설정'으로 보인다. 저장값은 headcount-context가 맡는다. */
export default function HeadcountPill() {
  const { headcount, ready } = useHeadcount();
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const btn = useRef(null);
  const path = usePathname();

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return undefined;
    root.current?.querySelector('.hc-pop input')?.focus();
    const onDown = (e) => {
      if (root.current && !root.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      btn.current?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /* 탭 키로 알약·창 밖으로 나가면 닫는다(포커스를 받지 않는 곳을 누를 때는 relatedTarget이 비어 닫지 않음) */
  const blurOut = (e) => {
    const to = e.relatedTarget;
    if (open && to && !e.currentTarget.contains(to)) setOpen(false);
  };

  const set = ready && headcount > 0;
  return (
    <div className="hc-pill-wrap" ref={root} onBlur={blurOut}>
      <button
        ref={btn}
        type="button"
        className={`hc-pill${set ? ' set' : ''}`}
        aria-expanded={open}
        aria-controls={open ? 'hc-pop' : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="users" size={16} />
        {set ? (
          <span>
            상시 <b>{headcount}</b>명<span className="vh"> — 우리 회사 인원 바꾸기</span>
          </span>
        ) : (
          <span>
            <span className="hp-long">우리 회사 </span>인원 설정
          </span>
        )}
      </button>
      {open && (
        <div id="hc-pop" className="hc-pop" role="dialog" aria-label="우리 회사 인원 설정">
          <HeadcountBar id="headcount-top" hint="인원을 넣으면 노무법전·캘린더·규정서식에서 우리 규모에 해당 없는 항목이 흐리게 표시됩니다." />
        </div>
      )}
    </div>
  );
}
