import Link from 'next/link';
import { notFound } from 'next/navigation';
import ScopeBadges from '../../../scope-badges';
import Interpretations from '../../../interpretations';
import CopyButton, { PrintButton } from '../../../copy-button';
import { RecentTracker } from '../../../recent-provisions';
import TermLinks from '../../../term-links';
import TipDismiss from '../../../tip-dismiss';
import ChangeNotice from '../../../change-notice';
import Precedents from '../../../precedents';
import LawWatchNotice from '../../../law-watch-notice';
import QaLinks from '../../../qa-links';
import HrCheck from '../../../hr-check';
import FavToggle from '../../../fav-toggle';
import SideSticky from '../../../side-sticky';
import Icon from '../../../nav-icons';
import CardHead from '../../../card-head';
import { interpretationsFor, changesForProvision, precedentsFor, qaFor } from '../../../../lib/platform';
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
  provisionKey,
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

/* 항 머리의 원문자(①…⑳)는 왼쪽 칸으로 떼어 낸다 — 글자는 그대로, 보이는 자리만 바꾼다 */
const CLAUSE_NO = /^\s*([①-⑳])\s*/;

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
  const relatedChanges = changesForProvision(p.law, p.article);
  const blocks = splitProvisionText(p.text);
  const clauses = blocks.filter((b) => b.kind === 'clause');
  const notes = blocks.filter((b) => b.kind === 'note');
  const lawUrl = lawGoKrUrl(p);

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
    isBasedOn: lawUrl,
  };

  return (
    <main>
      <div className="wrap">
        <nav className="crumb" aria-label="위치">
          <Link href="/law">노무법전</Link>
          <span className="sep" aria-hidden="true">
            <Icon name="chevron" size={14} stroke={2} />
          </span>
          <Link href={categoryHref(p.category)}>{p.category}</Link>
          <span className="sep" aria-hidden="true">
            <Icon name="chevron" size={14} stroke={2} />
          </span>
          <span aria-current="page">{p.law} {p.article}</span>
        </nav>

        {/* 넓은 화면: 왼쪽(머리·조문 내용·본문) + 오른쪽(근거 복사·할 일·정보) 2열.
            1100px 미만과 인쇄에서는 머리 → 조문 내용·실무 해설 → 오른쪽 열 → 실무 질문·판례 순서로 한 줄로 쌓인다
            (핵심인 조문 내용이 먼저 나오고, 읽는 순서 = 보이는 순서). */}
        <article className="detail art">
          <header className="art-head">
            <div className="art-hcard">
              <p className="art-lawline">
                <span className="lawname">「{officialLaw(p.law)}」</span>
                <span className="dot" aria-hidden="true" />
                <span className="art-cat">{p.category}</span>
              </p>
              <h1>
                {p.article}({p.title})
              </h1>
              <p className="lede">
                <span className="lede-k">한 줄 요지</span>
                <span className="lede-t"><TermLinks text={p.summary} /></span>
              </p>
              <ScopeBadges threshold={p.threshold} note={p.thresholdNote} penalty={p.penalty} />
            </div>

            <ChangeNotice items={relatedChanges} />
            <LawWatchNotice provision={{ law: p.law, article: p.article }} curatedDates={relatedChanges.map((c) => c.effectiveDate)} />
          </header>

          {(clauses.length > 0 || notes.length > 0) && (
            <div className="art-text">
              {/* 조문 요약과 편집자 해설을 눈으로 구분한다 — 정확한 문구는 국가법령정보센터 원문 */}
              {clauses.length > 0 && (
                <section className="text" aria-labelledby="text-h">
                  <CardHead icon="law" id="text-h" title="조문 내용" sub="원문 요약 · 정확한 문구는 국가법령정보센터 원문">
                    <a className="ac-link" href={lawUrl} target="_blank" rel="noopener noreferrer">
                      원문 보기<span className="vh"> (국가법령정보센터, 새 창)</span>
                      <Icon name="external" size={13} stroke={2} />
                    </a>
                  </CardHead>
                  <div className="text-body">
                    {clauses.map((b, i) => {
                      const m = CLAUSE_NO.exec(b.text);
                      return m ? (
                        <p key={i} className="clause has-n">
                          <span className="cl-n">{m[1]}</span>
                          <span className="cl-t">
                            <TermLinks text={b.text.slice(m[0].length)} />
                          </span>
                        </p>
                      ) : (
                        <p key={i} className="clause">
                          <TermLinks text={b.text} />
                        </p>
                      );
                    })}
                  </div>
                </section>
              )}
              {notes.length > 0 && (
                <section className="text notes" aria-labelledby="notes-h">
                  <CardHead icon="pen" id="notes-h" title="실무 해설">
                    <span className="ac-flag">
                      <Icon name="info" size={13} stroke={2} />
                      편집자 정리 · 원문이 아님
                    </span>
                  </CardHead>
                  <div className="text-body">
                    {notes.map((b, i) => (
                      <p key={i} className="note">
                        <TermLinks text={b.text.replace(/^(※|▷|▶)\s*(실무 ?포인트\s*[:：]?|실무\s*[:：])?\s*/, '')} />
                      </p>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          <aside className="art-side" aria-label="근거 복사와 인사담당자 체크">
            <div className="art-act">
              <div className="art-acts">
                <CopyButton text={citationText} label="근거 복사" copiedLabel="복사됨 — 붙여넣기 하세요" className="primary" />
                <PrintButton />
                <FavToggle favKey={provisionKey(p)} name={`${p.law} ${p.article}`} />
              </div>
              <p className="cite-hint">복사하면 조문명·요지·적용 범위·원문 주소가 인용문으로 담깁니다</p>
            </div>

            <HrCheck law={p.law} article={p.article} />

            <section className="art-info" aria-labelledby="info-h">
              <h2 id="info-h">조문 정보</h2>
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
                <dd>
                  <span className="mono">{BASE_DATE}</span> 시행 기준
                </dd>
                <dt>원문</dt>
                <dd>
                  <a href={lawUrl} target="_blank" rel="noopener noreferrer">
                    국가법령정보센터에서 보기<span className="vh"> (새 창)</span> <Icon name="external" size={13} stroke={2} />
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
            </section>
          </aside>

          <div className="art-body">
            <QaLinks items={qaFor(p.law, p.article)} law={p.law} article={p.article} />

            <Precedents items={precedentsFor(p.law, p.article)} law={p.law} article={p.article} />

            <Interpretations items={interpretations} law={p.law} article={p.article} />

            {related.length > 0 && (
              <section className="related" aria-labelledby="rel-h">
                <CardHead icon="law" id="rel-h" title="함께 보면 좋은 조문" />
                <div className="rel-list">
                  {related.map((r) => (
                    <Link key={`${r.law}-${r.article}`} href={r.href}>
                      <span className="rl-tx">
                        <span className="rl-law">「{r.law}」 {r.article}</span>
                        <span className="rl-title">{r.title}</span>
                        <span className="rl-sum">{r.summary}</span>
                      </span>
                      <Icon name="chevron" size={16} stroke={2} className="rl-go" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <Link className="backlink" href="/law">
              ← 노무법전으로 돌아가기
            </Link>
          </div>
        </article>
      </div>
      <RecentTracker law={p.law} article={p.article} title={p.title} />
      <TipDismiss />
      <SideSticky />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
    </main>
  );
}
