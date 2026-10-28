'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const QUERY_MAX = 100;
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const HL = 'page-search';

/* 화면 안 목록 검색 — 서버에서 그린 목록은 그대로 두고, 검색어에 맞지 않는 항목·묶음에 data-qhide를 붙여 감춘다.
   item: 검색 단위(CSS 선택자), group: 남은 항목이 없으면 함께 감출 묶음(여럿이면 쉼표), scope: 찾을 범위.
   찾은 글자는 CSS Custom Highlight로 칠하고(문서를 고치지 않음), 접힌 설명 안에서 찾으면 그 설명을 펼친다.
   검색어는 주소(?q=)에 남아 새로 고쳐도 유지되고 그대로 공유된다. */
export default function PageSearch({ item, group = '', scope = 'main', placeholder = '이 화면에서 찾기', label = '이 화면에서 찾기', unit = '건' }) {
  const [q, setQ] = useState('');
  const [stat, setStat] = useState(null);
  const inputRef = useRef(null);
  const cache = useRef(new WeakMap());
  const opened = useRef([]);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('q');
    if (v) setQ(v.slice(0, QUERY_MAX));
  }, []);

  /* 입력 중이 아닐 때 '/'를 누르면 검색창으로 */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const apply = useCallback(() => {
    const root = document.querySelector(scope);
    if (!root) return;
    const terms = norm(q).split(' ').filter(Boolean).slice(0, 10);
    const items = [...root.querySelectorAll(item)];
    const textOf = (el) => {
      let t = cache.current.get(el);
      if (t === undefined) {
        t = norm(`${el.textContent} ${el.getAttribute('data-q') || ''}`);
        cache.current.set(el, t);
      }
      return t;
    };
    let shown = 0;
    for (const el of items) {
      const hit = !terms.length || terms.every((t) => textOf(el).includes(t));
      if (hit) {
        el.removeAttribute('data-qhide');
        shown++;
      } else el.setAttribute('data-qhide', '');
    }
    /* 묶음: 안에 항목이 있는데 모두 감춰졌으면 묶음도 감춘다. 따라다니는 목차의 그 묶음 링크도 함께 */
    if (group) {
      for (const g of root.querySelectorAll(group)) {
        const inner = [...g.querySelectorAll(item)];
        const empty = inner.length > 0 && inner.every((el) => el.hasAttribute('data-qhide'));
        if (empty) g.setAttribute('data-qhide', '');
        else g.removeAttribute('data-qhide');
        if (g.id) document.querySelectorAll(`.stoc a[href="#${CSS.escape(g.id)}"]`).forEach((a) => (empty ? a.setAttribute('data-qhide', '') : a.removeAttribute('data-qhide')));
      }
    }
    /* 접힌 설명: 지난번에 연 것은 닫고, 이번 검색어가 그 안에 있으면 연다 */
    opened.current.forEach((d) => (d.open = false));
    opened.current = [];
    if (terms.length) {
      for (const el of items) {
        if (el.hasAttribute('data-qhide')) continue;
        for (const d of el.querySelectorAll('details:not([open])')) {
          const t = norm(d.textContent);
          if (terms.some((x) => t.includes(x))) {
            d.open = true;
            opened.current.push(d);
          }
        }
      }
    }
    /* 찾은 글자 칠하기(지원하는 브라우저만) */
    if (typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined') {
      if (!terms.length) CSS.highlights.delete(HL);
      else {
        const ranges = [];
        for (const el of items) {
          if (el.hasAttribute('data-qhide') || ranges.length > 600) continue;
          const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let n = walker.nextNode(); n && ranges.length <= 600; n = walker.nextNode()) {
            const low = n.data.toLowerCase();
            for (const t of terms) {
              for (let i = low.indexOf(t); i >= 0; i = low.indexOf(t, i + t.length)) {
                const r = new Range();
                r.setStart(n, i);
                r.setEnd(n, i + t.length);
                ranges.push(r);
              }
            }
          }
        }
        CSS.highlights.set(HL, new Highlight(...ranges));
      }
    }
    setStat({ shown, total: items.length, active: terms.length > 0 });
  }, [q, item, group, scope]);

  /* 검색어가 바뀌면 다시 거르고, 목록이 나중에 그려지거나 바뀌어도(인원 설정·필터 등) 다시 거른다 */
  useEffect(() => {
    const t = setTimeout(apply, 60);
    const root = document.querySelector(scope);
    let mt;
    const mo = root
      ? new MutationObserver(() => {
          cache.current = new WeakMap();
          clearTimeout(mt);
          mt = setTimeout(apply, 120);
        })
      : null;
    mo?.observe(root, { childList: true, subtree: true, characterData: true });
    return () => {
      clearTimeout(t);
      clearTimeout(mt);
      mo?.disconnect();
    };
  }, [apply, scope]);

  /* 화면을 떠날 때 표시를 지운다 */
  useEffect(
    () => () => {
      document.querySelectorAll('[data-qhide]').forEach((el) => el.removeAttribute('data-qhide'));
      if (typeof CSS !== 'undefined' && CSS.highlights) CSS.highlights.delete(HL);
    },
    []
  );

  const update = (v) => {
    const next = v.slice(0, QUERY_MAX);
    setQ(next);
    const sp = new URLSearchParams(window.location.search);
    if (next.trim()) sp.set('q', next);
    else sp.delete('q');
    const qs = sp.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  };

  return (
    <div className="psearch" role="search">
      <div className="searchbar">
        <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.3" y2="16.3" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={q}
          maxLength={QUERY_MAX}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="off"
          onChange={(e) => update(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && update('')}
        />
        {!q && (
          <kbd className="kbd" aria-hidden="true">
            /
          </kbd>
        )}
      </div>
      <p className="psearch-cnt" role="status" aria-live="polite">
        {stat?.active ? (
          stat.shown ? (
            <>
              <span>
                <b>{stat.shown}</b>
                {unit} 찾음 <span className="psearch-of">(전체 {stat.total})</span>
              </span>
              <button type="button" className="psearch-clear" onClick={() => update('')}>
                지우기
              </button>
            </>
          ) : (
            <>
              ‘{q}’에 맞는 항목이 이 화면에 없습니다. 위쪽 <b>검색(Ctrl+K)</b>으로 사이트 전체에서 찾아보세요.
              <button type="button" className="psearch-clear" onClick={() => update('')}>
                지우기
              </button>
            </>
          )
        ) : null}
      </p>
    </div>
  );
}
