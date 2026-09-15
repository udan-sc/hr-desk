import Link from 'next/link';
import { notFound } from 'next/navigation';
import CalcClient from '../calc-client';
import { calculators, calculatorByKey, resolveCitations } from '../../../lib/platform';
import { BASE_DATE } from '../../../lib/data';

export function generateStaticParams() {
  return calculators.map((c) => ({ key: c.key }));
}

export async function generateMetadata({ params }) {
  const { key } = await params;
  const c = calculatorByKey(key);
  if (!c) return { title: '계산기를 찾을 수 없습니다' };
  return {
    title: c.name,
    description: `${c.purpose.split('.')[0]}. ${BASE_DATE} 시행 법령 기준.`,
    alternates: { canonical: `/calc/${c.key}` },
  };
}

export default async function CalcPage({ params }) {
  const { key } = await params;
  const c = calculatorByKey(key);
  if (!c) notFound();
  const cites = resolveCitations(c.citations).filter((x) => x.href);

  return (
    <main>
      <div className="wrap">
        <nav className="crumb" aria-label="위치">
          <Link href="/calc">노무 계산기</Link>
          <span className="sep" aria-hidden="true">›</span>
          <span>{c.name}</span>
        </nav>

        <header className="topic-head">
          <div className="eyebrow">{BASE_DATE} 시행 법령 기준</div>
          <h1>{c.name}</h1>
          <p>{c.purpose}</p>
        </header>

        <CalcClient calcKey={c.key} />

        <section className="watchouts" style={{ marginTop: 26, maxWidth: 900 }}>
          <h2>이 계산기가 답하지 못하는 것</h2>
          <ul>
            <li>{c.caveat}</li>
          </ul>
          {cites.length > 0 && (
            <div className="calc-cite">
              {cites.map((x) => (
                <Link key={`${x.law}${x.article}`} className="tag" href={x.href}>
                  근거: {x.law} {x.article}{x.title ? `(${x.title})` : ''}
                </Link>
              ))}
            </div>
          )}
        </section>

        <Link className="backlink" href="/calc">
          ← 다른 계산기 보기
        </Link>
      </div>
    </main>
  );
}
