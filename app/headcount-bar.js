'use client';

import { useHeadcount } from './headcount-context';
import { PRESETS, nextTier } from '../lib/headcount';

/* 사업장 규모 입력. 한 번 정하면 노무법전·캘린더·규정서식이 같은 값을 쓴다. */
export default function HeadcountBar({ hint }) {
  const { headcount, setHeadcount, ready } = useHeadcount();
  const next = nextTier(headcount);

  return (
    <section className="hc-bar" aria-label="사업장 규모 설정">
      <div className="hc-main">
        <label htmlFor="headcount">우리 회사 상시 근로자 수</label>
        <div className="hc-input">
          <input
            id="headcount"
            type="number"
            inputMode="numeric"
            min="0"
            max="99999"
            placeholder="예: 87"
            value={ready && headcount ? headcount : ''}
            onChange={(e) => setHeadcount(e.target.value === '' ? 0 : e.target.value)}
          />
          <span className="unit">명</span>
          {headcount > 0 && (
            <button type="button" className="hc-clear" onClick={() => setHeadcount(0)}>
              해제
            </button>
          )}
        </div>
      </div>

      <div className="hc-presets">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={`chip${headcount === p.value ? ' on' : ''}`}
            aria-pressed={headcount === p.value}
            onClick={() => setHeadcount(headcount === p.value ? 0 : p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="hc-note" role="status" aria-live="polite">
        {!headcount ? (
          hint || '인원을 넣으면 그 규모에 적용되지 않는 항목을 흐리게 표시하고, 걸러 볼 수도 있습니다.'
        ) : (
          <>
            상시 {headcount}명 기준으로 적용 여부를 표시합니다.
            {next && ` 상시 ${next}명이 되면 새로 생기는 의무가 있습니다.`}
            {' '}상시 근로자 수는 산정 사유 발생일 전 1개월간 연인원을 가동일수로 나눠 셉니다(근로기준법 시행령 제7조의2).
          </>
        )}
      </p>
    </section>
  );
}
