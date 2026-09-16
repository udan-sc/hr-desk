import Link from 'next/link';
import { notFound } from 'next/navigation';
import ScopeBadges from '../../../scope-badges';
import Interpretations from '../../../interpretations';
import CopyButton from '../../../copy-button';
import { interpretationsFor } from '../../../../lib/platform';
import { SITE_URL } from '../../../../lib/site';
import { lawGoKrDisplayUrl } from '../../../../lib/lawlinks';
import {
  provisions,
  findProvision,
  relatedProvisions,
  lawGoKrUrl,
  officialLaw,
  categoryHref,
  provisionHref,
  splitProvisionText,
  BASE_DATE,
} from '../../../../lib/data';

const safeDecode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

export function generateStaticParams() {
  return provisions.map((p) => ({ law: p.law, article: p.article }));
}

async function resolve(params) {
  const { law, article } = await params;
  return findProvision(safeDecode(law), safeDecode(article));
}

export async function generateMetadata({ params }) {
  const p = await resolve(params);
  if (!p) return { title: '조문을 찾을 수 없습니다' };
  const title = `${p.law} ${p.article}(${p.title})`;
  return {
    title,
    description: `${p.summary} — ${BASE_DATE} 시행 기준. ${p.thresholdNote}.`,
    keywords: p.keywords,
    alternates: { canonical: provisionHref(p) },
    openGraph: {
      type: 'article',
      title,
      description: p.summary,
    },
  };
}

export default async function ProvisionPage({ params }) {
  const p = await resolve(params);
  if (!p) notFound();
  const related = relatedProvisions(p);
  const interpretations = interpretationsFor(p.law, p.article);

  /* 근거 복사 — 메일·보고서에 그대로 붙일 수 있는 인용문 */
  const citationText = [
    `「${officialLaw(p.law)}」 ${p.article}(${p.title})`,
    `요지: ${p.summary}`,
    `적용: ${p.thresholdNote}${p.penalty ? ` / 위반 시: ${p.penalty}` : ''}`,
    `원문: ${lawGoKrDisplayUrl(p)}`,
    `(${BASE_DATE} 시행 기준 · ${SITE_URL}/law/${p.law}/${p.article})`,
  ].join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${p.law} ${p.article}(${p.title})`,
    description: p.summary,
    articleSection: p.category,
    inLanguage: 'ko',
    isBasedOn: lawGoKrUrl(p),
  };

  return (
    <main>
      <div className="wrap">
        <article className="detail">
          <nav className="crumb" aria-label="위치">
            <Link href="/law">노무법전</Link>
            <span className="sep" aria-hidden="true">›</span>
            <Link href={categoryHref(p.category)}>{p.category}</Link>
            <span className="sep" aria-hidden="true">›</span>
            <span>{p.law} {p.article}</span>
          </nav>

          <div className="lawname">「{officialLaw(p.law)}」</div>
          <h1>
            {p.article}({p.title})
          </h1>
          <p className="lede">{p.summary}</p>

          <ScopeBadges threshold={p.threshold} note={p.thresholdNote} penalty={p.penalty} />

          <div className="cite-row">
            <CopyButton text={citationText} label="근거 복사" copiedLabel="복사됨 — 붙여넣기 하세요" />
            <span className="cite-hint">조문명·요지·적용 범위·원문 주소가 인용문으로 복사됩니다</span>
          </div>

          <div className="text">
            {splitProvisionText(p.text).map((b, i) => (
              <p key={i} className={b.kind}>
                {b.text}
              </p>
            ))}
          </div>

          <dl className="kv">
            <dt>분야</dt>
            <dd>
              <Link href={categoryHref(p.category)}>{p.category}</Link>
            </dd>
            <dt>법령</dt>
            <dd>{officialLaw(p.law)}</dd>
            <dt>적용 규모</dt>
            <dd>{p.thresholdNote}</dd>
            <dt>기준일</dt>
            <dd>{BASE_DATE} 시행 기준</dd>
            <dt>원문</dt>
            <dd>
              <a href={lawGoKrUrl(p)} target="_blank" rel="noopener noreferrer">
                국가법령정보센터에서 보기 ↗
              </a>
            </dd>
            {p.keywords?.length > 0 && (
              <>
                <dt>이렇게 찾기</dt>
                <dd>
                  <div className="tagrow">
                    {p.keywords.map((k) => (
                      <Link key={k} className="tag" href={`/law?q=${encodeURIComponent(k)}`}>
                        {k}
                      </Link>
                    ))}
                  </div>
                </dd>
              </>
            )}
          </dl>

          <Interpretations items={interpretations} law={p.law} article={p.article} />

          {related.length > 0 && (
            <section className="related">
              <h2>함께 보면 좋은 조문</h2>
              <div className="rel-list">
                {related.map((r) => (
                  <Link key={`${r.law}-${r.article}`} href={r.href}>
                    <div className="rl-law">「{r.law}」 {r.article}</div>
                    <div className="rl-title">{r.title}</div>
                    <div className="rl-sum">{r.summary}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <Link className="backlink" href="/law">
            ← 노무법전으로 돌아가기
          </Link>
        </article>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </main>
  );
}
