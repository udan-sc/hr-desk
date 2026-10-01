import { Suspense } from 'react';
import { precedents } from '../../lib/platform';
import { categories, findProvision } from '../../lib/data';
import CasesClient from './cases-client';

export const metadata = {
  title: '판례',
  description:
    '통상임금·해고·근로시간 등 노동 실무 핵심 판례를 판시사항·판결요지 원문 그대로 찾아봅니다. 국가법령정보센터 원문으로 바로 이어집니다.',
  alternates: { canonical: '/cases' },
};

export default function CasesPage() {
  /* 목록에는 판결요지 전문을 싣지 않는다 — 펼칠 때 /prec/<원문 일련번호>.json에서 받아온다 */
  const items = precedents.map((p) => ({
    caseNo: p.caseNo,
    precSeq: p.precSeq,
    court: p.court,
    level: p.level,
    date: p.date,
    kind: p.kind,
    caseName: p.caseName,
    title: p.title,
    url: p.url,
    point: p.point,
    category: p.category,
    issues: p.issues,
    hasSummary: Boolean(p.summary),
    auto: Boolean(p.auto),
    provisions: (p.provisions || [])
      .map((x) => {
        const f = findProvision(x.law, x.article);
        return f ? { label: `${x.law} ${x.article}`, href: f.href } : null;
      })
      .filter(Boolean),
  }));
  const years = items.map((p) => Number(p.date.slice(0, 4)));

  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">국가법령정보센터 원문 기준</div>
          <h1>판례</h1>
          <p>
            노동 실무에서 자주 다퉈지는 쟁점의 핵심 판례 {items.length}건을 모았습니다
            {years.length ? ` (${Math.min(...years)}~${Math.max(...years)}년 선고)` : ''}. 법원·선고일·판시사항·판결요지는
            국가법령정보센터 원문을 글자 그대로 옮겼고, 굵은 한 줄 요지만 이해를 돕는 요약입니다.
          </p>
        </header>
        <Suspense fallback={<p className="fav-loading" aria-busy="true">불러오는 중…</p>}>
          <CasesClient items={items} categories={categories.map((c) => c.name)} />
        </Suspense>
      </div>
    </main>
  );
}
