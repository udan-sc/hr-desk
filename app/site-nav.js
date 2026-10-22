'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* 머리글 메뉴 — 14곳을 하는 일 기준 네 묶음으로 나눠 보여 준다.
   넓은 화면: 묶음 이름을 누르거나 마우스를 올리면 아래로 펼쳐진다.
   좁은 화면: '메뉴' 버튼 하나로 네 묶음을 한꺼번에 펼친다.
   노무법전의 하위 경로(/law/..., /topic/...)도 노무법전으로 친다. */
const isActive = (path, m) =>
  m.slug === 'law'
    ? path === '/law' || path.startsWith('/law/') || path.startsWith('/topic')
    : path === m.href || path.startsWith(m.href + '/');

const hoverMode = () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (min-width: 901px)').matches;

/* 지금 보는 화면의 메뉴를 누르면 경로가 그대로라 자동으로 닫히지 않으므로 누를 때 닫는다 */
function Item({ m, path, onPick }) {
  const cur = isActive(path, m);
  return (
    <Link href={m.href} className={`gi${cur ? ' cur' : ''}`} aria-current={cur ? 'page' : undefined} onClick={onPick}>
      <span className="gi-mk" aria-hidden="true">{m.mark}</span>
      <span className="gi-tx">
        <span className="gi-n">{m.name}</span>
        <span className="gi-t">{m.tip}</span>
      </span>
    </Link>
  );
}

export default function SiteNav({ groups }) {
  const path = usePathname() || '/';
  const [open, setOpen] = useState(null);
  const root = useRef(null);
  const timer = useRef(null);

  useEffect(() => setOpen(null), [path]);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (root.current && !root.current.contains(e.target)) setOpen(null);
    };
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      const btn = root.current?.querySelector(`[data-g="${open}"]`);
      setOpen(null);
      btn?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const enter = (key) => {
    if (!hoverMode()) return;
    clearTimeout(timer.current);
    setOpen(key);
  };
  const leave = () => {
    if (!hoverMode()) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(null), 180);
  };
  /* 마우스로는 올리기만 해도 열리므로 누르면 '열린 채로 두기', 키보드(detail 0)·터치는 여닫기 */
  const press = (key, e) => {
    clearTimeout(timer.current);
    if (hoverMode() && e.detail > 0) setOpen(key);
    else setOpen(open === key ? null : key);
  };
  /* 탭 키로 묶음 밖으로 나가면 닫는다. 포커스를 받지 않는 곳(설명 줄·여백)을 누르면 relatedTarget이 비는데,
     그때는 닫지 않는다 — 바깥 누름은 pointerdown 처리가 닫는다 */
  const blurOut = (key) => (e) => {
    const to = e.relatedTarget;
    if (open === key && to && !e.currentTarget.contains(to)) setOpen(null);
  };

  const activeGroup = groups.find((g) => g.items.some((m) => isActive(path, m)))?.key;

  return (
    <div className="gnav" ref={root}>
      <ul className="gnav-groups">
        {groups.map((g) => (
          <li key={g.key} className="gnav-g" onMouseEnter={() => enter(g.key)} onMouseLeave={leave} onBlur={blurOut(g.key)}>
            <button
              type="button"
              data-g={g.key}
              className={`gnav-btn${activeGroup === g.key ? ' cur' : ''}${open === g.key ? ' open' : ''}`}
              aria-expanded={open === g.key}
              aria-controls={`gnav-${g.key}`}
              onClick={(e) => press(g.key, e)}
            >
              {g.label}
              <svg className="gnav-caret" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div id={`gnav-${g.key}`} className="gnav-panel" hidden={open !== g.key}>
              <p className="gnav-desc">{g.desc}</p>
              {g.items.map((m) => (
                <Item key={m.slug} m={m} path={path} onPick={() => setOpen(null)} />
              ))}
            </div>
          </li>
        ))}
      </ul>

      {/* 휴대폰: 메뉴 버튼과 시트를 한 묶음으로 보고, 탭 키로 둘 다 벗어나면(앞·뒤 어느 쪽이든) 닫는다 */}
      <div className="gnav-mob" onBlur={blurOut('all')}>
        <button
          type="button"
          className={`gnav-burger${open === 'all' ? ' open' : ''}`}
          data-g="all"
          aria-expanded={open === 'all'}
          aria-controls="gnav-all"
          aria-label="메뉴"
          onClick={() => setOpen(open === 'all' ? null : 'all')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            {open === 'all' ? (
              <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
          <span className="gnav-bl">메뉴</span>
        </button>
        <div id="gnav-all" className="gnav-sheet" hidden={open !== 'all'}>
          {groups.map((g) => (
            <section key={g.key} className="gs-group">
              <h2 className="gs-h">{g.label}</h2>
              <div className="gs-items">
                {g.items.map((m) => (
                  <Item key={m.slug} m={m} path={path} onPick={() => setOpen(null)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
