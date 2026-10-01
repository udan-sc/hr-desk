'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import CopyButton from '../copy-button';
import { asset } from '../../lib/site';

const QUERY_MAX = 100;
const PERIODS = [
  { key: 'all', label: '전체' },
  { key: '5', label: '최근 5년' },
  { key: '10', label: '최근 10년' },
];
const LEVELS = [
  { key: 'all', label: '전체' },
  { key: '대법원', label: '대법원' },
  { key: 'lower', label: '하급심' },
];

const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, '');
const fmt = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${y}. ${Number(m)}. ${Number(d)}.`;
};

/* 판례 검색. 판결요지 전문은 처음 펼칠 때 한 번만 받아온다(목록 HTML을 가볍게 유지). */
export default function CasesClient({ items, categories }) {
  const router = useRouter();
  const sp = useSearchParams();
  const urlQ = (sp.get('q') || '').slice(0, QUERY_MAX);
  const [q, setQ] = useState(urlQ);
  const [cat, setCat] = useState(null);
  const [level, setLevel] = useState('all');
  const [period, setPeriod] = useState('all');
  const [enOnly, setEnOnly] = useState(false);
  const [sort, setSort] = useState('new');
  const [open, setOpen] = useState(() => new Set());
  /* 펼친 판례의 판결요지·참조조문 — 사건번호마다 따로 받아 둔다. 실패한 것은 'error' */
  const [full, setFull] = useState(() => ({}));
  const requested = useRef(new Set());
  const [thisYear, setThisYear] = useState(null);
  const seqOf = useMemo(() => new Map(items.map((p) => [p.caseNo, p.precSeq])), [items]);

  const loadOne = useCallback(
    (no) => {
      if (requested.current.has(no)) return;
      requested.current.add(no);
      fetch(asset(`/prec/${seqOf.get(no)}.json`))
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((v) => setFull((prev) => ({ ...prev, [no]: v })))
        .catch(() => {
          requested.current.delete(no); /* 다시 펼치면 재시도 */
          setFull((prev) => ({ ...prev, [no]: 'error' }));
        });
    },
    [seqOf]
  );

  /* 통합 검색(Ctrl+K)에서 ?q=사건번호로 넘어오면 그 판례를 바로 펼친다 */
  useEffect(() => {
    setQ(urlQ);
    const hit = items.find((p) => p.caseNo === urlQ.replace(/\s+/g, ''));
    if (hit) setOpen((prev) => new Set(prev).add(hit.caseNo));
  }, [urlQ, items]);

  useEffect(() => {
    setThisYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    open.forEach((no) => loadOne(no));
  }, [open, loadOne]);

  const toggle = (no) => {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(no) ? next.delete(no) : next.add(no);
      return next;
    });
  };

  const qRows = useMemo(() => {
    const terms = [...new Set(q.trim().toLowerCase().split(/\s+/).filter(Boolean))].slice(0, 8);
    if (!terms.length) return items;
    return items.filter((p) => {
      const hay = norm(`${p.caseNo} ${p.caseName} ${p.point} ${p.issues} ${p.category} ${p.provisions.map((x) => x.label).join(' ')}`);
      return terms.every((t) => hay.includes(norm(t)));
    });
  }, [items, q]);

  const rows = useMemo(() => {
    let list = qRows;
    if (cat) list = list.filter((p) => p.category === cat);
    if (level === '대법원') list = list.filter((p) => p.level === '대법원');
    if (level === 'lower') list = list.filter((p) => p.level !== '대법원');
    if (period !== 'all' && thisYear) list = list.filter((p) => Number(p.date.slice(0, 4)) > thisYear - Number(period));
    if (enOnly) list = list.filter((p) => p.kind.startsWith('전원합의체'));
    list = [...list].sort((a, b) => (sort === 'new' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
    return list;
  }, [qRows, cat, level, period, enOnly, sort, thisYear]);

  const catCounts = useMemo(() => {
    const m = {};
    qRows.forEach((p) => (m[p.category] = (m[p.category] || 0) + 1));
    return m;
  }, [qRows]);

  const onSearch = (v) => {
    const value = v.slice(0, QUERY_MAX);
    setQ(value);
    /* 주소에도 남겨 그대로 공유할 수 있게 한다 */
    const url = value.trim() ? `/cases?q=${encodeURIComponent(value.trim())}` : '/cases';
    router.replace(url, { scroll: false });
  };

  return (
    <>
      <div className="searchbar">
        <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.3" y2="16.3" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="예: 통상임금, 재직조건, 2020다247190, 연장근로 한도, 직장 내 괴롭힘"
          aria-label="판례 검색"
          autoComplete="off"
          maxLength={QUERY_MAX}
        />
      </div>

      <div className="cases-filters" role="group" aria-label="판례 거르기">
        <div className="cf-row">
          <span className="cf-l">분야</span>
          <button type="button" className={`chip${cat ? '' : ' on'}`} aria-pressed={!cat} onClick={() => setCat(null)}>
            전체 {qRows.length}
          </button>
          {categories
            .filter((c) => catCounts[c] || cat === c)
            .map((c) => (
              <button
                key={c}
                type="button"
                className={`chip${cat === c ? ' on' : ''}`}
                aria-pressed={cat === c}
                onClick={() => setCat((cur) => (cur === c ? null : c))}
              >
                {c} {catCounts[c] || 0}
              </button>
            ))}
        </div>
        <div className="cf-row">
          <span className="cf-l">법원</span>
          {LEVELS.map((l) => (
            <button key={l.key} type="button" className={`chip${level === l.key ? ' on' : ''}`} aria-pressed={level === l.key} onClick={() => setLevel(l.key)}>
              {l.label}
            </button>
          ))}
          <span className="cf-l cf-gap">기간</span>
          {PERIODS.map((p) => (
            <button key={p.key} type="button" className={`chip${period === p.key ? ' on' : ''}`} aria-pressed={period === p.key} onClick={() => setPeriod(p.key)}>
              {p.label}
            </button>
          ))}
          <button type="button" className={`chip${enOnly ? ' on' : ''}`} aria-pressed={enOnly} onClick={() => setEnOnly((v) => !v)}>
            전원합의체만
          </button>
          <span className="spacer" />
          <label htmlFor="case-sort" className="cf-l">정렬</label>
          <select id="case-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="new">최신순</option>
            <option value="old">오래된순</option>
          </select>
        </div>
      </div>

      <p className="cnt cases-cnt" role="status" aria-live="polite">
        판례 <b>{rows.length}</b>건{rows.length !== items.length ? ` / 전체 ${items.length}건` : ''}
      </p>

      {rows.length === 0 ? (
        <div className="empty">
          <h2>수록 판례 중에는 일치하는 것이 없습니다</h2>
          <p>
            다른 말로 찾아보거나,{' '}
            <a href={`https://www.law.go.kr/LSW/precSc.do?menuId=7&query=${encodeURIComponent(q.trim())}`} target="_blank" rel="noopener noreferrer">
              국가법령정보센터 전체 판례에서 &ldquo;{q.trim()}&rdquo; 찾기<span className="vh"> (새 창)</span> ↗
            </a>
          </p>
        </div>
      ) : (
        <div className="case-list">
          {rows.map((p) => {
            const isOpen = open.has(p.caseNo);
            const got = full[p.caseNo];
            const f = Array.isArray(got) ? got : null;
            const failed = got === 'error';
            return (
              <article key={p.caseNo} className="case" id={`c-${p.caseNo}`}>
                <div className="case-h">
                  <span className={`case-court${p.level === '대법원' ? ' sc' : ''}`}>{p.court}</span>
                  <span className="case-no">{p.caseNo}</span>
                  <span className="case-date">{fmt(p.date)} 선고</span>
                  {p.kind.startsWith('전원합의체') && <span className="prec-en">전원합의체</span>}
                  {p.auto && <span className="tl-auto">자동 추가</span>}
                  <span className="case-cat">{p.category}</span>
                </div>
                <h3 className="case-name">{p.caseName}</h3>
                {p.point && <p className="prec-point">{p.point}</p>}
                <button type="button" className="more" aria-expanded={isOpen} onClick={() => toggle(p.caseNo)}>
                  {isOpen ? '원문 접기' : `판시사항${p.hasSummary ? '·판결요지' : ''} 원문 펼치기`}
                </button>
                {isOpen && (
                  <div className="case-body">
                    {p.issues && (
                      <>
                        <h4>판시사항</h4>
                        <p className="prec-text">{p.issues}</p>
                      </>
                    )}
                    {p.hasSummary && (
                      <>
                        <h4>판결요지</h4>
                        <p className="prec-text" aria-busy={!f && !failed}>
                          {f ? f[0] : failed ? '불러오지 못했습니다. 아래 ‘판결 전문’으로 국가법령정보센터 원문을 확인하세요.' : '불러오는 중…'}
                        </p>
                      </>
                    )}
                    {f && f[1] && (
                      <>
                        <h4>참조조문</h4>
                        <p className="prec-text ref">{f[1]}</p>
                      </>
                    )}
                  </div>
                )}
                <div className="case-foot">
                  {p.provisions.map((x) => (
                    <Link key={x.href} className="tag" href={x.href}>
                      {x.label}
                    </Link>
                  ))}
                  <span className="spacer" />
                  <CopyButton text={p.title} label="인용 복사" className="sm" />
                  <a className="law-link" href={p.url} target="_blank" rel="noopener noreferrer">
                    판결 전문<span className="vh"> (국가법령정보센터, 새 창)</span> <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="cases-more">
        여기 없는 판례는{' '}
        <a href="https://www.law.go.kr/LSW/precSc.do?menuId=7" target="_blank" rel="noopener noreferrer">
          국가법령정보센터 판례 검색<span className="vh"> (새 창)</span> ↗
        </a>
        에서 찾을 수 있습니다.
      </p>
    </>
  );
}
