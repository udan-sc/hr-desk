/* 상시 근로자 수 기준. 플랫폼 전체가 이 한 벌을 공유한다. */

export const HEADCOUNT_KEY = 'nomu-headcount';
export const DEFAULT_HEADCOUNT = 0; /* 0 = 아직 설정하지 않음 — 모든 조문을 그대로 보여준다 */

/* 법령이 쓰는 인원 구간. 조문·의무의 threshold는 이 값 중 하나다. */
export const TIERS = [1, 5, 10, 20, 30, 50, 100, 300, 500, 1000];

export const PRESETS = [
  { value: 3, label: '1~4명' },
  { value: 7, label: '5~9명' },
  { value: 20, label: '10~29명' },
  { value: 40, label: '30~49명' },
  { value: 70, label: '50~99명' },
  { value: 150, label: '100~299명' },
  { value: 400, label: '300명 이상' },
];

export const clampHeadcount = (n) => {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.min(v, 99999);
};

/* 그 규모에 적용되는가 */
export const applies = (headcount, threshold) => !headcount || headcount >= (threshold || 1);

/* 화면에 쓰는 기준 표기 */
export const thresholdLabel = (threshold) =>
  !threshold || threshold <= 1 ? '규모 무관' : `상시 ${threshold}명 이상`;

/* 다음 구간까지 몇 명 남았는지 — "3명만 더 늘면 새로 생기는 의무" 안내용 */
export const nextTier = (headcount) => {
  if (!headcount) return null;
  return TIERS.find((t) => t > headcount) || null;
};
