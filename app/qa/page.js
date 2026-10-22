import { qa, QA_CATEGORIES, precedents, glossaryById, calculatorByKey, interpretationsFor } from '../../lib/platform';
import { findProvision } from '../../lib/data';
import QaClient from './qa-client';

export const metadata = {
  title: '실무 Q&A',
  description: '수습 연차, 퇴직금 대상, 해고예고처럼 인사·노무 실무에서 자주 묻는 질문에 결론 한 줄과 근거 조문·판례·행정해석을 붙여 답합니다.',
  alternates: { canonical: '/qa' },
};

const kDate = (iso) => (iso ? iso.split('-').map(Number).join('. ') + '.' : '');

/* 인용은 실제 데이터와 대조해 링크를 붙인다 — 없는 것은 싣지 않는다(scripts/check-citations.mjs가 빌드 전에 막음) */
function resolve(q) {
  return {
    id: q.id,
    category: q.category,
    question: q.question,
    short: q.short,
    answer: q.answer,
    caveat: q.caveat || '',
    provisions: (q.provisions || [])
      .map((c) => {
        const p = findProvision(c.law, c.article);
        return p ? { law: c.law, article: c.article, label: `${c.law} ${c.article}`, title: p.title, href: p.href } : null;
      })
      .filter(Boolean),
    precedents: (q.precedents || [])
      .map((no) => {
        const p = precedents.find((x) => x.caseNo === no);
        return p ? { label: `대법원 ${no}`, note: p.point || p.caseName, href: `/cases?q=${encodeURIComponent(no)}` } : null;
      })
      .filter(Boolean),
    interpretations: (q.interpretations || [])
      .map((c) => {
        const it = interpretationsFor(c.law, c.article).find((x) => x.docNumber === c.docNumber);
        return it ? { label: `${it.agency} ${it.docNumber}`, date: kDate(it.date), url: it.url || findProvision(c.law, c.article)?.href } : null;
      })
      .filter(Boolean),
    terms: (q.terms || [])
      .map((id) => {
        const g = glossaryById.get(id);
        return g ? { label: g.term, href: `/terms#${id}` } : null;
      })
      .filter(Boolean),
    calc: q.calc && calculatorByKey(q.calc) ? { label: calculatorByKey(q.calc).name, href: `/calc/${q.calc}` } : null,
  };
}

export default function QaPage() {
  const items = qa.map(resolve);
  const cats = QA_CATEGORIES.filter((c) => items.some((x) => x.category === c));

  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">조문·판례·행정해석 원문과 대조 검증</div>
          <h1>실무 Q&amp;A</h1>
          <p>
            인사·노무 실무에서 자주 묻는 질문 {items.length}개에 결론 한 줄과 근거를 붙였습니다. 조문 이름을 몰라도 질문으로 찾아
            들어가면 근거 조문·판례·행정해석으로 이어집니다. 개별 사안은 근거 원문을 함께 확인하세요.
          </p>
        </header>
        <QaClient items={items} categories={cats} />
      </div>
    </main>
  );
}
