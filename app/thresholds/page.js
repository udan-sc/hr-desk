import Link from 'next/link';
import { provisions, findProvision, BASE_DATE } from '../../lib/data';
import { obligations, documents, docAnchor } from '../../lib/platform';
import { TIERS } from '../../lib/headcount';
import HeadcountBar from '../headcount-bar';
import TierStatus from './tier-status';
import PageSearch from '../page-search';

export const metadata = {
  title: '규모별 문턱 지도',
  description: '상시 근로자 5·10·30·50·100명 등 인원 문턱을 넘을 때 새로 적용되는 조문·법정 의무·서류를 한 장에 정리했습니다.',
  alternates: { canonical: '/thresholds' },
};

/* 1~4명 사업장 최소 체크리스트 — 새 법 문장을 쓰지 않고 수록 조문을 묶어 링크한다.
   근거 조문이 노무법전에 없으면 빌드를 멈춘다(조문을 빼거나 이름을 바꿨을 때 깨진 링크가 나가지 않게). */
const SMALL_MUST = [
  { t: '근로계약서 서면 작성·교부', refs: [['근로기준법', '제17조']], doc: '근로계약서(정규직)' },
  { t: '최저임금 이상 지급', refs: [['최저임금법', '제6조']] },
  { t: '임금 매월 1회 이상 전액 지급 · 임금명세서 교부', refs: [['근로기준법', '제43조'], ['근로기준법', '제48조']], doc: '임금명세서' },
  { t: '근로자명부·임금대장 작성, 계약 서류 3년 보존', refs: [['근로기준법', '제41조'], ['근로기준법', '제42조']] },
  { t: '휴게시간 · 주휴일(1주 소정근로 15시간 이상)', refs: [['근로기준법', '제54조'], ['근로기준법', '제55조']] },
  { t: '해고 30일 전 예고(또는 30일분 통상임금) · 해고금지기간 준수', refs: [['근로기준법', '제26조'], ['근로기준법', '제23조제2항']] },
  { t: '퇴직 후 14일 안에 임금·퇴직금 청산', refs: [['근로기준법', '제36조']] },
  { t: '퇴직금(1년 이상 · 주 15시간 이상 근무자)', refs: [['퇴직급여법', '제4조'], ['퇴직급여법', '제8조']] },
  { t: '출산전후휴가 · 배우자 출산전후휴가 · 육아휴직', refs: [['근로기준법', '제74조'], ['남녀고용평등법', '제18조의2'], ['남녀고용평등법', '제19조']] },
  { t: '성희롱 예방교육(10명 미만은 자료 게시·배포로 갈음) · 발생 시 조치', refs: [['남녀고용평등법', '제13조'], ['남녀고용평등법', '제14조']] },
  { t: '고용·산재보험 가입, 입사·퇴사 신고(법인 아닌 농·임·어업 소규모 등 일부 제외)', refs: [['고용보험법', '제8조'], ['고용보험법', '제15조']] },
  { t: '위험성평가 실시·기록', refs: [['산업안전보건법', '제36조']] },
];
const SMALL_NOT = [
  { t: '연차 유급휴가', refs: [['근로기준법', '제60조']] },
  { t: '연장·야간·휴일근로 가산수당(50%)', refs: [['근로기준법', '제56조']] },
  { t: '주 40시간 · 연장 주 12시간 한도', refs: [['근로기준법', '제50조'], ['근로기준법', '제53조']] },
  { t: '관공서 공휴일 유급휴일(주휴일은 적용)', refs: [['근로기준법', '제55조']] },
  { t: '해고의 정당한 이유 · 해고 서면통지 · 부당해고 구제신청', refs: [['근로기준법', '제23조'], ['근로기준법', '제27조'], ['근로기준법', '제28조']] },
  { t: '휴업수당', refs: [['근로기준법', '제46조']] },
  { t: '생리휴가', refs: [['근로기준법', '제73조']] },
  { t: '직장 내 괴롭힘 금지·조치 의무', refs: [['근로기준법', '제76조의2'], ['근로기준법', '제76조의3']] },
  { t: '기간제 2년 사용 제한 · 차별 시정', refs: [['기간제법', '제4조'], ['기간제법', '제8조']] },
  { t: '중대재해처벌법의 중대산업재해 의무(제2장)', refs: [['중대재해처벌법', '제3조']] },
];
const withRefs = (list) =>
  list.map((x) => ({
    ...x,
    refs: x.refs.map(([law, article]) => {
      const p = findProvision(law, article);
      if (!p) throw new Error(`문턱 지도 체크리스트의 근거 조문이 없습니다: ${law} ${article}`);
      return { label: `${law} ${article}`, href: p.href, note: p.thresholdNote };
    }),
    doc: x.doc ? documents.find((d) => d.name === x.doc) : null,
  }));

