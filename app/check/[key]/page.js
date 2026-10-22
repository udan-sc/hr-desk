import Link from 'next/link';
import { notFound } from 'next/navigation';
import { wizards, wizardByKey, precedents, calculatorByKey } from '../../../lib/platform';
import { findProvision } from '../../../lib/data';
import WizardClient from '../wizard-client';
import HeadcountWizard from '../headcount-wizard';

export function generateStaticParams() {
  return wizards.map((w) => ({ key: w.key }));
}

export async function generateMetadata({ params }) {
  const { key } = await params;
  const w = wizardByKey(key);
  if (!w) return {};
  return { title: w.title, description: w.intro, alternates: { canonical: `/check/${key}` } };
}

/* 결과의 인용을 실제 데이터와 대조해 링크를 붙인다 — 없는 인용은 빌드 전 검사(check-citations)가 막는다 */
const resolveResult = (r) => ({
  verdict: r.verdict,
  tone: r.tone,
  detail: r.detail,
  caveat: r.caveat || '',
  provisions: (r.provisions || [])
    .map((c) => {
      const p = findProvision(c.law, c.article);
      return p ? { label: `${c.law} ${c.article}`, title: p.title, href: p.href } : null;
    })
    .filter(Boolean),
  precedents: (r.precedents || [])
    .map((no) => {
      const p = precedents.find((x) => x.caseNo === no);
      return p ? { label: `대법원 ${no}`, note: p.point || p.caseName, href: `/cases?q=${encodeURIComponent(no)}` } : null;
    })
    .filter(Boolean),
  calc: r.calc && calculatorByKey(r.calc) ? { label: calculatorByKey(r.calc).name, href: `/calc/${r.calc}` } : null,
});

export default async function WizardPage({ params }) {
  const { key } = await params;
  const w = wizardByKey(key);
  if (!w) notFound();
  const data = {
    key: w.key,
    title: w.title,
    start: w.start,
    nodes: w.nodes,
    results: Object.fromEntries(Object.entries(w.results).map(([id, r]) => [id, resolveResult(r)])),
  };

  return (
    <main>
      <div className="wrap">
        <nav className="crumb" aria-label="위치">
          <Link href="/check">판정 도우미</Link>
          <span className="sep" aria-hidden="true">
            ›
          </span>
          <span>{w.title}</span>
        </nav>
        <header className="topic-head">
          <div className="eyebrow">판정 도우미</div>
          <h1>{w.title}</h1>
          <p>{w.intro}</p>
        </header>
        {w.calc ? <HeadcountWizard w={data} /> : <WizardClient w={data} />}
        <p className="wz-note">
          일반적인 경우를 전제로 한 안내입니다. 근로계약서·취업규칙·실제 근무 방식에 따라 결론이 달라질 수 있으니 근거 조문과 판례를
          함께 확인하세요.
        </p>
        <Link className="backlink" href="/check">
          ← 판정 도우미 목록
        </Link>
      </div>
    </main>
  );
}
