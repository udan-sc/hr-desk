'use client';

import { useMemo, useState } from 'react';

const KST = 9 * 3600 * 1000;
const dayKey = (ms) => new Date(ms + KST).toISOString().slice(0, 10);
const dayLabel = (key) => {
  const [y, m, d] = key.split('-');
  return `${y}. ${Number(m)}. ${Number(d)}.`;
};
const time = (ms) => {
  const d = new Date(ms + KST);
  const hh = d.getUTCHours();
  const mm = d.getUTCMinutes();
  return hh === 9 && mm === 0 ? '' : `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};
const stamp = (iso) => {
  const d = new Date(Date.parse(iso) + KST);
  return `${d.getUTCMonth() + 1}. ${d.getUTCDate()}. ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
const KINDS = [
  { key: 'all', label: '전체' },
  { key: 'official', label: '고용노동부' },
  { key: 'labor', label: '매일노동뉴스' },
  { key: 'press', label: '언론' },
];
const kindOf = (x) => (x.kind === 'official' ? 'official' : x.source === '매일노동뉴스' ? 'labor' : 'press');

/* 소식 전체 목록 — 출처·주제로 거르고 날짜별로 묶는다 */
export default function NewsList({ items, updatedAt, topicLabels }) {
  const [kind, setKind] = useState('all');
  const [topic, setTopic] = useState(null);

  const topicCounts = useMemo(() => {
    const m = {};
    items.forEach((x) => (x.topics || []).forEach((t) => (m[t] = (m[t] || 0) + 1)));
    return m;
  }, [items]);

  const rows = items.filter((x) => (kind === 'all' || kindOf(x) === kind) && (!topic || (x.topics || []).includes(topic)));
  const days = [...new Set(rows.map((x) => dayKey(x.ms)))].sort().reverse();

  return (
    <>
      <div className="cases-filters" role="group" aria-label="소식 거르기">
        <div className="cf-row">
          <span className="cf-l">출처</span>
          {KINDS.map((k) => (
            <button key={k.key} type="button" className={`chip${kind === k.key ? ' on' : ''}`} aria-pressed={kind === k.key} onClick={() => setKind(k.key)}>
              {k.label}
            </button>
          ))}
        </div>
        <div className="cf-row">
          <span className="cf-l">주제</span>
          <button type="button" className={`chip${topic ? '' : ' on'}`} aria-pressed={!topic} onClick={() => setTopic(null)}>
            전체
          </button>
          {Object.entries(topicLabels)
            .filter(([k]) => topicCounts[k])
            .map(([k, label]) => (
              <button key={k} type="button" className={`chip${topic === k ? ' on' : ''}`} aria-pressed={topic === k} onClick={() => setTopic((t) => (t === k ? null : k))}>
                {label} {topicCounts[k]}
              </button>
            ))}
        </div>
      </div>

      <p className="cnt cases-cnt" role="status" aria-live="polite">
        소식 <b>{rows.length}</b>건
        {updatedAt && <span className="news-upd"> · 마지막 갱신 {stamp(updatedAt)}</span>}
      </p>

      {days.map((d) => (
        <section key={d} className="news-day">
          <h2>{dayLabel(d)}</h2>
          <ul className="news-ul">
            {rows
              .filter((x) => dayKey(x.ms) === d)
              .map((x) => (
                <li key={x.url}>
                  <span className={`news-src k-${kindOf(x)}`}>{x.source}</span>
                  <a href={x.url} target="_blank" rel="noopener noreferrer">
                    {x.title}
                    <span className="vh"> (새 창)</span>
                  </a>
                  <span className="nb-meta">
                    {time(x.ms)}
                    {x.also > 0 && ` · 비슷한 기사 ${x.also}건 더`}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </>
  );
}
