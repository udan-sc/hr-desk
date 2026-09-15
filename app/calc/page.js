import Link from 'next/link';
import { calculators } from '../../lib/platform';
import { BASE_DATE } from '../../lib/data';

export const metadata = {
  title: '노무 계산기',
  description: '연차 일수, 퇴직금, 연장·야간·휴일 가산수당, 해고예고수당, 최저임금 미달 여부를 근거 조문과 함께 계산합니다.',
  alternates: { canonical: '/calc' },
};

export default function CalcIndexPage() {
  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">노무 계산기</div>
          <h1>무엇을 계산할까요?</h1>
          <p>
            {BASE_DATE} 시행 법령 기준으로 계산하며, 산식마다 근거 조문과 한계(반드시 사람이 확인해야 하는
            지점)를 함께 보여줍니다. 입력값은 저장되지 않고 브라우저 안에서만 계산됩니다.
          </p>
        </header>

        <div className="topic-grid">
          {calculators.map((c) => (
            <Link key={c.key} className="topic-card" href={`/calc/${c.key}`}>
              <span className="tc-name">{c.name}</span>
              <span className="tc-blurb">{c.purpose.split('.')[0]}.</span>
              <span className="tc-n">계산하기 →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
