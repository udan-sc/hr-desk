import Link from 'next/link';
import TimeBadge from './time-badge';
import StickyToc from '../sticky-toc';
import { changes, autoChanges, watchStatus, resolveCitations } from '../../lib/platform';
import { BASE_DATE } from '../../lib/data';

export const metadata = {
  title: '달라지는 노동법',
  description:
    '2026년부터 연도별로 시행되는 근로기준법·모성보호·산업안전 등 인사노무 법령 개정을 시행일 순 타임라인으로 정리했습니다. 매주 국가법령정보센터를 자동 확인해 새로 공포된 개정을 더합니다.',
  alternates: { canonical: '/changes' },
};

const fmtDate = (iso) => {
  const [, m, d] = iso.split('-');
  return `${m}. ${d}.`;
};
const fmtFull = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${y}. ${Number(m)}. ${Number(d)}.`;
};
/* 공식 개정이유는 길 수 있어 앞부분만 싣고 전문은 링크로 */
const cut = (s, n = 420) => (s.length > n ? s.slice(0, n).trimEnd() + '…' : s);

export default function ChangesPage() {
  const all = [...changes, ...autoChanges].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  const years = [...new Set(all.map((c) => c.effectiveDate.slice(0, 4)))].sort();

  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">공포·고시 완료된 개정만 · 계류 법안 제외</div>
          <h1>달라지는 노동법</h1>
          <p>
            2026년부터 시행되는 인사노무 법령 개정 {all.length}건을 시행일 순으로 정리했습니다.{' '}
            {autoChanges.length > 0
              ? `정리된 ${changes.length}건에는 무엇이 바뀌는지와 실무에서 할 일을 함께 실었고, 매주 자동 확인에서 새로 잡힌 ${autoChanges.length}건은 공식 개정이유와 함께 먼저 실었습니다(실무 해설은 검토 후 추가).`
              : '항목마다 무엇이 바뀌는지와 실무에서 할 일을 함께 실었습니다. 매주 국가법령정보센터를 자동으로 확인해, 새로 공포된 개정이 있으면 공식 개정이유와 함께 바로 더합니다.'}{' '}
            조문 본문은 {BASE_DATE} 시행 기준입니다.
          </p>
          {watchStatus.checkedAt && (
            <p className="watch-stamp">
              <span className="tl-auto">자동 확인</span> 마지막 확인 {fmtFull(watchStatus.checkedAt)} · 매주 월요일 국가법령정보센터 원문 기준
            </p>
          )}
        </header>

        <StickyToc
          items={years.map((y) => ({ id: `y-${y}`, label: `${y}년`, count: all.filter((c) => c.effectiveDate.startsWith(y)).length }))}
        />

        {years.map((y) => (
          <section key={y} className="tl-year" id={`y-${y}`}>
            <h2>{y}년</h2>
            <div className="timeline">
              {all
                .filter((c) => c.effectiveDate.startsWith(y))
                .map((c) => {
                  const cites = resolveCitations(c.citations).filter((x) => x.href);
                  return (
                    <article key={c.id} className={`tl-item${c.auto ? ' auto' : ''}`} id={c.id}>
                      <div className="tl-when">
                        <span className="tl-date">{fmtDate(c.effectiveDate)}</span>
                        <TimeBadge date={c.effectiveDate} />
                      </div>
                      <div className="tl-body">
                        <div className="tl-head">
                          <span className="tl-law">{c.law}</span>
                          <h3>{c.title}</h3>
                          {c.auto ? <span className="tl-auto">자동 감지</span> : c.scope && <span className="tl-scope">{c.scope}</span>}
                        </div>
                        {c.auto ? (
                          <>
                            {c.reason ? (
                              <p className="tl-change tl-reason">
                                <b>개정이유 (법제처 원문)</b>
                                {cut(c.reason)}
                              </p>
                            ) : (
                              <p className="tl-change">공식 개정이유를 아직 받지 못했습니다. 아래 원문 링크에서 확인하세요.</p>
                            )}
                            <p className="tl-practice">
                              <b>실무에서</b>
                              매주 자동 확인에서 새로 잡힌 개정입니다. 실무 해설은 검토 후 추가됩니다.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="tl-change">{c.change}</p>
                            <p className="tl-practice">
                              <b>실무에서</b>
                              {c.practice}
                            </p>
                            {c.note && <p className="tl-note">{c.note}</p>}
                          </>
                        )}
                        <div className="tl-foot">
                          <span className="tl-src">
                            {c.promulgation}
                            {c.sourceUrl && (
                              <>
                                {' · '}
                                <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">
                                  {c.auto ? '개정 후 원문' : '출처'}
                                  <span className="vh"> (새 창)</span> ↗
                                </a>
                              </>
                            )}
                            {c.reasonUrl && (
                              <>
                                {' · '}
                                <a href={c.reasonUrl} target="_blank" rel="noopener noreferrer">
                                  개정이유 전문<span className="vh"> (새 창)</span> ↗
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
