'use client';

import { useState } from 'react';
import WizardClient from './wizard-client';
import HeadcountCalc from './headcount-calc';

/* 상시 근로자 수: 위 질문 흐름(누구를 세나·무엇을 판단하나)의 결론이 아래 계산기의 모드를 정한다 */
const MODE = { 'r-excluded': 'excluded', 'r-ready-annual': 'annual', 'r-ready-other': 'other', 'r-ready-general': null };

export default function HeadcountWizard({ w }) {
  const [resultId, setResultId] = useState(null);
  const mode = resultId && resultId in MODE ? MODE[resultId] : null;

  return (
    <>
      {w.start && Object.keys(w.nodes).length > 0 && (
        <section className="wz-pre" aria-label="먼저 확인할 것">
          <h2 className="tpanel-h">먼저, 연인원에 넣을 사람인지 확인</h2>
          <WizardClient w={w} onResult={setResultId} />
        </section>
      )}
      <HeadcountCalc mode={mode} />
    </>
  );
}
