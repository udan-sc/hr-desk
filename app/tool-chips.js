import Link from 'next/link';
import { processes, wizards, calculators, documents, docAnchor, qa, obligations } from '../lib/platform';

/* '바로 하기' 칩 — 자료의 tools {process, check, calc, docs, qa, calendar}를 실제 화면 링크로 바꾼다.
   자료에 없는 값은 건너뛴다(빌드 전 검사 check-citations가 막지만 화면이 깨지지 않게 한 번 더). */
export function resolveTools(tools) {
  if (!tools) return [];
  const out = [];
  for (const slug of tools.process || []) {
    const p = processes.find((x) => x.slug === slug);
    if (p) out.push({ href: `/process/${slug}`, label: `절차: ${p.title}` });
  }
  for (const key of tools.check || []) {
    const w = wizards.find((x) => x.key === key);
    if (w) out.push({ href: `/check/${key}`, label: `판정: ${w.title}` });
  }
  for (const key of tools.calc || []) {
    const c = calculators.find((x) => x.key === key);
    if (c) out.push({ href: `/calc/${key}`, label: `계산: ${c.name}` });
  }
  for (const name of tools.docs || []) {
    const d = documents.find((x) => x.name === name);
    if (d) out.push({ href: `/docs#${docAnchor(d)}`, label: `서식: ${d.name}` });
  }
  for (const title of tools.calendar || []) {
    const o = obligations.find((x) => x.title === title);
    if (o) out.push({ href: `/calendar#${o.id}`, label: `일정: ${o.title}` });
  }
  for (const id of tools.qa || []) {
    const q = qa.find((x) => x.id === id);
    if (q) out.push({ href: `/qa#${id}`, label: `Q&A: ${q.question.length > 26 ? q.question.slice(0, 26) + '…' : q.question}` });
  }
  return out;
}

export default function ToolChips({ tools, label = '바로 하기' }) {
  const list = resolveTools(tools);
  if (!list.length) return null;
  return (
    <div className="toolchips">
      <span className="tc-l">{label}</span>
      {list.map((x) => (
        <Link key={x.href} className="tag tag-calc" href={x.href}>
          {x.label}
        </Link>
      ))}
    </div>
  );
}
