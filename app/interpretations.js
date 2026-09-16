import { LAW_GO_KR_INTERPRETATION_SEARCH } from '../lib/platform';
import CopyButton from './copy-button';

/* 회시 하나를 메일·보고서에 붙일 인용문으로 만든다 */
function interpCitation(it, law, article) {
  const head = it.hasNumber === false ? `${it.agency} 회신(회시번호 미부여)` : `${it.agency} ${it.docNumber}`;
  const when = it.date ? `, ${it.date.replace(/-/g, '. ')}.` : '';
  return [
    `[행정해석] ${head}${when} — ${law} ${article} 관련`,
    `질의: ${it.question}`,
    `회답: ${it.answer}`,
    it.url ? `원문: ${it.url}` : null,
  ].filter(Boolean).join('\n');
}

/* 조문에 딸린 고용노동부 행정해석(질의회시).
   싣는 것은 회시번호 실재와 내용 일치가 모두 확인된 것뿐이고,
   확인 주소를 함께 보여 준다 — 눌러서 원문을 대조할 수 있어야 근거로 쓸 수 있다. */
export default function Interpretations({ items, law, article }) {
  const searchUrl = LAW_GO_KR_INTERPRETATION_SEARCH(`${law} ${article}`);

  return (
    <section className="interp">
      <h2>행정해석</h2>
      <p className="lead">
        조문만으로 판단이 서지 않을 때 정부가 낸 질의회시입니다. 회시번호와 원문 주소를 함께 실었으니 그대로 인용할
        수 있습니다. 회시번호가 실재하고 내용까지 맞는 것만 실었습니다.
      </p>

      {items?.length > 0 ? (
        <div className="interp-list">
          {items.map((it) => (
            <article key={it.docNumber + it.date} className="interp-item">
              <div className="ih">
                <span className="num">
                  {it.agency !== '고용노동부' && <span className="ag">{it.agency}</span>}
                  {it.hasNumber === false ? `${it.agency} 회신` : it.docNumber}
                </span>
                {it.date && <span className="when">{it.date.replace(/-/g, '. ')}.</span>}
              </div>
              <dl>
                <dt>질의</dt>
                <dd>{it.question}</dd>
                <dt>회답</dt>
                <dd className="ans">{it.answer}</dd>
              </dl>
              <p className="src">
                {it.url && (
                  <a href={it.url} target="_blank" rel="noopener noreferrer">
                    원문 확인<span className="vh"> (새 창)</span> <span aria-hidden="true">↗</span>
                  </a>
                )}
                <CopyButton text={interpCitation(it, law, article)} label="회시 인용 복사" className="sm" />
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="interp-none">
          이 조문에 대해 확인된 질의회시가 아직 없습니다. 회시번호와 내용이 모두 확인된 것만 싣기 때문입니다.{' '}
          <a href={searchUrl} target="_blank" rel="noopener noreferrer">
            국가법령정보센터에서 직접 찾아보기<span className="vh"> (새 창)</span> ↗
          </a>
        </p>
      )}
    </section>
  );
}
