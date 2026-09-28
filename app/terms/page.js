import Link from 'next/link';
import { glossary, GLOSSARY_CATEGORIES, resolveCitations } from '../../lib/platform';
import { BASE_DATE } from '../../lib/data';

export const metadata = {
  title: '용어 사전',
  description:
    '통상임금과 평균임금, 휴일과 휴가, 수습과 시용처럼 조문마다 되풀이 등장하지만 서로 헷갈리는 노동법 개념을 실무 눈높이로 정리했습니다.',
  alternates: { canonical: '/terms' },
};

/* 용어명 → 앵커 id. related 배열이 용어명으로 오므로 링크로 바꿀 때 쓴다. */
const idByTerm = new Map(glossary.map((g) => [g.term, g.id]));

export default function TermsPage() {
  const groups = GLOSSARY_CATEGORIES
    .map((c) => ({ c, items: glossary.filter((g) => g.category === c) }))
    .filter((g) => g.items.length > 0);

  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">{BASE_DATE} 시행 법령 기준</div>
          <h1>헷갈리는 용어 사전</h1>
          <p>
            조문마다 되풀이 등장하지만 서로 헷갈리는 개념 {glossary.length}개를 실무 눈높이로 정리했습니다.
            각 항목의 근거 조문을 누르면 원문 요약과 행정해석으로 이어집니다.
          </p>
        </header>

        <nav className="gloss-toc" aria-label="분류 바로가기">
          {groups.map((g) => (
            <a key={g.c} className="tag" href={`#${encodeURIComponent(g.c)}`}>
              {g.c} {g.items.length}
            </a>
          ))}
        </nav>

        {groups.map((g) => (
          <section key={g.c} className="gloss-group" id={g.c}>
            <h2>{g.c}</h2>
            <div className="gloss-list">
              {g.items.map((item) => {
                const cites = resolveCitations(item.citations).filter((x) => x.href);
                const rel = (item.related || []).filter((name) => idByTerm.has(name) && name !== item.term);
                return (
                  <article key={item.id} className="gloss-item" id={item.id}>
                    <h3>{item.term}</h3>
                    <p className="def">{item.definition}</p>
                    <p className="pit">
                      <b>실무에서 헷갈리는 지점</b>
                      {item.pitfall}
                    </p>
                    <div className="g-foot">
                      {cites.map((x) => (
                        <Link key={`${x.law}${x.article}`} className="tag" href={x.href}>
                          근거: {x.law} {x.article}{x.title ? `(${x.title})` : ''}
                        </Link>
                      ))}
                      {rel.length > 0 && (
                        <span className="g-rel">
                          함께 보기:{' '}
                          {rel.map((name, i) => (
                            <span key={name}>
                              {i > 0 && ' · '}
                              <a href={`#${idByTerm.get(name)}`}>{name}</a>
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}

        <Link className="backlink" href="/">
          ← 홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
