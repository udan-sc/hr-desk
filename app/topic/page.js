import Link from 'next/link';
import { categories, stats, BASE_DATE } from '../../lib/data';

export const metadata = {
  title: '분야별로 찾기',
  description: `노동법 핵심 조문 ${stats.provisions}개를 근로계약·임금·근로시간·해고 등 ${stats.categories}개 분야로 나눠 봅니다.`,
  alternates: { canonical: '/topic' },
};

export default function TopicIndexPage() {
  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">노무법전 · 분야별로 찾기</div>
          <h1>조문을 분야로 좁혀 보기</h1>
          <p>
            조문 번호를 모를 때는 분야로 좁히는 편이 빠릅니다. {stats.categories}개 분야에 {stats.provisions}개 조문이 들어
            있고, {BASE_DATE} 시행 법령 기준입니다. 조문이 아니라 업무 순서가 궁금하다면 <Link href="/process">상황별 업무 절차</Link>를
            보세요.
          </p>
        </header>

        <div className="topic-grid">
          {categories.map((c) => (
            <Link key={c.slug} className="topic-card" href={`/topic/${c.slug}`}>
              <span className="tc-name">{c.name}</span>
              <span className="tc-blurb">{c.blurb}</span>
              <span className="tc-n">조문 {c.count}개 →</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
