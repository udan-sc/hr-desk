'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import CopyButton from '../copy-button';
import { useHeadcount } from '../headcount-context';
import { SITE_URL } from '../../lib/site';

const QUERY_MAX = 100;
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ');

/* 주소에 검색어·분야·근거 조문을 남겨 두면 그대로 팀에 공유할 수 있다(새로 고쳐도 유지).
   사용자가 거름을 바꾸면 #질문 번호는 지운다 — 남겨 두면 새로 고칠 때 그 질문을 찾느라 거름이 풀린다 */
function syncUrl({ q, c, prov }) {
  const sp = new URLSearchParams(window.location.search);
  const put = (k, v) => (v ? sp.set(k, v) : sp.delete(k));
  put('q', q);
  put('c', c);
  put('law', prov?.law);
  put('art', prov?.art);
  const qs = sp.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}

/* 상시 5명 미만 사업장에도 같은 답인가. 인원을 1~4명으로 넣어 두었으면 '우리 회사라면'으로 바꿔 강조한다 */
const U5_LABEL = { same: '5명 미만도 같음', partial: '5명 미만은 일부 다름', none: '5명 미만은 해당 없음' };
function Under5({ u }) {
  const { headcount, ready } = useHeadcount();
  if (!u || !U5_LABEL[u.status]) return null;
  const small = ready && headcount > 0 && headcount < 5;
  if (u.status === 'same' && !small) return null;
  return (
    <p className={`qa-u5 u5-${u.status}${small ? ' mine' : ''}`}>
      <b>{small ? `우리 회사(상시 ${headcount}명)라면` : U5_LABEL[u.status]}</b>
      {small && u.status === 'same' ? u.note || '같은 답입니다 — 5명 미만 사업장에도 이 답이 그대로 해당합니다.' : u.note}
    </p>
  );
}

const U5_COPY = { same: '5명 미만 사업장도 같음', partial: '5명 미만 사업장은 일부 다름', none: '5명 미만 사업장은 해당 없음' };

function Item({ x, open }) {
  return (
    <details className="qa" id={x.id} open={open || undefined}>
      <summary>
        <span className="qa-q">
          <span className="qa-mk" aria-hidden="true">Q</span>
          {x.question}
        </span>
        <span className="qa-short">{x.short}</span>
      </summary>
      <div className="qa-body">
        <p className="qa-ans">{x.answer}</p>
        <Under5 u={x.under5} />
        {x.caveat && (
          <p className="qa-cav">
            <b>주의</b>
            {x.caveat}
          </p>
        )}
        <dl className="qa-refs">
          {x.provisions.length > 0 && (
            <>
              <dt>근거 조문</dt>
              <dd>
                {x.provisions.map((p) => (
                  <Link key={p.href} className="tag" href={p.href} title={p.title}>
                    {p.label}
                  </Link>
                ))}
              </dd>
            </>
          )}
          {x.precedents.length > 0 && (
            <>
              <dt>판례</dt>
              <dd>
                {x.precedents.map((p) => (
                  <Link key={p.href} className="tag" href={p.href} title={p.note}>
                    {p.label}
                  </Link>
                ))}
              </dd>
            </>
          )}
          {x.interpretations.length > 0 && (
            <>
              <dt>행정해석</dt>
              <dd>
                {x.interpretations.map((it) =>
                  it.url?.startsWith('http') ? (
                    <a key={it.label} className="tag" href={it.url} target="_blank" rel="noopener noreferrer">
                      {it.label}
                      {it.date && ` (${it.date})`}
                      <span className="vh"> (새 창)</span> ↗
                    </a>
                  ) : (
                    <Link key={it.label} className="tag" href={it.url || '#'}>
                      {it.label}
                      {it.date && ` (${it.date})`}
                    </Link>
                  )
                )}
              </dd>
            </>
          )}
          {x.tools.length > 0 && (
            <>
              <dt>바로 하기</dt>
              <dd>
                {x.tools.map((t) =>
                  /* 같은 화면의 다른 질문은 #만 바꾸는 보통 링크로 — 그래야 hashchange가 나서 그 질문이 펼쳐진다
                     (next/link는 해시만 다른 이동에서 hashchange를 내지 않음) */
                  t.href.startsWith('/qa#') ? (
                    <a key={t.href} className="tag tag-calc" href={t.href.slice(3)}>
                      {t.label} →
                    </a>
                  ) : (
                    <Link key={t.href} className="tag tag-calc" href={t.href}>
                      {t.label} →
                    </Link>
                  )
                )}
              </dd>
            </>
          )}
          {(x.terms.length > 0 || x.calc) && (
            <>
              <dt>함께 보기</dt>
              <dd>
                {x.calc && (
                  <Link className="tag tag-calc" href={x.calc.href}>
                    {x.calc.label} →
                  </Link>
                )}
                {x.terms.map((t) => (
                  <Link key={t.href} className="tag" href={t.href}>
                    용어: {t.label}
                  </Link>
                ))}
              </dd>
            </>
          )}
        </dl>
        <div className="qa-foot">
          <CopyButton text={`${SITE_URL}/qa/#${x.id}`} label="이 질문 링크 복사" className="sm" />
          <CopyButton
            text={[`Q. ${x.question}`, `A. ${x.short}`, x.answer, x.caveat ? `※ ${x.caveat}` : '', x.under5 && x.under5.status !== 'same' && x.under5.note ? `※ ${U5_COPY[x.under5.status]}: ${x.under5.note}` : '', x.provisions.length ? `근거: ${x.provisions.map((p) => p.label).join(', ')}` : '']
              .filter(Boolean)
              .join('\n')}
            label="답변 복사"
            className="sm"
          />
        </div>
      </div>
    </details>
  );
}

