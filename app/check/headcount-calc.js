'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CopyButton from '../copy-button';
import { SITE_URL } from '../../lib/site';

/* 근로기준법 시행령 제7조의2(상시 사용하는 근로자 수의 산정 방법)를 그대로 옮긴 계산.
   ① 산정기간(사유 발생일 전 1개월) 연인원 ÷ 가동 일수
   ② 법 적용 기준(5명, 제93조 취업규칙은 10명)에 미달한 날이 가동 일수의 2분의 1 미만이면 적용,
      2분의 1 이상이면 적용하지 않음 — 평균과 결론이 다를 때 이 규칙이 우선한다 */
const PURPOSES = [
  { key: 'general', base: 5, label: '근로기준법 적용 여부 (5명)', note: '해고 제한·가산수당·휴업수당 등 상시 5명 이상에 적용되는 조문' },
  { key: 'rules', base: 10, label: '취업규칙 작성·신고 의무 (10명)', note: '근로기준법 제93조 — 이때만 기준이 10명입니다' },
];
const ANNUAL = { key: 'general', base: 5, label: '연차휴가 적용 여부 (5명, 한 달분)', note: '이 계산을 지난 1년의 달마다 해서 모두 5명 이상이어야 연차휴가 규정이 적용됩니다' };

/* 빈 칸은 0이 아니라 '아직 안 넣음'(NaN)으로 본다 */
const num = (v) => {
  const raw = String(v ?? '').replace(/,/g, '').trim();
  if (raw === '') return NaN;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

export function judge({ base, days, persons, under }) {
  if (!(days > 0) || !(persons >= 0) || !(under >= 0)) return null;
  if (![days, persons, under].every(Number.isInteger)) return { error: '가동 일수·연인원·못 미친 날 수는 모두 정수로 넣어 주세요.' };
  if (under > days) return { error: '못 미친 날 수는 가동 일수보다 클 수 없습니다.' };
  /* 숫자끼리 모순: 기준 이상인 날에는 하루 최소 기준 인원, 모든 날이 미달이면 하루 최대 기준−1명 */
  if (persons < (days - under) * base)
    return { error: `기준 이상이었던 ${days - under}일에는 하루 ${base}명 이상이었으므로 연인원은 ${(days - under) * base}명 이상이어야 합니다. 날짜별 인원을 다시 확인하세요.` };
  if (under === days && persons > days * (base - 1))
    return { error: `모든 날이 ${base}명 미만이었다면 연인원은 ${days * (base - 1)}명을 넘을 수 없습니다. 날짜별 인원을 다시 확인하세요.` };
  const avg = persons / days;
  const avgMeets = persons >= base * days; /* 나눗셈 반올림 없이 정수로 비교 */
  const half = days / 2;
  /* ② 1호: 평균은 미달이어도 미달 일수가 2분의 1 미만이면 적용 / 2호: 평균은 넘어도 미달 일수가 2분의 1 이상이면 적용 안 함
     → 두 호를 합치면 결론은 언제나 '미달 일수가 2분의 1 미만인가'로 정해지고, 평균은 설명용이다 */
  const applies = under < half;
  const overridden = avgMeets !== applies;
  return { avg, avgMeets, half, applies, overridden };
}

/* 입력값을 주소에 남겨(?p·d·n·u) 위 질문 흐름의 답(?a)과 한 주소로 공유되게 한다 */
function syncUrl(vals) {
  const sp = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(vals)) {
    if (v === '' || v == null) sp.delete(k);
    else sp.set(k, v);
  }
  const qs = sp.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}

/* mode: 위 질문 흐름의 결론에 따라 — null(아직 답 안 함·일반), 'annual'(연차휴가: 기준 5명 고정),
   'other'(다른 법의 기준: 이 계산기로 판정하지 않고 평균만 참고), 'excluded'(근로기준법 적용 대상 아님: 계산 안 함) */
