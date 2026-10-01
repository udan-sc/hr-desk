import Link from 'next/link';
import { provisions, BASE_DATE } from '../../lib/data';
import { obligations, documents, docAnchor } from '../../lib/platform';
import { TIERS } from '../../lib/headcount';
import HeadcountBar from '../headcount-bar';
import TierStatus from './tier-status';

export const metadata = {
  title: '규모별 문턱 지도',
  description: '상시 근로자 5·10·30·50·100명 등 인원 문턱을 넘을 때 새로 적용되는 조문·법정 의무·서류를 한 장에 정리했습니다.',
  alternates: { canonical: '/thresholds' },
};

export default function ThresholdsPage() {
  const rows = TIERS.filter((t) => t > 1)
    .map((t) => ({
      t,
      provs: provisions.filter((p) => p.threshold === t),
      obs: obligations.filter((o) => o.thresholdMin === t),
      docs: documents.filter((d) => d.thresholdMin === t),
    }))
    .filter((r) => r.provs.length + r.obs.length + r.docs.length > 0);
  const base = {
    provs: provisions.filter((p) => p.threshold <= 1).length,
    obs: obligations.filter((o) => o.thresholdMin <= 1).length,
    docs: documents.filter((d) => d.thresholdMin <= 1).length,
  };

  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">{BASE_DATE} 시행 법령 기준</div>
          <h1>규모별 문턱 지도</h1>
          <p>
            사람이 늘면 적용되는 법도 늘어납니다. 인원 문턱을 넘을 때 <b>새로</b> 생기는 조문·법정 의무·서류를
            구간별로 모았습니다. 채용 계획을 잡을 때 "몇 명이 되면 뭐가 늘어나지?"에 바로 답합니다.
          </p>
        </header>

        <HeadcountBar hint="인원을 넣으면 우리 회사가 지금 어느 구간에 있는지 표시됩니다." />

        <section className="tier base">
          <div className="tier-h">
            <h2>1명이라도 고용하면</h2>
            <span className="tier-sum">조문 {base.provs} · 의무 {base.obs} · 서류 {base.docs}</span>
          </div>
          <p className="tier-p">
            규모와 무관하게 적용되는 기본 묶음입니다. 근로계약서 교부, 최저임금, 주휴일, 해고예고, 퇴직급여, 4대보험 등이
            여기에 들어갑니다. 전체 목록은 <Link href="/law">노무법전</Link>에서 인원을 1~4명으로 두고 보면 됩니다.
          </p>
        </section>

        {rows.map((r) => {
          const byCat = {};
          r.provs.forEach((p) => {
            (byCat[p.category] = byCat[p.category] || []).push(p);
          });
          return (
            <section key={r.t} className="tier" id={`t-${r.t}`}>
              <div className="tier-h">
                <h2>상시 {r.t}명 이상이 되면</h2>
                <TierStatus tier={r.t} />
                <span className="tier-sum">
                  새로 조문 {r.provs.length} · 의무 {r.obs.length} · 서류 {r.docs.length}
                </span>
              </div>

              {r.provs.length > 0 && (
                <div className="tier-block">
                  <h3>새로 적용되는 조문</h3>
                  {Object.entries(byCat).map(([cat, list]) => (
                    <div key={cat} className="tier-cat">
                      <span className="tier-cat-n">{cat}</span>
                      <span className="tagrow">
                        {list.map((p) => (
                          <Link key={p.href} className="tag" href={p.href}>
                            {p.law} {p.article} {p.title}
                          </Link>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {r.obs.length > 0 && (
                <div className="tier-block">
                  <h3>새로 챙길 법정 의무</h3>
                  <ul className="tier-list">
                    {r.obs.map((o) => (
                      <li key={o.id}>
                        <Link href={`/calendar#${o.id}`}>{o.title}</Link>
                        <span className="tier-when">{o.cadence} · {o.timing}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {r.docs.length > 0 && (
                <div className="tier-block">
                  <h3>새로 갖출 서류</h3>
                  <ul className="tier-list">
                    {r.docs.map((d) => (
                      <li key={d.name}>
                        <Link href={`/docs#${docAnchor(d)}`}>{d.name}</Link>
                        <span className="tier-when">{d.kind} · {d.obligation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          );
        })}

        <Link className="backlink" href="/">
          ← 홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
