'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useHeadcount } from './headcount-context';
import { applies } from '../lib/headcount';
import CardHead from './home-card';
import Icon from './nav-icons';

/* 홈의 "이번 달 챙길 일"(시안 C 체크 목록). 정적 빌드라 현재 달은 클라이언트에서 정한다.
   마운트 전에는 카드 틀만 그려 서버 렌더와 어긋나지 않고, 아래 카드도 밀리지 않는다.
   체크 표시는 이 브라우저에만 이번 달 것만 저장한다(달이 바뀌면 저절로 비워짐). */
const DONE_KEY = 'nomu-month-done';

/* 주기별 묶음 — 자료의 cadence 값을 그대로 묶고 제목만 읽기 쉽게 */
const GROUPS = [
  { cadence: '연 1회', label: '연 1회' },
  { cadence: '반기 1회', label: '반기마다' },
  { cadence: '분기 1회', label: '분기마다' },
  { cadence: '매월', label: '매달' },
];

/* 업종·도입 여부처럼 인원만으로 정해지지 않는 의무(문턱 지도와 같은 기준) */
const isConditional = (t) => /업종|제조업|건설|여성|도입 사업장|해당 유해인자/.test(t || '');

const readDone = (ym) => {
  try {
    const v = JSON.parse(localStorage.getItem(DONE_KEY) || 'null');
    return v && v.ym === ym && Array.isArray(v.ids) ? v.ids : [];
  } catch {
    return [];
  }
};

export default function HomeMonth({ byMonth }) {
  const [ym, setYm] = useState(null);
  const [done, setDone] = useState([]);
  const { headcount } = useHeadcount();

  useEffect(() => {
    const d = new Date();
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setYm(key);
    setDone(readDone(key));
  }, []);

  const toggle = (id) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify({ ym, ids: next }));
    } catch {
      /* 시크릿 창 등에서 저장이 막혀도 이번 화면에서는 체크된다 */
    }
  };

  const month = ym ? Number(ym.slice(5)) : null;
  const all = month ? byMonth[month] || [] : [];
  const items = all.filter((o) => applies(headcount, o.thresholdMin));
  const skipped = all.length - items.length;
  const doneN = items.filter((o) => done.includes(o.id)).length;
  /* 자료에 없는 주기가 생겨도 빠뜨리지 않게 나머지는 맨 뒤에 묶는다 */
  const known = GROUPS.map((g) => g.cadence);
  const groups = [
    ...GROUPS.map((g) => ({ ...g, items: items.filter((o) => o.cadence === g.cadence) })),
    { cadence: 'etc', label: '그 밖에', items: items.filter((o) => !known.includes(o.cadence)) },
  ].filter((g) => g.items.length);

  const sub = month ? (
    <>
      법정 의무 캘린더 · <span className="mono">{items.length}</span>건
      {doneN > 0 && (
        <>
          {' '}· <span className="mono">{doneN}</span>건 체크
        </>
      )}
      {skipped > 0 && <> · 우리 규모에 해당 없는 {skipped}건 제외</>}
    </>
  ) : (
    '법정 의무 캘린더'
  );

  return (
    <section className="hd-card hd-month" aria-labelledby="h-month" aria-busy={!month || undefined}>
      <CardHead
        id="h-month"
        icon="calendar"
        title={month ? `${month}월에 챙길 일` : '이번 달 챙길 일'}
        sub={sub}
        moreHref="/calendar"
        more="캘린더 전체"
      />
      {!month ? (
        <div className="hd-wait" />
      ) : items.length === 0 ? (
        <p className="hd-empty">
          {headcount ? '이번 달에 우리 규모가 챙길 정기 의무는 없습니다.' : '이번 달로 시기가 정해진 정기 의무는 없습니다.'} 수시 의무는 캘린더에서 확인하세요.
        </p>
      ) : (
        <div className="hm-body">
          {groups.map((g) => (
            <div key={g.cadence} className="hm-group">
              <div className="hm-gh">
                <h3>{g.label}</h3>
                <span className="mono">{g.items.length}건</span>
              </div>
              <ul className="hm-list">
                {g.items.map((o) => {
                  const on = done.includes(o.id);
                  const cond = isConditional(o.threshold);
                  return (
                    <li key={o.id} className={`hm-item${on ? ' done' : ''}`}>
                      <input
                        type="checkbox"
                        className="hm-check"
                        checked={on}
                        onChange={() => toggle(o.id)}
                        aria-label={`${o.title} 챙김 표시`}
                      />
                      <div className="hm-main">
                        <Link className="hm-t" href={`/calendar#${o.id}`}>
                          {o.title}
                        </Link>
                        <span className="hm-line">
                          <Icon name="clock" size={14} stroke={1.9} />
                          <span>{o.timing}</span>
                        </span>
                        <span className="hm-line hm-who" title={o.threshold}>
                          <Icon name="users" size={14} stroke={1.9} />
                          <span>{o.threshold}</span>
                        </span>
                        {o.penalty && (
                          <span className="hm-line hm-pen">
                            <Icon name="warn" size={14} stroke={1.9} />
                            <span>미이행 시 {o.penalty}</span>
                          </span>
                        )}
                      </div>
                      {cond && (
                        <span className="hm-tags">
                          <span className="hm-tag warn">
                            <Icon name="warn" size={12} stroke={2.2} />
                            {/업종/.test(o.threshold) ? '업종 조건부' : '조건부'}
                          </span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
