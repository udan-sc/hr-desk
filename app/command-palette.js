'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { asset, BASE_PATH } from '../lib/site';

/* 통합 검색 (Ctrl+K). 조문·계산기·절차·캘린더 의무·서식·분야를 한 창에서 찾아 이동한다.
   색인(public/palette-index.json)은 빌드 때 구워 두고, 처음 열 때 한 번만 내려받는다. */

const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ');

function search(items, q) {
  const terms = norm(q).split(' ').filter(Boolean);
  if (!terms.length) return [];
  const scored = [];
  for (const it of items) {
    const title = norm(it.t);
    const rest = norm(`${it.k || ''} ${it.d || ''}`);
    let score = 0;
    let miss = false;
    for (const term of terms) {
      if (title.includes(term)) score += 10;
      else if (rest.includes(term)) score += 3;
      else { miss = true; break; }
    }
    if (miss) continue;
    if (title.startsWith(norm(q))) score += 6;
    scored.push([score, it]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, 12).map(([, it]) => it);
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [items, setItems] = useState(null);
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  /* 열기 직전 초점(보통 상단 검색 버튼) — 닫으면 그리로 돌려준다(인원 창·서랍과 같게).
     입력칸 autoFocus가 효과(useEffect)보다 먼저 초점을 가져가므로, 여는 순간(누름·Ctrl+K)에 잡아 둔다 */
  const lastFocus = useRef(null);
  const openRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  /* 어느 페이지에서든 Ctrl+K(맥은 Cmd+K)로 연다 */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (!openRef.current) lastFocus.current = document.activeElement;
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* 색인은 처음 열 때 한 번만 받는다 */
  useEffect(() => {
    if (!open || items) return;
    fetch(asset('/palette-index.json'))
      .then((r) => (r.ok ? r.json() : []))
      .then(setItems)
      .catch(() => setItems([]));
  }, [open, items]);

  useEffect(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      /* 처음 마운트할 때는 비어 있어 아무 일도 없다. 결과를 골라 다른 화면으로 가면 그 버튼이 없어졌을 수 있어 연결된 것만 */
      const back = lastFocus.current;
      lastFocus.current = null;
      if (back && back !== document.body && back.isConnected) back.focus?.();
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const results = items ? (q.trim() ? search(items, q) : items.filter((it) => it.g === '메뉴')) : [];

  useEffect(() => {
    if (sel >= results.length) setSel(0);
  }, [q, results.length, sel]);

  function go(it) {
    setOpen(false);
    /* 같은 화면 안의 #으로 갈 때는 router.push가 hashchange를 내지 않아 그 화면이 알아채지 못한다(예: /qa에서 다른 질문 고르기) */
    const [p, h] = it.h.split('#');
    const here = window.location.pathname.replace(BASE_PATH, '').replace(/\/$/, '') || '/';
    if (h && (p.replace(/\/$/, '') || '/') === here && !p.includes('?')) {
      /* 이미 같은 #이면 바꿔도 hashchange가 나지 않으므로 직접 알린다 */
      if (window.location.hash.slice(1) === h) window.dispatchEvent(new HashChangeEvent('hashchange'));
      else window.location.hash = h;
      return;
    }
    router.push(it.h);
  }

  function onInputKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && results[sel]) {
      e.preventDefault();
      go(results[sel]);
    }
  }

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  return (
    <>
      {/* 상단 막대의 넓은 검색창 모양 버튼 — 누르거나 Ctrl+K로 통합 검색 창을 연다.
          보이는 글자가 곧 버튼 이름이 되도록 aria-label을 따로 두지 않는다 */}
      <button
        type="button"
        className="pal-trigger"
        onClick={(e) => {
          /* 사파리는 단추를 눌러도 초점을 주지 않으므로 활성 요소 대신 이 단추 자체를 기억한다 */
          lastFocus.current = e.currentTarget;
          setOpen(true);
        }}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="pt-label">
          통합 검색<span className="pt-ex"> — 조문·계산기·절차·서식 (예: 연차, 60조, 퇴직금)</span>
        </span>
        <kbd aria-hidden="true">Ctrl K</kbd>
      </button>

      {open && (
        <div className="pal-veil" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="pal" role="dialog" aria-modal="true" aria-label="통합 검색">
            <div className="pal-in">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => { setQ(e.target.value); setSel(0); }}
                onKeyDown={onInputKey}
                placeholder="조문·계산기·절차·서식 검색…  (예: 연차, 60조, 퇴직금, 성희롱 교육)"
                aria-label="검색어"
                autoComplete="off"
                spellCheck="false"
                autoFocus
              />
              <button type="button" className="pal-esc" onClick={() => setOpen(false)}>esc</button>
            </div>

            <div className="pal-list" ref={listRef} role="listbox" aria-label="검색 결과">
              {!items && <p className="pal-empty">색인을 불러오는 중…</p>}
              {items && q.trim() && results.length === 0 && (
                <p className="pal-empty">
                  일치하는 항목이 없습니다. 다른 말로 바꿔 보거나, 노무법전의 전문 검색을 써 보세요.
                </p>
              )}
              {results.map((it, i) => (
                <button
                  key={`${it.h}-${it.t}`}
                  type="button"
                  role="option"
                  aria-selected={i === sel}
                  className={`pal-item${i === sel ? ' on' : ''}`}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => go(it)}
                >
                  <span className={`pal-g g-${it.g}`}>{it.g}</span>
                  <span className="pal-t">
                    {it.t}
                    {it.d && <span className="pal-d">{it.d}</span>}
                  </span>
                </button>
              ))}
              {items && q.trim() && (
                <button type="button" className="pal-item pal-more" onClick={() => go({ h: `/law?q=${encodeURIComponent(q.trim())}` })}>
                  <span className="pal-g g-조문">전문</span>
                  <span className="pal-t">노무법전에서 &ldquo;{q.trim()}&rdquo; 전문 검색<span className="pal-d">조문 원문 내용까지 훑어서 찾습니다</span></span>
                </button>
              )}
            </div>

            <div className="pal-foot">
              <span><kbd>↑</kbd><kbd>↓</kbd> 이동</span>
              <span><kbd>Enter</kbd> 열기</span>
              <span><kbd>Esc</kbd> 닫기</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
