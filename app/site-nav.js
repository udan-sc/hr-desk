'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './nav-icons';

/* 사이트 메뉴(시안 C · 워크스페이스).
   넓은 화면(1100px 이상): 왼쪽 어두운 사이드 메뉴에 네 묶음을 전부 펼쳐 두고, 지금 화면을 aria-current로 표시한다.
   좁은 화면: 같은 사이드 메뉴가 서랍이 된다 — 상단 막대의 메뉴 버튼으로 열고, Esc·바깥 누름·닫기 버튼으로 닫는다.
   서랍이 열린 동안 Tab 초점은 서랍 안에서만 돈다.
   노무법전의 하위 경로(/law/..., /topic/...)도 노무법전으로 친다. */
const isActive = (path, m) =>
  m.slug === 'law'
    ? path === '/law' || path.startsWith('/law/') || path.startsWith('/topic')
    : path === m.href || path.startsWith(m.href + '/');

const DESKTOP = '(min-width: 1100px)';

const NavCtx = createContext({ open: false, setOpen: () => {}, btnRef: { current: null } });

/* 메뉴 버튼(상단 막대)과 서랍(사이드 메뉴)이 트리에서 떨어져 있어 열림 상태를 맥락으로 나눠 쓴다 */
export function NavProvider({ children }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const path = usePathname() || '/';
  useEffect(() => setOpen(false), [path]);
  const value = useMemo(() => ({ open, setOpen, btnRef }), [open]);
  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>;
}

/* 본문 바로 가기 — 주소의 #을 바꾸지 않는다(/qa처럼 #으로 질문을 여는 화면이 있어서) */
export function SkipLink() {
  const go = (e) => {
    const el = document.getElementById('main-content');
    if (!el) return;
    e.preventDefault();
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: 'start' });
  };
  return (
    <a className="skip" href="#main-content" onClick={go}>
      본문 바로 가기
    </a>
  );
}

/* 상단 막대의 메뉴 버튼 — 좁은 화면에서만 보인다 */
export function MenuButton() {
  const { open, setOpen, btnRef } = useContext(NavCtx);
  return (
    <button
      ref={btnRef}
      type="button"
      className="menu-btn"
      aria-label="메뉴 열기"
      aria-expanded={open}
      aria-controls="app-side"
      onClick={() => setOpen(true)}
    >
      <Icon name="menu" size={20} stroke={2} />
    </button>
  );
}

/* 사이드 메뉴 틀. 넓은 화면에서는 늘 보이고, 좁은 화면에서는 서랍으로 연다. */
export function AppSide({ children }) {
  const { open, setOpen, btnRef } = useContext(NavCtx);
  const ref = useRef(null);

  const close = useCallback(
    (refocus) => {
      setOpen(false);
      if (refocus) btnRef.current?.focus();
    },
    [setOpen, btnRef]
  );

  useEffect(() => {
    if (!open) return undefined;
    const el = ref.current;
    /* 눈에 보이는(=초점을 받을 수 있는) 것만 */
    const focusables = () =>
      [...el.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(
        (x) => x.offsetParent !== null || x === document.activeElement
      );
    el.querySelector('.as-close')?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        close(true);
        return;
      }
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      const inside = el.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    /* 서랍이 열린 채로 화면이 넓어지면(가로로 돌리기 등) 서랍 상태를 푼다 */
    const mq = window.matchMedia(DESKTOP);
    const onMq = () => mq.matches && close(false);

    document.addEventListener('keydown', onKey);
    mq.addEventListener?.('change', onMq);
    document.documentElement.classList.add('nav-lock');
    return () => {
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener?.('change', onMq);
      document.documentElement.classList.remove('nav-lock');
    };
  }, [open, close]);

  return (
    <>
      <div
        id="app-side"
        ref={ref}
        className={`app-side${open ? ' open' : ''}`}
        {...(open ? { role: 'dialog', 'aria-modal': 'true', 'aria-label': '메뉴' } : {})}
      >
        <button type="button" className="as-close" aria-label="메뉴 닫기" onClick={() => close(true)}>
          <Icon name="close" size={18} stroke={2} />
        </button>
        {children}
      </div>
      {open && <div className="app-side-veil" aria-hidden="true" onClick={() => close(true)} />}
    </>
  );
}

/* 메뉴 목록. counts는 { slug: 건수 } — 실제 자료 개수만 넘어온다(없으면 표시 안 함). */
export default function SiteNav({ groups, counts = {} }) {
  const path = usePathname() || '/';
  const { setOpen } = useContext(NavCtx);
  /* 지금 보는 화면의 메뉴를 누르면 경로가 그대로라 자동으로 닫히지 않으므로 누를 때 닫는다 */
  const pick = () => setOpen(false);

  const item = (key, href, name, cur, count) => (
    <li key={key}>
      <Link href={href} className="snav-a" aria-current={cur ? 'page' : undefined} onClick={pick}>
        <Icon name={key} />
        <span className="snav-n">{name}</span>
        {count != null && (
          <span className="snav-c">
            <span className="vh">, </span>
            {count}
            <span className="vh">건</span>
          </span>
        )}
      </Link>
    </li>
  );

  return (
    <nav className="snav" aria-label="주요 메뉴">
      <ul className="snav-list">{item('home', '/', '오늘', path === '/')}</ul>
      {groups.map((g) => (
        <div key={g.key} className="snav-g">
          <p className="snav-h" id={`snav-${g.key}`}>
            {g.label}
          </p>
          <ul className="snav-list" aria-labelledby={`snav-${g.key}`}>
            {g.items.map((m) => item(m.slug, m.href, m.name, isActive(path, m), counts[m.slug]))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* 상단 막대 왼쪽의 지금 위치(넓은 화면) — 사이드 메뉴에서 강조된 항목과 같은 이름 */
export function TopTitle({ groups }) {
  const path = usePathname() || '/';
  let name = '오늘';
  let icon = 'home';
  if (path !== '/') {
    const m = groups.flatMap((g) => g.items).find((x) => isActive(path, x));
    if (!m) return null;
    name = m.name;
    icon = m.slug;
  }
  return (
    <p className="top-title">
      <Icon name={icon} size={16} />
      {name}
    </p>
  );
}
