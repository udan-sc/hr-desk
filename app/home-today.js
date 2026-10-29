'use client';

import { useEffect, useState } from 'react';

const DAYS = '일월화수목금토';
const pad = (n) => String(n).padStart(2, '0');

/* 홈 맨 위의 오늘 날짜. 정적 빌드라 빌드한 날로 굳지 않게 보는 사람의 브라우저에서 계산한다.
   마운트 전에는 같은 너비의 빈 자리만 잡아 두어 옆 꼬리표가 밀리지 않게 한다. */
export default function HomeToday() {
  const [d, setD] = useState(null);
  useEffect(() => setD(new Date()), []);
  if (!d) {
    return (
      <span className="hd-date wait" aria-hidden="true">
        0000년 00월 00일(일)
      </span>
    );
  }
  const iso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return (
    <time className="hd-date" dateTime={iso}>
      {d.getFullYear()}년 {d.getMonth() + 1}월 {d.getDate()}일({DAYS[d.getDay()]})
    </time>
  );
}
