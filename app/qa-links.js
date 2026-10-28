import Link from 'next/link';

/* 5명 미만 사업장이면 답이 달라지는 질문만 표시한다 */
const U5 = { none: '5명 미만은 해당 없음', partial: '5명 미만은 일부 다름' };

/* 조문 상세의 '이 조문으로 답하는 실무 질문' — 실무 Q&A 중 이 조문을 근거로 든 질문 */
export default function QaLinks({ items, law, article }) {
  if (!items?.length) return null;
  const shown = items.slice(0, 6);
  return (
    <section className="interp qa-links" aria-labelledby="qal-h">
      <h2 id="qal-h">이 조문으로 답하는 실무 질문</h2>
      <ul className="qal">
        {shown.map((q) => (
          <li key={q.id}>
            <Link href={`/qa#${q.id}`}>
              <span className="qal-q">Q. {q.question}</span>
              <span className="qal-a">
                {q.short}
                {U5[q.under5?.status] && <span className="qal-u5"> · {U5[q.under5.status]}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {items.length > shown.length && (
        <p className="prec-all">
          <Link href={`/qa?law=${encodeURIComponent(law)}&art=${encodeURIComponent(article)}`}>이 조문 질문 {items.length}개 모두 보기 →</Link>
        </p>
      )}
    </section>
  );
}
