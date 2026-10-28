import Link from 'next/link';
import { practiceFor } from '../lib/platform';

/* 조문 상세의 '인사담당자 체크' — 이 조문 때문에 회사가 할 일을 한곳에 모은다.
   새 설명을 쓰지 않고, 절차·캘린더·서식·판정·계산기가 이 조문을 근거로 든 항목만 거꾸로 모아 링크로 잇는다. */
function Row({ label, items }) {
  if (!items.length) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>
        <ul>
          {items.map((x) => (
            <li key={x.href}>
              <Link href={x.href}>{x.label}</Link>
              {x.note && <span className="hrc-note"> — {x.note}</span>}
            </li>
          ))}
        </ul>
      </dd>
    </>
  );
}

export default function HrCheck({ law, article }) {
  const p = practiceFor(law, article);
  if (!p.steps.length && !p.calendar.length && !p.docs.length && !p.tools.length) return null;
  /* 판정·계산 도구만 있는 상자는 인쇄할 내용이 없다 */
  const onlyTools = !p.steps.length && !p.calendar.length && !p.docs.length;
  return (
    <section className={onlyTools ? 'hrcheck hrc-only-tools' : 'hrcheck'} aria-labelledby="hrc-h">
      <h2 id="hrc-h">인사담당자 체크 — 이 조문 때문에 할 일</h2>
      <dl>
        <Row label="할 일·기한" items={p.steps} />
        <Row label="정기 일정" items={p.calendar} />
        <Row label="갖출 서류" items={p.docs} />
        {p.tools.length > 0 && (
          <>
            <dt className="hrc-tools-l">판정·계산</dt>
            <dd className="hrc-tools">
              {p.tools.map((x) => (
                <Link key={x.href} className="tag tag-calc" href={x.href}>
                  {x.label} →
                </Link>
              ))}
            </dd>
          </>
        )}
      </dl>
      <p className="hrc-foot">절차·캘린더·서식·도구 가운데 이 조문을 근거로 든 것을 모았습니다. 우리 회사 적용 여부는 위 배지를 확인하세요.</p>
    </section>
  );
}
