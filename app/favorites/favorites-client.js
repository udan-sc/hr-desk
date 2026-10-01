'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import CopyButton from '../copy-button';
import { ScopeBadge } from '../scope-badges';

const FAV_KEY = 'nomu-favs';

const readFavs = () => {
  try {
    const v = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    return Array.isArray(v) ? [...new Set(v.filter((k) => typeof k === 'string'))] : [];
  } catch {
    return [];
  }
};
const writeFavs = (arr) => {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(arr));
  } catch {
    /* 저장이 막혀도 화면은 그대로 */
  }
};

/* 즐겨찾기 모아보기. 주소에 ?k= 가 있으면 남이 공유한 목록을 보는 모드가 된다.
   ?k= 는 라우터의 search params로 구독한다 — 같은 경로 안에서 파라미터만 바뀌는 이동에서는
   컴포넌트가 다시 마운트되지 않아 window.location을 한 번 읽는 방식으로는 상태가 남는다. */
export default function FavoritesClient({ items }) {
  const [favs, setFavs] = useState(null);
  const k = useSearchParams().get('k');
  const byKey = useMemo(() => new Map(items.map((it) => [it.key, it])), [items]);
  const bySid = useMemo(() => new Map(items.filter((it) => it.sid).map((it) => [it.sid, it])), [items]);

  useEffect(() => {
    setFavs(readFavs());
  }, []);

  /* 짧은 ID와 예전 긴 키(법령|조문)를 모두 받아들여 이미 보낸 링크도 깨지지 않게 한다 */
  const shared = useMemo(() => {
    if (!k) return null;
    const keys = k
      .split(',')
      .map((s) => s.trim())
      .map((s) => (bySid.has(s) ? bySid.get(s).key : byKey.has(s) ? s : null))
      .filter(Boolean);
    return [...new Set(keys)];
  }, [k, byKey, bySid]);

  if (favs === null) {
    return <p className="fav-loading" aria-busy="true">불러오는 중…</p>;
  }

  const keys = shared || favs;
  const list = keys.map((key) => byKey.get(key)).filter(Boolean);
  const favSet = new Set(favs);
  const groups = [];
  list.forEach((it) => {
    let g = groups.find((x) => x.cat === it.category);
    if (!g) groups.push((g = { cat: it.category, items: [] }));
    g.items.push(it);
  });

  const shareUrl = () => {
    const ids = list.map((it) => it.sid || it.key);
    return `${window.location.origin}${window.location.pathname}?k=${encodeURIComponent(ids.join(','))}`;
  };
  const toggle = (key) => {
    const next = favSet.has(key) ? favs.filter((x) => x !== key) : [...favs, key];
    setFavs(next);
    writeFavs(next);
  };
  const addAll = () => {
    const next = [...favs];
    keys.forEach((key) => {
      if (!next.includes(key)) next.push(key);
    });
    setFavs(next);
    writeFavs(next);
  };
  const missing = shared ? shared.filter((key) => !favSet.has(key)).length : 0;

  return (
    <>
      <p className="fav-sub">
        {shared ? (
          <>
            <b>공유받은 조문 {list.length}개</b> — 동료가 보낸 목록입니다. 내 즐겨찾기에 담아 두면 노무법전에서도 별표로 표시됩니다.
          </>
        ) : (
          <>
            <b>내 즐겨찾기 {list.length}개</b> — 이 브라우저에 저장된 목록입니다.
          </>
        )}
      </p>

      {list.length > 0 && (
        <div className="fav-actions">
          <CopyButton getText={shareUrl} label="이 목록 공유 링크 복사" copiedLabel="링크 복사됨" />
          {shared && missing > 0 && (
            <button type="button" className="copybtn" onClick={addAll}>
              <span className="ci" aria-hidden="true">★</span> 내 즐겨찾기에 {missing}개 추가
            </button>
          )}
          {shared && (
            <Link className="fav-mine" href="/favorites">
              내 즐겨찾기 보기 →
            </Link>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <div className="empty">
          <h2>{shared ? '공유 링크에 담긴 조문이 없습니다' : '아직 즐겨찾기가 없습니다'}</h2>
          <p>
            {shared ? (
              <>
                링크가 잘렸거나 오래된 형식일 수 있습니다. <Link href="/favorites">내 즐겨찾기 보기 →</Link>
              </>
            ) : (
              <>
                <Link href="/law">노무법전</Link>에서 조문 오른쪽의 ☆를 누르면 여기에 모입니다.
              </>
            )}
          </p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.cat} className="fav-group">
            <h2>{g.cat}</h2>
            <div className="plist">
              {g.items.map((p) => (
                <article key={p.key} className="prov">
                  <div className="head">
                    <div>
                      <div className="law">「{p.law}」</div>
                      <h3>
                        <Link href={p.href}>
                          {p.article}({p.title})
                        </Link>
                      </h3>
                      {p.summary && <p className="sum">{p.summary}</p>}
                    </div>
                    <button
                      type="button"
                      className={`fav${favSet.has(p.key) ? ' on' : ''}`}
                      aria-pressed={favSet.has(p.key)}
                      aria-label={`${p.law} ${p.article} 즐겨찾기`}
                      onClick={() => toggle(p.key)}
                    >
                      {favSet.has(p.key) ? '★' : '☆'}
                    </button>
                  </div>
                  <div className="foot">
                    <ScopeBadge threshold={p.threshold} />
                    <span className="spacer" />
                    <Link className="law-link" href={p.href}>조문 자세히 →</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
