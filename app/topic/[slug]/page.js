import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ScopeBadge } from '../../scope-badges';
import { categories, categoryBySlug, provisions, lawGoKrUrl, BASE_DATE } from '../../../lib/data';

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = categoryBySlug(slug);
  if (!c) return { title: '분야를 찾을 수 없습니다' };
  return {
    title: c.name,
    description: `${c.blurb}. ${c.name} 분야 핵심 조문 ${c.count}개 — ${BASE_DATE} 시행 기준.`,
    alternates: { canonical: `/topic/${c.slug}` },
  };
}

export default async function TopicPage({ params }) {
  const { slug } = await params;
  const c = categoryBySlug(slug);
  if (!c) notFound();
  const list = provisions.filter((p) => p.categorySlug === slug);
  const under5 = list.filter((p) => p.appliesUnder5).length;

  return (
    <main>
      <div className="wrap">
        <nav className="crumb" aria-label="위치">
          <Link href="/law">노무법전</Link>
          <span className="sep" aria-hidden="true">›</span>
          <Link href="/topic">분야별</Link>
          <span className="sep" aria-hidden="true">›</span>
          <span>{c.name}</span>
        </nav>

        <header className="topic-head">
          <div className="eyebrow">{c.count}개 조문</div>
          <h1>{c.name}</h1>
          <p>
            {c.blurb}. 이 가운데 {under5}개는 규모와 무관하게 적용되고, 나머지 {c.count - under5}개는 상시 근로자
            수가 일정 규모 이상일 때만 적용됩니다.
          </p>
        </header>

        <h2 className="vh">이 분야의 조문 목록</h2>
        <div className="plist">
          {list.map((p) => (
            <article key={`${p.law}-${p.article}`} className="prov">
              <div className="head">
                <div>
                  <div className="law">「{p.law}」</div>
                  <h3>
                    <Link href={p.href}>
                      {p.article}({p.title})
                    </Link>
                  </h3>
                  <p className="sum">{p.summary}</p>
                </div>
              </div>
              <div className="foot">
                <ScopeBadge threshold={p.threshold} />
                {p.penalty && <span className="badge pen">위반 시 {p.penalty}</span>}
                <span className="spacer" />
                <a className="law-link" href={lawGoKrUrl(p)} target="_blank" rel="noopener noreferrer">
                  원문<span className="vh"> (국가법령정보센터, 새 창)</span> <span aria-hidden="true">↗</span>
                </a>
              </div>
            </article>
          ))}
        </div>

        <Link className="backlink" href="/topic">
          ← 다른 분야 보기
        </Link>
      </div>
    </main>
  );
}
