import Link from 'next/link';
import TimeBadge from './time-badge';
import StickyToc from '../sticky-toc';
import { changes, resolveCitations } from '../../lib/platform';
import { BASE_DATE } from '../../lib/data';

export const metadata = {
  title: '달라지는 노동법',
  description:
    '2026년부터 연도별로 시행되는 근로기준법·모성보호·산업안전 등 인사노무 법령 개정을 시행일 순 타임라인으로 정리했습니다. 공포·고시가 완료된 개정만 싣습니다.',
  alternates: { canonical: '/changes' },
};

const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${m}. ${d}.`;
};

export default function ChangesPage() {
  const years = [...new Set(changes.map((c) => c.effectiveDate.slice(0, 4)))].sort();

  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">공포·고시 완료된 개정만 · 계류 법안 제외</div>
          <h1>달라지는 노동법</h1>
          <p>
            2026년부터 시행되는 인사노무 법령 개정 {changes.length}건을 시행일 순으로 정리했습니다.
            각 항목에는 무엇이 바뀌는지, 실무에서 무엇을 해야 하는지, 공포·고시 근거를 함께 실었습니다.
            조문 본문은 {BASE_DATE} 시행 기준이므로 그 뒤에 시행되는 개정은 아직 조문 페이지에 반영되어 있지 않을 수 있습니다.
          </p>
        </header>

        <StickyToc
          items={years.map((y) => ({ id: `y-${y}`, label: `${y}년`, count: changes.filter((c) => c.effectiveDate.startsWith(y)).length }))}
        />

        {years.map((y) => (
          <section key={y} className="tl-year" id={`y-${y}`}>
            <h2>{y}년</h2>
            <div className="timeline">
              {changes
                .filter((c) => c.effectiveDate.startsWith(y))
                .map((c) => {
                  const cites = resolveCitations(c.citations).filter((x) => x.href);
                  return (
                    <article key={c.id} className="tl-item" id={c.id}>
                      <div className="tl-when">
                        <span className="tl-date">{fmtDate(c.effectiveDate)}</span>
                        <TimeBadge date={c.effectiveDate} />
                      </div>
                      <div className="tl-body">
                        <div className="tl-head">
                          <span className="tl-law">{c.law}</span>
                          <h3>{c.title}</h3>
                          {c.scope && <span className="tl-scope">{c.scope}</span>}
                        </div>
                        <p className="tl-change">{c.change}</p>
                        <p className="tl-practice">
                          <b>실무에서</b>
                          {c.practice}
                        </p>
                        <div className="tl-foot">
                          <span className="tl-src">
                            {c.promulgation}
                            {c.sourceUrl && (
                              <>
                                {' · '}
                                <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">
                                  출처<span className="vh"> (새 창)</span> ↗
                                </a>
                              </>
                            )}
                          </span>
                          {cites.map((x) => (
                            <Link key={`${x.law}${x.article}`} className="tag" href={x.href}>
                              {x.law} {x.article}
                            </Link>
                          ))}
                        </div>
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
