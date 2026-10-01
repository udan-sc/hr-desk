'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useHeadcount } from './headcount-context';
import HeadcountBar from './headcount-bar';
import { applies, thresholdLabel } from '../lib/headcount';
import { asset } from '../lib/site';

const CHIP_WORDS = ['연차', '주휴수당', '퇴직금', '해고', '최저임금', '야근', '육아휴직', '괴롭힘', '실업급여', '계약직', '알바', '산재', '노란봉투법'];
const FAV_KEY = 'nomu-favs';
const LAWS_SHOWN = 8;
const EMPTY_SET = new Set();

const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '');

/* 위반 벌칙 분류 — lib/data.js의 penaltyKind와 같은 이름을 쓴다 */
const PENALTY_KINDS = [
  { key: '형사처벌', label: '형사처벌 (징역·벌금)' },
  { key: '과태료', label: '과태료' },
  { key: '없음', label: '벌칙 없음' },
];

/* 검색어 목록 — 중복을 빼고 10개까지만. 긴 ?q= 링크 하나로 탭이 멈추지 않게 한다. */
const MAX_TERMS = 10;
const QUERY_MAX = 200;
const splitTerms = (query) => [...new Set((query || '').trim().toLowerCase().split(/\s+/).filter(Boolean))].slice(0, MAX_TERMS);

/* 검색어 하이라이트 — 일치하는 부분을 <mark>로 감싼다.
   score()는 공백을 지우고 비교하므로 여기서도 글자 사이 공백을 허용해 '연차수당'이 '연차 수당'에 걸리게 하고,
   긴 검색어를 먼저 맞춰 '근로 근로기준'에서 '근로'만 칠해지는 일을 막는다. */
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function hl(text, query) {
  const terms = splitTerms(query).sort((a, b) => b.length - a.length);
  if (!terms.length || !text) return text;
  const re = new RegExp(`(${terms.map((t) => [...t].map(escapeRe).join('\\s*')).join('|')})`, 'gi');
  const parts = String(text).split(re);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : part));
}

/* 검색 점수. 모든 검색어가 걸려야 결과에 남는다(AND).
   body는 조문 전문이며, 전문 색인을 아직 받지 못했으면 미리보기로 대신한다. */
function score(p, body, query) {
  if (!query) return 1;
  const terms = splitTerms(query);
  let total = 0;
  for (const t of terms) {
    const tn = norm(t);
    let s = 0;
    if (norm(p.title).includes(tn)) s += 8;
    if ((p.keywords || []).some((k) => norm(k).includes(tn) || tn.includes(norm(k)))) s += 6;
    if (norm(p.law + p.article).includes(tn)) s += 6;
    const m = tn.match(/^(\d+)조?(의(\d+))?$/);
    if (m && norm(p.article).includes('제' + m[1] + '조' + (m[3] ? '의' + m[3] : ''))) s += 7;
    if (norm(p.summary).includes(tn)) s += 3;
    if (norm(body).includes(tn)) s += 2;
    if (s === 0) return 0;
    total += s;
  }
  return total;
}

