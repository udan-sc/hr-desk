'use client';

import { useHeadcount } from './headcount-context';
import { applies, thresholdLabel } from '../lib/headcount';
import Icon from './nav-icons';

/* 적용 규모 배지. 상시 근로자 수가 설정돼 있으면 적용/미적용까지 붙인다. */
export function ScopeBadge({ threshold, full }) {
  const { headcount } = useHeadcount();
  const inScope = applies(headcount, threshold);
  const partial = headcount && full && full > threshold && headcount < full;
  return (
    <span className={`badge scope${headcount ? (inScope ? ' on' : ' off') : ''}`}>
      {thresholdLabel(threshold)}
      {headcount ? (inScope ? (partial ? ' · 완화 적용' : ' · 적용') : ' · 미적용') : ''}
    </span>
  );
}

/* 조문 상세용 — 규모 배지 + 벌칙 배지(시안 C: 아이콘을 앞에 단 큰 꼬리표) */
export default function ScopeBadges({ threshold, note, penalty }) {
  const { headcount } = useHeadcount();
  const inScope = applies(headcount, threshold);
  return (
    <div className="badges">
      <span className={`badge scope${headcount ? (inScope ? ' on' : ' off') : ''}`}>
        <Icon name="users" size={15} stroke={1.9} className="bi" />
        <span>
          {note || thresholdLabel(threshold)}
          {headcount ? (inScope ? ` · 상시 ${headcount}명 사업장에 적용` : ` · 상시 ${headcount}명 사업장에는 미적용`) : ''}
        </span>
      </span>
      {penalty && (
        <span className="badge pen">
          <Icon name="warn" size={15} stroke={2} className="bi" />
          <span>위반 시 {penalty}</span>
        </span>
      )}
    </div>
  );
}