/* 주소의 #은 깨진 % 문자가 들어올 수 있다 — 풀지 못하면 그대로 쓴다 */
const readHash = () => {
  const h = window.location.hash.slice(1);
  try {
    return decodeURIComponent(h);
  } catch {
    return h;
  }
};

export default function QaClient({ items, categories }) {
  /* 정적 HTML에 100문항이 모두 실리도록 첫 화면은 필터 없이 그리고, 주소의 ?q=·?c=는 마운트 뒤에 반영한다 */
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [prov, setProv] = useState(null);
  const [hash, setHash] = useState('');
  const handled = useRef('');

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setQ((sp.get('q') || '').slice(0, QUERY_MAX));
    if (categories.includes(sp.get('c'))) setCat(sp.get('c'));
    /* 조문 화면의 '이 조문 질문 모두 보기'(?law=&art=) — 그 조문을 근거로 든 질문만 정확히 거른다 */
    if (sp.get('law') && sp.get('art')) setProv({ law: sp.get('law').slice(0, 40), art: sp.get('art').slice(0, 40) });
    const read = () => {
      handled.current = '';
      setHash(readHash());
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [categories]);

  const terms = useMemo(() => norm(q).split(' ').filter(Boolean).slice(0, 10), [q]);
  const shown = useMemo(
    () =>
      items.filter((x) => {
        if (cat && x.category !== cat) return false;
        if (prov && !x.provisions.some((p) => p.law === prov.law && p.article === prov.art)) return false;
        if (!terms.length) return true;
        const hay = norm([x.question, x.short, x.answer, x.caveat, x.category, ...x.provisions.map((p) => `${p.label} ${p.title}`), ...x.terms.map((t) => t.label)].join(' '));
        return terms.every((t) => hay.includes(t));
      }),
    [items, cat, terms, prov]
  );
  /* 다른 화면·통합 검색에서 /qa#qa-012로 오면 그 질문을 펼친다. 검색어·분야로 걸러져 안 보이면 거름을 풀고 연다 */
  useEffect(() => {
    if (!hash || handled.current === hash || !items.some((x) => x.id === hash)) return;
    if (!shown.some((x) => x.id === hash)) {
      setQ('');
      setCat('');
      setProv(null);
      window.history.replaceState(null, '', `${window.location.pathname}#${encodeURIComponent(hash)}`);
      return;
    }
    const el = document.getElementById(hash);
    if (el) {
      handled.current = hash;
      el.open = true;
      el.scrollIntoView({ block: 'start' });
    }
  }, [hash, shown, items]);

  const groups = categories.map((c) => ({ c, list: shown.filter((x) => x.category === c) })).filter((g) => g.list.length);

  const update = (nq, nc, np = prov) => {
    setQ(nq);
    setCat(nc);
    setProv(np);
    handled.current = '';
    setHash('');
    syncUrl({ q: nq, c: nc, prov: np });
  };

  /* 인쇄할 때는 보이는 질문을 모두 펼쳐 답·근거까지 종이에 담고, 끝나면 원래대로 */
  useEffect(() => {
    let opened = [];
    const before = () => {
      opened = [...document.querySelectorAll('details.qa:not([open])')];
      opened.forEach((d) => (d.open = true));
    };
    const after = () => {
      opened.forEach((d) => (d.open = false));
      opened = [];
    };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  return (
    <>
      <div className="qa-tools">
        <div className="searchbar qa-search" role="search">
          <svg className="ic" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.3" y2="16.3" />
          </svg>
          <input
            type="search"
            value={q}
            maxLength={QUERY_MAX}
            placeholder="질문 검색 — 예: 수습 연차, 퇴직금 대상, 권고사직"
            aria-label="실무 Q&A 검색"
            onChange={(e) => update(e.target.value.slice(0, QUERY_MAX), cat)}
          />
        </div>
        {prov && (
          <p className="qa-prov">
            근거 조문: <b>{prov.law} {prov.art}</b>
            <button type="button" className="hc-clear" onClick={() => update(q, cat, null)}>
              조문 거름 해제
            </button>
          </p>
        )}
        <div className="chips" role="group" aria-label="분야">
          <button type="button" className={`chip${!cat ? ' on' : ''}`} aria-pressed={!cat} onClick={() => update(q, '')}>
            전체 {items.length}
          </button>
          {categories.map((c) => (
            <button key={c} type="button" className={`chip${cat === c ? ' on' : ''}`} aria-pressed={cat === c} onClick={() => update(q, cat === c ? '' : c)}>
              {c} {items.filter((x) => x.category === c).length}
            </button>
          ))}
        </div>
      </div>

      <p className="qa-cnt" role="status" aria-live="polite">
        {terms.length || cat || prov ? (
          <>
            <b>{shown.length}</b>개 질문
            {shown.length === 0 && ' — 다른 낱말로 찾거나 노무법전 전문 검색을 이용해 보세요.'}
          </>
        ) : (
          '질문을 누르면 답과 근거가 펼쳐집니다.'
        )}
        {shown.length === 0 && (
          <>
            {' '}
            <Link href={`/law?q=${encodeURIComponent(q)}`}>노무법전에서 “{q}” 찾기 →</Link>
          </>
        )}
      </p>

      {groups.map((g) => (
        <section key={g.c} className="qa-group" aria-labelledby={`qg-${g.c}`}>
          <h2 id={`qg-${g.c}`}>
            {g.c} <span className="qa-gn">{g.list.length}</span>
          </h2>
          <div className="qa-list">
            {g.list.map((x) => (
              <Item key={x.id} x={x} open={hash === x.id || (terms.length > 0 && shown.length <= 3)} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