export default function BrowseClient({ provisions, categories, laws, cards, baseDate }) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState(null);
  const [law, setLaw] = useState(null);
  const [onlyFav, setOnlyFav] = useState(false);
  const [hideOutOfScope, setHideOutOfScope] = useState(false);
  const [pen, setPen] = useState(null);
  const { headcount } = useHeadcount();
  const [sort, setSort] = useState('rel');
  const [favs, setFavs] = useState(() => new Set());
  const [expanded, setExpanded] = useState(() => new Set());
  const [pending, setPending] = useState(() => new Set());
  const [indexError, setIndexError] = useState(false);
  const [showAllLaws, setShowAllLaws] = useState(false);
  const [fullText, setFullText] = useState(null);
  const loading = useRef(null);
  const inputRef = useRef(null);

  /* 조문 전문 색인은 전문 검색이나 펼치기가 처음 필요해질 때 한 번만 받는다. */
  const loadFullText = useCallback(() => {
    if (loading.current) return loading.current;
    loading.current = fetch(asset('/search-index.json'))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((rows) => {
        const map = new Map(rows);
        setFullText(map);
        setIndexError(false);
        return map;
      })
      .catch(() => {
        /* 색인을 못 받아도 미리보기 기준 검색은 계속 동작한다 */
        loading.current = null;
        setIndexError(true);
        return null;
      });
    return loading.current;
  }, []);

  /* 즐겨찾기와 ?q= 검색어는 hydration 이후에 읽어야 서버 렌더 결과와 어긋나지 않는다. */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
      if (Array.isArray(saved) && saved.length) setFavs(new Set(saved));
    } catch {
      /* 저장소를 못 읽어도 즐겨찾기 없이 정상 동작한다 */
    }
    const q = (new URLSearchParams(window.location.search).get('q') || '').slice(0, QUERY_MAX);
    if (q) {
      setQuery(q);
      loadFullText();
    }
  }, [loadFullText]);

  const toggleFav = useCallback((key) => {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      } catch {
        /* 저장 실패는 무시 — 이번 세션에서는 그대로 동작한다 */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement;
      const tag = el?.tagName || '';
      if (e.key === '/' && !el?.isContentEditable && !/INPUT|SELECT|TEXTAREA/.test(tag)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && el === inputRef.current) setQuery('');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const setSearch = useCallback(
    (value) => {
      setQuery(value);
      if (value.trim()) loadFullText();
    },
    [loadFullText]
  );

  /* 검색어만 반영한 후보 목록. 사이드바 건수도 이 기준으로 세어
     0건으로 가는 필터를 누르게 하지 않는다. */
  const qRows = useMemo(() => {
    const q = query.trim();
    return provisions
      .map((p, i) => ({ p, i, s: score(p, fullText?.get(p.key) ?? p.preview, q) }))
      .filter((r) => r.s > 0);
  }, [provisions, query, fullText]);

  const favsForFilter = onlyFav ? favs : EMPTY_SET;
  const rows = useMemo(() => {
    let list = qRows;
    if (cat) list = list.filter((r) => r.p.category === cat);
    if (law) list = list.filter((r) => r.p.law === law);
    if (onlyFav) list = list.filter((r) => favsForFilter.has(r.p.key));
    if (pen) list = list.filter((r) => r.p.penaltyKind === pen);
    if (hideOutOfScope) list = list.filter((r) => applies(headcount, r.p.threshold));
    list = [...list];
    if (sort === 'law') {
      list.sort((a, b) =>
        a.p.law === b.p.law ? a.p.order - b.p.order : a.p.law.localeCompare(b.p.law, 'ko')
      );
    } else if (sort === 'cat') {
      list.sort((a, b) => a.i - b.i);
    } else {
      list.sort((a, b) => b.s - a.s || a.i - b.i);
    }
    return list;
  }, [qRows, cat, law, onlyFav, favsForFilter, pen, sort, hideOutOfScope, headcount]);

  /* 인원수가 설정되면 사이드바 숫자는 그 규모에서 실제로 적용되는 조문만 센다 —
     숨기기 토글과 무관하게. 다만 버튼 비활성화는 검색어 기준(qBy*)으로 판단해서,
     적용 조문이 0건인 분야·법령도 눌러서 미적용(회색) 조문을 훑어볼 수는 있게 한다. */
  const scopedRows = useMemo(
    () => (headcount ? qRows.filter((r) => applies(headcount, r.p.threshold)) : qRows),
    [qRows, headcount]
  );

  const counts = useMemo(() => {
    const byCat = {};
    const byLaw = {};
    const qByCat = {};
    const qByLaw = {};
    const byPen = {};
    const qByPen = {};
    scopedRows.forEach(({ p }) => {
      byCat[p.category] = (byCat[p.category] || 0) + 1;
      byLaw[p.law] = (byLaw[p.law] || 0) + 1;
      byPen[p.penaltyKind] = (byPen[p.penaltyKind] || 0) + 1;
    });
    qRows.forEach(({ p }) => {
      qByCat[p.category] = (qByCat[p.category] || 0) + 1;
      qByLaw[p.law] = (qByLaw[p.law] || 0) + 1;
      qByPen[p.penaltyKind] = (qByPen[p.penaltyKind] || 0) + 1;
    });
    return { byCat, byLaw, qByCat, qByLaw, byPen, qByPen };
  }, [qRows, scopedRows]);

  /* 목록 상단 안내용 — 숨기기를 끈 채 인원만 설정한 경우, 나열된 것 중 몇 건이 적용인지 */
  const appliedInRows = useMemo(
    () => (headcount ? rows.reduce((n, r) => n + (applies(headcount, r.p.threshold) ? 1 : 0), 0) : rows.length),
    [rows, headcount]
  );

  const visibleLaws = showAllLaws || law ? laws : laws.slice(0, LAWS_SHOWN);

  const onExpand = useCallback(
    async (p) => {
      if (expanded.has(p.key)) {
        setExpanded((prev) => {
          const next = new Set(prev);
          next.delete(p.key);
          return next;
        });
        return;
      }
      if (!fullText) {
        setPending((prev) => new Set(prev).add(p.key));
        const map = await loadFullText();
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(p.key);
          return next;
        });
        if (!map) return; /* 색인 실패 — 잘린 미리보기를 전문인 척 펼치지 않는다 */
      }
      setExpanded((prev) => new Set(prev).add(p.key));
    },
    [expanded, fullText, loadFullText]
  );

  return (
    <>
      <HeadcountBar hint="인원을 넣으면 우리 회사에 적용되는 조문만 가려 볼 수 있습니다." />

      <div className="searchbar">
        <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.3" y2="16.3" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="예: 연차 수당, 주휴, 해고 예고, 근로기준법 60조"
          aria-label="조문 검색"
          autoComplete="off"
          maxLength={QUERY_MAX}
        />
        <span className="kbd" aria-hidden="true">/</span>
      </div>

      <div className="chips">
        <span className="lbl">자주 찾는 주제</span>
        {CHIP_WORDS.map((w) => (
          <button
            key={w}
            type="button"
            className={`chip${query === w ? ' on' : ''}`}
            aria-pressed={query === w}
            onClick={() => setSearch(query === w ? '' : w)}
          >
            {w}
          </button>
        ))}
      </div>

      <div className="cols">
        <aside className="side" aria-label="조문 필터">
          <section>
            <div className="side-h">사업장 규모</div>
            <button
              type="button"
              className="tgl-row"
              aria-pressed={hideOutOfScope}
              disabled={!headcount}
              onClick={() => setHideOutOfScope((v) => !v)}
            >
              <span className="tgl" aria-hidden="true" />
              <span className="t">적용 안 되는 조문 숨기기</span>
            </button>
            <p className="tgl-note">
              {headcount
                ? `상시 ${headcount}명 기준 — 아래 분야·법령 숫자는 적용되는 조문만 셉니다. 켜면 적용되지 않는 조문을 목록에서도 뺍니다.`
                : '위에서 상시 근로자 수를 넣으면 적용 여부를 표시합니다.'}
            </p>
          </section>

          <section>
            <div className="side-h">분야</div>
            <div className="nav">
              <button type="button" className={cat ? '' : 'on'} aria-current={cat ? undefined : 'true'} onClick={() => setCat(null)}>
                <span>전체 분야</span>
                <span className="n">{scopedRows.length}</span>
              </button>
              {categories.map((c) => {
                const n = counts.byCat[c.name] || 0;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    className={cat === c.name ? 'on' : ''}
                    aria-current={cat === c.name ? 'true' : undefined}
                    disabled={(counts.qByCat[c.name] || 0) === 0 && cat !== c.name}
                    onClick={() => setCat((cur) => (cur === c.name ? null : c.name))}
                  >
                    <span>{c.name}</span>
                    <span className="n">{n}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="side-h">법령</div>
            <div className="nav">
              {visibleLaws.map((l) => {
                const n = counts.byLaw[l.name] || 0;
                return (
                  <button
                    key={l.name}
                    type="button"
                    className={law === l.name ? 'on' : ''}
                    aria-pressed={law === l.name}
                    disabled={(counts.qByLaw[l.name] || 0) === 0 && law !== l.name}
                    onClick={() => setLaw((cur) => (cur === l.name ? null : l.name))}
                  >
                    <span>{l.name}</span>
                    <span className="n">{n}</span>
                  </button>
                );
              })}
              {laws.length > LAWS_SHOWN && !law && (
                <button type="button" className="more-laws" aria-expanded={showAllLaws} onClick={() => setShowAllLaws((v) => !v)}>
                  {showAllLaws ? '접기 ▲' : `법령 ${laws.length - LAWS_SHOWN}개 더 보기 ▼`}
                </button>
              )}
            </div>
          </section>

          <section>
            <div className="side-h">위반 벌칙</div>
            <div className="nav">
              {PENALTY_KINDS.map((k) => {
                const n = counts.byPen[k.key] || 0;
                return (
                  <button
                    key={k.key}
                    type="button"
                    className={pen === k.key ? 'on' : ''}
                    aria-pressed={pen === k.key}
                    disabled={(counts.qByPen[k.key] || 0) === 0 && pen !== k.key}
                    onClick={() => setPen((cur) => (cur === k.key ? null : k.key))}
                  >
                    <span>{k.label}</span>
                    <span className="n">{n}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <div className="side-h">즐겨찾기</div>
            <div className="nav">
              <button type="button" className={onlyFav ? 'on' : ''} aria-pressed={onlyFav} onClick={() => setOnlyFav((v) => !v)}>
                <span><span className="star" aria-hidden="true">★</span> 즐겨찾기만 보기</span>
                <span className="n">{favs.size}</span>
              </button>
              <Link className="more-laws" href="/favorites">
                모아보기 · 팀에 공유 →
              </Link>
            </div>
          </section>
        </aside>

        <div>
          <section style={{ marginBottom: 40 }}>
            <div className="sec-head">
              <h2>한눈에 보는 기준</h2>
              <span className="note">{baseDate} 기준 · 누르면 근거 조문으로 이동</span>
            </div>
            <div className="cards">
              {cards.map((c) => (
                <Link key={c.k} className="card" href={c.href}>
                  <span className="k">{c.k}</span>
                  <span className="v">
                    {c.v}
                    <small>{c.u}</small>
                  </span>
                  <span className="sub">{c.sub}</span>
                  <span className="ref">{c.law} {c.article}</span>
                </Link>
              ))}
            </div>
          </section>

          <div className="list-head">
            <span className="cnt" role="status" aria-live="polite" aria-atomic="true">
              수록 조문 <b>{rows.length}</b>건
              {headcount && !hideOutOfScope && appliedInRows !== rows.length ? (
                <span style={{ color: 'var(--ink3)', fontWeight: 400, fontSize: '12.5px' }}> · 상시 {headcount}명에 적용 {appliedInRows}건</span>
              ) : rows.length !== provisions.length ? (
                <span style={{ color: 'var(--ink3)', fontWeight: 400, fontSize: '12.5px' }}> / 전체 {provisions.length}건</span>
              ) : null}
            </span>
            <span className="right">
              <label htmlFor="sort" style={{ fontSize: '12.5px', color: 'var(--ink2)' }}>정렬</label>
              <select id="sort" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="rel">관련도순</option>
                <option value="law">법령순</option>
                <option value="cat">분야순</option>
              </select>
            </span>
          </div>

          {indexError && (
            <p className="idx-err" role="alert" style={{ marginBottom: 10 }}>
              조문 전문 색인을 불러오지 못했습니다. 지금은 제목·요약·키워드 기준으로만 검색되며, 전문은 각 조문의 상세 페이지에서 볼 수 있습니다.
            </p>
          )}

          {rows.length === 0 ? (
            <div className="empty">
              <h2>검색 결과가 없습니다</h2>
              <p>다른 키워드로 검색하거나 왼쪽 분야·법령 필터를 해제해 보세요.</p>
            </div>
          ) : (
            <div className="plist">
              {rows.map(({ p }) => {
                const open = expanded.has(p.key);
                const busy = pending.has(p.key);
                const isFav = favs.has(p.key);
                const bodyId = `body-${p.key.replace(/[^0-9A-Za-z가-힣]/g, '-')}`;
                const inScope = applies(headcount, p.threshold);
                const body = open ? fullText?.get(p.key) ?? p.preview : p.preview;
                return (
                  <article key={p.key} className={`prov${inScope ? '' : ' out-of-scope'}`}>
                    <div className="head">
                      <div>
                        <div className="law">
                          「{p.law}」 <span className="cat">· {p.category}</span>
                        </div>
                        <h3>
                          <Link href={p.href}>
                            {p.article}({hl(p.title, query)})
                          </Link>
                        </h3>
                        {p.summary && <p className="sum">{hl(p.summary, query)}</p>}
                      </div>
                      <button
                        type="button"
                        className={`fav${isFav ? ' on' : ''}`}
                        onClick={() => toggleFav(p.key)}
                        aria-pressed={isFav}
                        aria-label={`${p.law} ${p.article} 즐겨찾기`}
                      >
                        {isFav ? '★' : '☆'}
                      </button>
                    </div>

                    <p className={`body${p.hasMore && !open ? ' clamp' : ''}`} id={bodyId}>{hl(body, query)}</p>
                    {p.hasMore && (
                      <button
                        type="button"
                        className="more"
                        aria-expanded={open}
                        aria-controls={bodyId}
                        aria-busy={busy || undefined}
                        onClick={() => onExpand(p)}
                      >
                        {busy ? '불러오는 중…' : open ? '접기' : '전체 조문 펼치기'}
                      </button>
                    )}
                    <div className="foot">
                      <span className={`badge scope${headcount ? (inScope ? ' on' : ' off') : ''}`}>
                        {thresholdLabel(p.threshold)}
                        {headcount ? (inScope ? ' · 적용' : ' · 미적용') : ''}
                      </span>
                      {p.penalty && <span className="badge pen">위반 시 {p.penalty}</span>}
                      <span className="spacer" />
                      <Link className="law-link" href={p.href}>조문 자세히 →</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
