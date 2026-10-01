'use client';

import { useHeadcount } from '../headcount-context';

/* 문턱 지도의 각 구간 옆에 우리 회사 위치를 표시한다 */
export default function TierStatus({ tier }) {
  const { headcount, ready } = useHeadcount();
  if (!ready || !headcount) return null;
  if (headcount >= tier) return <span className="tier-st on">✓ 지금 적용 중</span>;
  return <span className="tier-st todo">{tier - headcount}명 더 늘면</span>;
}
