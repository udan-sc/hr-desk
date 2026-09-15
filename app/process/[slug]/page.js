import Link from 'next/link';
import { notFound } from 'next/navigation';
import { processes, processBySlug, resolveCitations } from '../../../lib/platform';
import { BASE_DATE } from '../../../lib/data';

export function generateStaticParams() {
  return processes.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = processBySlug(slug);
  if (!p) return { title: '절차를 찾을 수 없습니다' };
  return {
    title: p.title,
    description: `${p.blurb} — ${p.steps.length}단계, 법정 기한·근거 조문 포함. ${BASE_DATE} 시행 기준.`,
    alternates: { canonical: `/process/${p.slug}` },
  };
}

function Citations({ citations }) {
  const list = resolveCitations(citations).filter((c) => c.href);
  if (!list.length) return null;
  return (
    <>
      {list.map((c) => (
        <Link key={`${c.law}${c.article}`} className="tag" href={c.href}>
          {c.law} {c.article}
        </Link>
      ))}
    </>
  );
}

export default async function ProcessPage({ params }) {
  const { slug } = await params;
  const p = processBySlug(slug);
  if (!p) notFound();

  return (
    <main>
      <div className="wrap">
        <nav className="crumb" aria-label="위치">
          <Link href="/process">상황별 업무 절차</Link>
          <span className="sep" aria-hidden="true">›</span>
          <span>{p.title}</span>
        </nav>

        <header className="topic-head">
          <div className="eyebrow">{p.steps.length}단계 · {BASE_DATE} 기준</div>
          <h1>{p.title}</h1>
          <p>{p.trigger}</p>
        </header>

        <ol className="steps">
          {p.steps.map((s, i) => (
            <li key={i}>
              <div className="st">{s.title}</div>
              <p className="sd">{s.detail}</p>
              <div className="sf">
                {s.deadline && s.deadline !== '법정 기한 없음' ? (
                  <span className="deadline">기한: {s.deadline}</span>
                ) : (
                  <span className="deadline none">법정 기한 없음</span>
                )}
                <Citations citations={s.citations} />
              </div>
            </li>
          ))}
        </ol>

        {p.watchouts?.length > 0 && (
          <section className="watchouts">
            <h2>실무에서 자주 틀리는 지점</h2>
            <ul>
              {p.watchouts.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </section>
        )}

        {p.under5Note && (
          <section className="watchouts" style={{ marginTop: 14 }}>
            <h2>상시 5명 미만 사업장이라면</h2>
            <ul>
              <li>{p.under5Note}</li>
            </ul>
          </section>
        )}

        <Link className="backlink" href="/process">
          ← 다른 상황 보기
        </Link>
      </div>
    </main>
  );
}