export default function HeadcountCalc({ mode = null }) {
  const [purpose, setPurpose] = useState('general');
  const [days, setDays] = useState('');
  const [persons, setPersons] = useState('');
  const [under, setUnder] = useState('');

  /* 공유 주소(?p=general&d=22&n=110&u=3)로 들어오면 값을 채운다 */
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (PURPOSES.some((p) => p.key === sp.get('p'))) setPurpose(sp.get('p'));
    if (sp.get('d')) setDays(sp.get('d').slice(0, 6));
    if (sp.get('n')) setPersons(sp.get('n').slice(0, 8));
    if (sp.get('u')) setUnder(sp.get('u').slice(0, 6));
  }, []);
  const change = (setter, key) => (e) => {
    setter(e.target.value);
    syncUrl({ [key]: e.target.value });
  };

  if (mode === 'excluded') {
    return (
      <section className="panel hc-calc hc-off" aria-labelledby="hcc-off">
        <h2 id="hcc-off">인원을 셀 필요가 없습니다</h2>
        <p className="tpanel-p">
          위 질문의 결론대로 동거하는 친족만 쓰는 사업장이나 가사사용인에게는 근로기준법이 적용되지 않으므로 상시 근로자 수를 계산하지
          않습니다. 친족이 아닌 직원을 1명이라도 쓰게 되면 위 질문을 다시 답한 뒤 계산하세요.
        </p>
      </section>
    );
  }

  const p = mode === 'annual' ? ANNUAL : PURPOSES.find((x) => x.key === purpose);
  const refOnly = mode === 'other';
  const d = num(days);
  const n = num(persons);
  const u = num(under);
  /* 세 칸이 다 차야 결론을 낸다 — 못 미친 날 수를 비워 둔 채 0일로 치면 제7조의2 제2항을 건너뛴 판정이 된다 */
  const filled = [d, n, u].every((x) => !Number.isNaN(x));
  const res = filled && !refOnly ? judge({ base: p.base, days: d, persons: n, under: u }) : null;
  const avgOf = (a, b) => (Math.floor((a / b) * 100) / 100).toLocaleString('ko-KR');
  const partialAvg = d > 0 && n >= 0 ? avgOf(n, d) : null;
  const r = res && !res.error ? res : null;
  const avgText = r ? avgOf(n, d) : '';
  const share = () => `${SITE_URL}/check/headcount/${window.location.search}`;

  return (
    <div className="calc-grid hc-calc">
      <section className="panel" aria-labelledby="hcc-in">
        <h2 id="hcc-in">산정기간의 숫자 넣기</h2>
        {refOnly ? (
          <p className="calc-note hc-ref">
            다른 법(중대재해처벌법·노사협의회·안전관리자 등)의 인원 기준은 법마다 세는 대상과 방법이 달라, 여기서는 판정하지 않고
            평균(연인원 ÷ 가동 일수)만 참고로 보여 드립니다. 위 결과의 안내대로 그 법의 산정 방법을 확인하세요.
          </p>
        ) : mode === 'annual' ? (
          <p className="calc-note hc-ref">{ANNUAL.note}. 한 달분 숫자를 넣어 그 달을 판정하세요.</p>
        ) : (
          <div className="field">
            <label htmlFor="hcc-p">무엇을 판단하나요?</label>
            <select
              id="hcc-p"
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                syncUrl({ p: e.target.value });
              }}
            >
              {PURPOSES.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.label}
                </option>
              ))}
            </select>
            <span className="hint">{p.note}</span>
          </div>
        )}
        <div className="field">
          <label htmlFor="hcc-d">
            가동 일수 <span className="hint">산정기간 중 실제로 사업장을 가동한 날</span>
          </label>
          <input id="hcc-d" type="number" inputMode="numeric" min="1" max="31" value={days} onChange={change(setDays, 'd')} placeholder="예: 22" />
        </div>
        <div className="field">
          <label htmlFor="hcc-n">
            연인원 <span className="hint">가동한 날마다 일한 근로자 수를 모두 더한 값</span>
          </label>
          <input id="hcc-n" type="number" inputMode="numeric" min="0" value={persons} onChange={change(setPersons, 'n')} placeholder="예: 110" />
        </div>
        {!refOnly && (
          <div className="field">
            <label htmlFor="hcc-u">
              기준({p.base}명)에 못 미친 날 수 <span className="hint">날마다 센 인원이 {p.base}명 미만이었던 가동일 수</span>
            </label>
            <input id="hcc-u" type="number" inputMode="numeric" min="0" value={under} onChange={change(setUnder, 'u')} placeholder="예: 3" />
          </div>
        )}
        <details className="feed-how">
          <summary>연인원에 누구를 넣나요?</summary>
          <dl>
            <dt>넣는 사람</dt>
            <dd>통상 근로자, 기간제근로자, 단시간근로자 등 고용형태를 묻지 않고 그 사업장에서 일하는 모든 근로자.</dd>
            <dt>동거하는 친족</dt>
            <dd>친족이 아닌 근로자가 1명이라도 함께 있으면 동거 친족인 근로자도 넣습니다.</dd>
            <dt>빼는 사람</dt>
            <dd>파견근로자(파견법 제2조제5호)는 넣지 않습니다.</dd>
          </dl>
        </details>
      </section>

      <section className="panel calc-out" aria-live="polite" aria-labelledby="hcc-out">
        <h2 id="hcc-out">{refOnly ? '평균(참고)' : '판정'}</h2>
        {refOnly ? (
          <p className="tpanel-p">
            {partialAvg !== null ? (
              <>
                평균 <b>{partialAvg}명</b>(연인원 ÷ 가동 일수) — 참고용이며, 적용 여부는 그 법의 산정 방법으로 판단합니다.
              </>
            ) : (
              '가동 일수와 연인원을 넣으면 평균을 보여 드립니다.'
            )}
          </p>
        ) : !r ? (
          <p className={res?.error ? 'calc-err' : 'tpanel-p'}>
            {res?.error ||
              (partialAvg !== null
                ? `평균만 보면 ${partialAvg}명입니다(참고). 기준에 못 미친 날 수까지 넣어야 판정할 수 있습니다 — 없으면 0을 넣으세요.`
                : '가동 일수, 연인원, 기준에 못 미친 날 수를 모두 넣으면 판정합니다.')}
          </p>
        ) : (
          <>
            <div className={`verdict ${r.applies ? 'ok' : 'warn'}`}>
              {mode === 'annual'
                ? r.applies
                  ? '이 달은 상시 5명 이상입니다'
                  : '이 달은 상시 5명 미만입니다 — 1년 계속 요건이 깨집니다'
                : r.applies
                  ? `상시 ${p.base}명 이상 사업장으로 봅니다`
                  : `상시 ${p.base}명 이상 사업장으로 보지 않습니다`}
            </div>
            <div className="big">
              {avgText}
              <small>명 (연인원 ÷ 가동 일수)</small>
            </div>
            <div className="row">
              <span className="k">평균만 보면</span>
              <span className="v">{r.avgMeets ? `${p.base}명 이상` : `${p.base}명 미만`}</span>
            </div>
            <div className="row">
              <span className="k">기준 미달 일수</span>
              <span className="v">
                {u}일 / 가동 {d}일 (절반 {r.half.toLocaleString('ko-KR')}일)
              </span>
            </div>
            <p className="calc-note">
              {r.overridden
                ? r.applies
                  ? `평균은 ${p.base}명에 못 미치지만, 기준에 못 미친 날이 가동 일수의 2분의 1 미만이라 적용 사업장으로 봅니다(시행령 제7조의2 제2항 제1호).`
                  : `평균은 ${p.base}명 이상이지만, 기준에 못 미친 날이 가동 일수의 2분의 1 이상이라 적용 사업장으로 보지 않습니다(시행령 제7조의2 제2항 제2호).`
                : r.applies
                  ? `평균이 ${p.base}명 이상이고 기준에 못 미친 날도 가동 일수의 2분의 1 미만입니다.`
                  : `평균이 ${p.base}명 미만이고 기준에 못 미친 날도 가동 일수의 2분의 1 이상입니다.`}
            </p>
            <div className="qa-foot">
              <CopyButton
                getText={() =>
                  [
                    `[상시 근로자 수 판정] ${p.label}`,
                    `가동 일수 ${d}일 · 연인원 ${n}명 · 기준 미달 ${u}일`,
                    `평균 ${avgText}명 → ${r.applies ? `상시 ${p.base}명 이상으로 봄` : `상시 ${p.base}명 이상으로 보지 않음`}`,
                    '근거: 근로기준법 시행령 제7조의2',
                    `확인: ${share()}`,
                  ].join('\n')
                }
                label="판정 결과 복사"
                className="sm"
              />
              <CopyButton getText={share} label="결과 링크 복사" className="sm" />
            </div>
          </>
        )}
        <p className="calc-note">
          산정기간은 법 적용 사유(해고, 휴업수당 지급 등)가 생긴 날 전 1개월입니다(사업이 생긴 지 1개월이 안 되면 생긴 날부터).
          연차휴가 규정(제60조~제62조, 다만 1년 미만 등의 월 단위 연차인 제60조제2항은 제외)은 이 방법으로 달마다 센 결과가 사유
          발생일 전 1년 동안 계속 5명 이상이면 적용됩니다(같은 조 제3항). 다른 법률의 인원 기준은 그 법령의 산정 방법을 따릅니다.
        </p>
        <div className="calc-cite">
          <a className="tag" href="https://www.law.go.kr/법령/근로기준법시행령/제7조의2" target="_blank" rel="noopener noreferrer">
            근로기준법 시행령 제7조의2<span className="vh"> (국가법령정보센터, 새 창)</span> ↗
          </a>
          <a className="tag" href="https://www.law.go.kr/법령/근로기준법/제11조" target="_blank" rel="noopener noreferrer">
            근로기준법 제11조(적용 범위)<span className="vh"> (국가법령정보센터, 새 창)</span> ↗
          </a>
          <Link className="tag" href="/thresholds">
            규모별 문턱 지도
          </Link>
        </div>
      </section>
    </div>
  );
}
