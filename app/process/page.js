import Link from 'next/link';
import { processes } from '../../lib/platform';
import { BASE_DATE } from '../../lib/data';

export const metadata = {
  title: '상황별 업무 절차',
  description: '입사, 퇴사, 출산·육아, 징계·해고, 산재, 괴롭힘 신고 — 상황이 생겼을 때 밟아야 할 순서를 법정 기한, 근거 조문과 함께 봅니다.',
  alternates: { canonical: '/process' },
};

export default function ProcessIndexPage() {
  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">상황별 업무 절차</div>
          <h1>무슨 일이 생겼나요?</h1>
          <p>
            상황을 고르면 밟아야 할 순서를 법정 기한·근거 조문과 함께 보여줍니다. {BASE_DATE} 시행 법령
            기준이며, 각 단계의 조문을 눌러 원문 요약을 확인할 수 있습니다.
          </p>
        </header>

        {processes.length === 0 ? (
          <div className="empty">
            <h2>절차 데이터가 아직 없습니다</h2>
            <p>데이터 생성이 끝나면 이 화면에 상황 목록이 표시됩니다.</p>
          </div>
        ) : (
          <div className="topic-grid">
            {processes.map((p) => (
              <Link key={p.slug} className="topic-card" href={`/process/${p.slug}`}>
                <span className="tc-name">{p.title}</span>
                <span className="tc-blurb">{p.blurb}</span>
                <span className="tc-n">{p.steps.length}단계 →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
