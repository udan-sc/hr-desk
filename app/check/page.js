import Link from 'next/link';
import { wizards } from '../../lib/platform';

export const metadata = {
  title: '판정 도우미',
  description: '근로자성, 상시 근로자 수, 퇴직금 지급 대상, 해고예고 필요 여부, 육아휴직·근로시간 단축 대상을 질문에 답하며 판정하고 근거 조문을 확인합니다.',
  alternates: { canonical: '/check' },
};

/* 목록 순서 — 실무에서 먼저 따지는 순 */
const ORDER = ['worker-status', 'headcount', 'severance-eligible', 'dismissal-notice', 'parental'];
const MARK = { 'worker-status': '人', headcount: '數', 'severance-eligible': '退', 'dismissal-notice': '告', parental: '育' };

export default function CheckPage() {
  const list = [...wizards].sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">질문에 답하면 결론과 근거 조문</div>
          <h1>판정 도우미</h1>
          <p>
            “이 사람도 대상인가?”를 쉬운 질문 몇 개로 판정합니다. 결론마다 근거 조문·판례가 붙고, 결과 링크를 복사해 결재 문서나
            메신저로 그대로 공유할 수 있습니다. 여러 사정을 종합해야 하는 사안은 가능성으로 안내하고 최종 판단 주체를 함께 적었습니다.
          </p>
        </header>
        <div className="wz-grid">
          {list.map((w) => (
            <Link key={w.key} className="wz-tile" href={`/check/${w.key}`}>
              <span className="gi-mk" aria-hidden="true">
                {MARK[w.key] || '定'}
              </span>
              <span className="wz-tt">{w.title}</span>
              <span className="wz-ti">{w.intro}</span>
              <span className="wz-tgo">{w.calc ? '숫자 넣고 바로 판정 →' : `질문 ${w.depth}개 안팎 · 시작하기 →`}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
