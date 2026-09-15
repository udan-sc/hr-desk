import Link from 'next/link';
import { documents, resolveCitations } from '../../lib/platform';
import { BASE_DATE } from '../../lib/data';
import { ScopeBadge } from '../scope-badges';
import HeadcountBar from '../headcount-bar';
import ScopeFilter from '../scope-filter';

export const metadata = {
  title: '규정·서식',
  description: '근로계약서, 임금대장, 취업규칙처럼 갖춰야 하는 서류와 규정 — 법정 기재사항, 보존기간, 미비 시 제재를 정리했습니다.',
  alternates: { canonical: '/docs' },
};

const KIND_ORDER = ['서식', '대장', '규정'];

export default function DocsPage() {
  const sorted = [...documents].sort((a, b) => {
    const ka = KIND_ORDER.indexOf(a.kind);
    const kb = KIND_ORDER.indexOf(b.kind);
    if (ka !== kb) return ka - kb;
    const oa = a.obligation === '법정 의무' ? 0 : a.obligation === '사실상 필수' ? 1 : 2;
    const ob = b.obligation === '법정 의무' ? 0 : b.obligation === '사실상 필수' ? 1 : 2;
    return oa - ob;
  });
  const musts = documents.filter((d) => d.obligation === '법정 의무').length;

  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">규정·서식 · {BASE_DATE} 기준</div>
          <h1>갖춰야 할 서류가 다 있나요?</h1>
          <p>
            {documents.length}종을 정리했고 그중 {musts}종은 법정 의무입니다. 문서마다 법으로 정해진 기재사항과
            보존기간, 빠뜨렸을 때의 제재를 적어 두었으니 점검표로 쓰세요.
          </p>
        </header>

        <HeadcountBar hint="인원을 넣으면 우리 회사가 갖춰야 할 서류만 가려 볼 수 있습니다." />
        <ScopeFilter items={sorted.map((d) => ({ id: d.name, threshold: d.thresholdMin }))} label="서류" />

        <h2 className="vh">서류 목록</h2>
        {sorted.map((d) => {
          const cites = resolveCitations(d.citations).filter((x) => x.href);
          return (
            <article key={d.name} className="doc" data-scope-id={d.name}>
              <div className="dh">
                <h3>{d.name}</h3>
                <span className="kind">{d.kind}</span>
                <span className={`ob-badge ${d.obligation === '권장' ? 'rec' : 'must'}`}>{d.obligation}</span>
                <ScopeBadge threshold={d.thresholdMin} full={d.thresholdFull} />
              </div>
              <p className="dp">{d.purpose}</p>
              <dl className="dl">
                {d.mustInclude?.length > 0 && (
                  <>
                    <dt>필수 기재</dt>
                    <dd>
                      <ul>
                        {d.mustInclude.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </dd>
                  </>
                )}
                <dt>인원 요건</dt>
                <dd>{d.threshold}</dd>
                <dt>보존기간</dt>
                <dd>{d.retention}</dd>
                {d.penalty && (
                  <>
                    <dt>미비 시</dt>
                    <dd>{d.penalty}</dd>
                  </>
                )}
                {cites.length > 0 && (
                  <>
                    <dt>근거</dt>
                    <dd>
                      <div className="tagrow">
                        {cites.map((x) => (
                          <Link key={`${x.law}${x.article}`} className="tag" href={x.href}>
                            {x.law} {x.article}
                          </Link>
                        ))}
                      </div>
                    </dd>
                  </>
                )}
              </dl>
              {d.tip && <p className="tip">{d.tip}</p>}
            </article>
          );
        })}
      </div>
    </main>
  );
}
