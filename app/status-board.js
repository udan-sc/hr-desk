'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useHeadcount } from './headcount-context';
import { applies, TIERS } from '../lib/headcount';

/* 홈 상단 현황판 — 인원수 기준으로 적용 조문·의무·서류를 숫자로 보여준다.
   서버에서는 인원 0(미설정)으로 전체 건수를 그려 두고, 저장된 인원이 읽히면 숫자만 바뀐다 —
   마운트 뒤에 통째로 끼어들면 아래 내용이 밀려 화면이 튄다. */
export default function StatusBoard({ provisions, obligations, docs, changeDates }) {
  const { headcount, ready } = useHeadcount();
  const [upcoming, setUpcoming] = useState(null);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setUpcoming(changeDates.filter((d) => new Date(d + 'T00:00:00') > today).length);
  }, [changeDates]);

  const hc = headcount || 0;
  const provOn = provisions.filter((t) => applies(hc, t)).length;
  const obOn = obligations.filter((t) => applies(hc, t)).length;
  const mustDocs = docs.filter((d) => d.must);
  const docOn = mustDocs.filter((d) => applies(hc, d.t)).length;
  /* 다음 문턱은 실제로 무언가 새로 생기는 구간만 고른다 (예: 1000명 구간은 비어 있다) */
  const countAt = (t) =>
    provisions.filter((x) => x === t).length + obligations.filter((x) => x === t).length + docs.filter((d) => d.t === t).length;
  const nt = hc ? TIERS.find((t) => t > hc && countAt(t) > 0) || null : null;
  const nextNew = nt ? countAt(nt) : 0;

  return (
    <section className="board" aria-label="우리 회사 적용 현황" aria-busy={!ready || undefined}>
      <div className="bd-h">
        {hc ? `상시 ${hc}명 기준 — 우리 회사에 적용되는 것` : '적용 현황 — 위에 인원을 넣으면 우리 회사 기준 숫자로 바뀝니다'}
      </div>
      <div className="bd-grid">
        <Link className="bd" href="/law">
          <span className="bd-n">{provOn}<small>/{provisions.length}</small></span>
          <span className="bd-l">적용 조문</span>
        </Link>
        <Link className="bd" href="/calendar">
          <span className="bd-n">{obOn}<small>/{obligations.length}</small></span>
          <span className="bd-l">챙길 법정 의무</span>
        </Link>
        <Link className="bd" href="/docs">
          <span className="bd-n">{docOn}<small>/{mustDocs.length}</small></span>
          <span className="bd-l">갖출 법정 서류</span>
        </Link>
        <Link className="bd" href="/changes">
          <span className="bd-n">{upcoming === null ? '–' : upcoming}<small>건</small></span>
          <span className="bd-l">시행 예정 개정</span>
        </Link>
      </div>
      <p className="bd-note">
        {hc > 0 && nt && nextNew > 0 ? (
          <>
            {nt - hc}명 더 늘어 상시 {nt}명이 되면 새로 적용되는 조문·의무·서류 <b>{nextNew}개</b> ·{' '}
          </>
        ) : null}
        <Link href="/thresholds">규모별 문턱 지도 →</Link>
      </p>
    </section>
  );
}
