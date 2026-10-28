'use client';

import { useHeadcount } from './headcount-context';
import { applies, thresholdLabel } from '../lib/headcount';

/* '한눈에 보는 기준' 카드의 적용 규모. 인원을 넣어 두었고 그 규모에 적용되지 않으면 바로 알린다 */
export default function CardScale({ threshold, note }) {
  const { headcount, ready } = useHeadcount();
  const off = ready && headcount > 0 && !applies(headcount, threshold);
  return (
    <span className={`card-scale${threshold > 1 ? ' s5' : ''}${off ? ' off' : ''}`} title={note}>
      {off ? `상시 ${headcount}명: 적용 안 됨` : thresholdLabel(threshold)}
    </span>
  );
}
