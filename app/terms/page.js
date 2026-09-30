import Link from 'next/link';
import { glossary, GLOSSARY_CATEGORIES, resolveCitations } from '../../lib/platform';
import { BASE_DATE } from '../../lib/data';

export const metadata = {
  title: '용어 사전',
  description:
    '통상임금과 평균임금, 휴일과 휴가, 수습과 시용처럼 조문마다 되풀이 등장하지만 서로 헷갈리는 노동법 개념을 한 줄 요약과 그림으로 쉽게 정리했습니다.',
  alternates: { canonical: '/terms' },
};

/* 용어명 → 앵커 id. related 배열이 용어명으로 오므로 링크로 바꿀 때 쓴다. */
const idByTerm = new Map(glossary.map((g) => [g.term, g.id]));

const CONF_LABEL = { 2: '헷갈림 주의', 3: '자주 혼동' };

/* 도해 — 검증된 정의에서 뽑은 데이터를 네 가지 그림 형식으로 그린다 */
function GlossVisual({ v }) {
  if (!v || !v.type) return null;

  if (v.type === 'compare' && v.cols?.length) {
    return (
      <div className="gv">
        <div className="gv-compare" data-n={v.cols.length}>
          {v.cols.map((c, i) => (
            <div key={i} className={`gvc${i === 0 ? ' first' : ''}`}>
              <div className="gvc-t">{c.title}</div>
              {(c.rows || []).map((r, j) => (
                <div key={j} className="gvc-r">{r}</div>
              ))}
            </div>
          ))}
        </div>
        {v.note && <div className="gv-note">{v.note}</div>}
      </div>
    );
  }

  if (v.type === 'formula' && v.parts?.length) {
    return (
      <div className="gv">
        <div className="gv-formula">
          {v.parts.map((p, i) => (
            <span key={i} className="gvf-seg">
              {p.op && <span className="gvf-op">{p.op}</span>}
              <span className="gvf-box">{p.label}</span>
            </span>
          ))}
          {v.result && (
            <span className="gvf-seg">
              <span className="gvf-op">=</span>
              <span className="gvf-box res">{v.result}</span>
            </span>
          )}
        </div>
        {v.note && <div className="gv-note">{v.note}</div>}
      </div>
    );
  }

  if (v.type === 'steps' && v.steps?.length) {
    return (
      <div className="gv">
        <div className="gv-steps">
          {v.steps.map((s, i) => (
            <div key={i} className="gvs">
              <span className="gvs-n" aria-hidden="true">{i + 1}</span>
              <span className="gvs-b">
                {s.when && <b>{s.when}</b>}
                {s.what}
              </span>
            </div>
          ))}
        </div>
        {v.note && <div className="gv-note">{v.note}</div>}
      </div>
    );
  }

  if (v.type === 'scale' && v.points?.length) {
    return (
      <div className="gv">
        <div className="gv-scale">
          {v.points.map((p, i) => (
            <div key={i} className="gvp">
              <span className="gvp-n">{p.n}</span>
              <span className="gvp-w">{p.what}</span>
            </div>
          ))}
        </div>
        {v.note && <div className="gv-note">{v.note}</div>}
      </div>
    );
  }

  return null;
}

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
            조문마다 되풀이 등장하지만 서로 헷갈리는 개념 {glossary.length}개를 한 줄 요약과 그림으로 정리했습니다.
            정확한 정의와 근거 조문은 각 항목 아래에서 펼쳐 볼 수 있습니다.
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
                    <div className="g-top">
                      <h3>{item.term}</h3>
                      {CONF_LABEL[item.confusion] && (
                        <span className={`g-conf c${item.confusion}`}>
                          <span aria-hidden="true">{'●'.repeat(item.confusion)}{'○'.repeat(3 - item.confusion)}</span> {CONF_LABEL[item.confusion]}
                        </span>
                      )}
                    </div>

                    {item.plain && <p className="g-plain">{item.plain}</p>}

                    <GlossVisual v={item.visual} />

                    {item.example && (
                      <p className="g-ex">
                        <b>예를 들어</b>
                        {item.example}
                      </p>
                    )}

                    <p className="pit">
                      <b>실무에서 헷갈리는 지점</b>
                      {item.pitfall}
                    </p>

                    <details className="g-more">
                      <summary>정확한 정의와 근거 조문 보기</summary>
                      <p className="def">{item.definition}</p>
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
                    </details>
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