function Check({ items, mark }) {
  return (
    <ul className="sc-list">
      {items.map((x) => (
        <li key={x.t}>
          <span className="sc-mk" aria-hidden="true">{mark}</span>
          <span className="sc-t">{x.t}</span>
          <span className="sc-refs">
            {x.refs.map((r) => (
              <Link key={r.href} className="tag" href={r.href} title={r.note}>
                {r.label}
              </Link>
            ))}
            {x.doc && (
              <Link className="tag tag-calc" href={`/docs#${docAnchor(x.doc)}`}>
                서식
              </Link>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* 업종·성별 같은 조건이 붙은 문턱 — 인원만으로 '해당'이라고 단정하지 않는다 */
const isConditional = (note) => /업종|제조업|건설|여성|도입 사업장|해당 유해인자/.test(note || '');
/* 조건 설명이 길면(업종 목록 등) 앞부분만 보이고 전체는 마우스를 올리거나 링크를 눌러 본다 */
const brief = (note) => {
  const t = String(note || '');
  const cut = t.search(/[(:：]/);
  const head = cut > 0 && cut <= 40 ? t.slice(0, cut) : t.slice(0, 40);
  return head.length < t.length ? `${head.trim()} …` : t;
};

export default function ThresholdsPage() {
  const rows = TIERS.filter((t) => t > 1)
    .map((t) => ({
      t,
      provs: provisions.filter((p) => p.threshold === t),
      obs: obligations.filter((o) => o.thresholdMin === t),
      docs: documents.filter((d) => d.thresholdMin === t),
      /* 더 작은 규모에서 시작해 이 구간에서 전면 적용되는 의무·서류(예: 장애인 고용의무 50명 → 부담금 100명) */
      full: [
        ...obligations.filter((o) => o.thresholdFull === t && o.thresholdMin < t).map((o) => ({ key: o.id, name: o.title, href: `/calendar#${o.id}`, note: o.threshold })),
        ...documents.filter((d) => d.thresholdFull === t && d.thresholdMin < t).map((d) => ({ key: d.name, name: d.name, href: `/docs#${docAnchor(d)}`, note: d.threshold })),
      ],
    }))
    .filter((r) => r.provs.length + r.obs.length + r.docs.length + r.full.length > 0);
  const must = withRefs(SMALL_MUST);
  const not = withRefs(SMALL_NOT);
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
        <PageSearch item=".tier-cat .tag, .tier-list li" group=".tier-cat, .tier-block, .tier:not(.base)" placeholder="예: 취업규칙, 직장 내 괴롭힘, 안전관리자" />

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
          <div className="small-check" id="t-1">
            <div className="sc-col sc-must">
              <h3>1~4명이어도 반드시 할 것</h3>
              <Check items={must} mark="✓" />
            </div>
            <div className="sc-col sc-not">
              <h3>5명 미만에는 법정 의무가 아닌 것</h3>
              <Check items={not} mark="–" />
              <p className="sc-note">
                법으로 강제되지 않을 뿐 금지되는 것은 아닙니다. 근로계약서·취업규칙으로 연차·가산수당 등을 주기로 정했다면 그 약속대로
                지급해야 합니다. 18세 미만·임산부 근로시간 제한과 해고금지기간은 5명 미만에도 적용됩니다. 중대재해처벌법의 중대시민재해 중
                원료·제조물 관련 의무(제9조제1항)는 인원과 관계없이 적용됩니다.
              </p>
            </div>
          </div>
          <p className="sc-foot">
            노무법전 수록 조문 기준의 요약입니다. 국민연금·건강보험 가입처럼 여기 없는 의무는 각 공단 안내를 확인하세요. 우리 회사가 몇
            명인지 헷갈리면 <Link href="/check/headcount">상시 근로자 수 계산</Link>부터 하세요. 규모와 무관한 정기 일정은{' '}
            <Link href="/calendar">법정 의무 캘린더</Link>에 있습니다.
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
                          <Link key={p.href} className={`tag${isConditional(p.thresholdNote) ? ' cond' : ''}`} href={p.href} title={p.thresholdNote}>
                            {p.law} {p.article} {p.title}
                            {isConditional(p.thresholdNote) && <span className="cond-mk"> · 조건부: {p.thresholdNote}</span>}
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
                        {isConditional(o.threshold) && (
                          <span className="cond-mk" title={o.threshold}>
                            조건부: {brief(o.threshold)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {r.full.length > 0 && (
                <div className="tier-block">
                  <h3>이 구간부터 전면 적용</h3>
                  <ul className="tier-list">
                    {r.full.map((x) => (
                      <li key={x.key}>
                        <Link href={x.href}>{x.name}</Link>
                        <span className="tier-when clamp2" title={x.note}>
                          {x.note}
                        </span>
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
