import Link from 'next/link';
import CopyButton from './copy-button';
import { LAW_GO_KR_PRECEDENT_SEARCH, precedentDate } from '../lib/platform';

/* 조문 상세의 '관련 판례'. 법원·선고일·판시사항·판결요지는 국가법령정보센터 원문 그대로이고,
   맨 위 한 줄 요지만 이해를 돕기 위한 요약이다(원문과 대조해 검증). */
const SHOWN = 5;

export default function Precedents({ items: all, law, article }) {
  const searchUrl = LAW_GO_KR_PRECEDENT_SEARCH(`${law} ${article}`);
  /* 조문 화면이 길어지지 않게 최근 판례 5건만 펼치고 나머지는 판례 페이지에서 본다 */
  const items = (all || []).slice(0, SHOWN);
  const rest = (all || []).length - items.length;

  return (
    <section className="interp prec">
      <h2>관련 판례</h2>
      <p className="lead">
        이 조문의 해석이 다퉈진 주요 판례입니다. 법원·선고일·판시사항·판결요지는 국가법령정보센터 원문을 글자 그대로
        옮겼고, 굵은 한 줄 요지만 이해를 돕는 요약입니다.
      </p>

      {items?.length > 0 ? (
        <div className="interp-list">
          {items.map((p) => (
            <article key={p.caseNo} className="interp-item prec-item">
              <div className="ih">
                <span className="num">
                  {p.level !== '대법원' && <span className="ag">{p.court}</span>}
                  {p.caseNo}
                </span>
                <span className="when">{precedentDate(p.date)} 선고</span>
                {p.kind.startsWith('전원합의체') && <span className="prec-en">전원합의체</span>}
                <span className="prec-name">{p.caseName}</span>
              </div>
              {p.point && <p className="prec-point">{p.point}</p>}
              <details className="prec-more">
                <summary>판시사항{p.summary ? '·판결요지' : ''} 원문 보기</summary>
                {p.issues && (
                  <>
                    <h3>판시사항</h3>
                    <p className="prec-text">{p.issues}</p>
                  </>
                )}
                {p.summary && (
                  <>
                    <h3>판결요지</h3>
                    <p className="prec-text">{p.summary}</p>
                  </>
                )}
              </details>
              <p className="src">
                <a href={p.url} target="_blank" rel="noopener noreferrer">
                  판결 전문 보기<span className="vh"> (국가법령정보센터, 새 창)</span> <span aria-hidden="true">↗</span>
                </a>
                <CopyButton text={p.title} label="판례 인용 복사" className="sm" />
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="interp-none">
          이 조문에 연결된 수록 판례가 아직 없습니다.{' '}
          <a href={searchUrl} target="_blank" rel="noopener noreferrer">
            국가법령정보센터에서 판례 찾아보기<span className="vh"> (새 창)</span> ↗
          </a>
        </p>
      )}
      <p className="prec-all">
        {rest > 0 ? (
          <Link href={`/cases?q=${encodeURIComponent(`${law} ${article}`)}`}>
            이 조문 판례 {all.length}건 모두 보기 (최근 {items.length}건만 표시) →
          </Link>
        ) : (
          <Link href="/cases">수록 판례 전체에서 검색하기 →</Link>
        )}
      </p>
    </section>
  );
}
