'use client';

import { useEffect, useState } from 'react';
import { annualLeave, severancePay, overtimePay, dismissalNotice, minimumWage, MIN_WAGE_2026 } from '../../lib/calc';
import CopyButton from '../copy-button';

const won = (n) => (typeof n === 'number' ? Math.round(n).toLocaleString('ko-KR') : n);
const todayStr = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};

function Num({ label, hint, value, onChange, step = 1, max }) {
  const id = label.replace(/\s/g, '');
  return (
    <div className="field">
      <label htmlFor={id}>{label} {hint && <span className="hint">{hint}</span>}</label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min="0"
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
    </div>
  );
}

/* 날짜 입력의 연도 칸은 최대 연도가 275760년이라, 4자리를 쳐도 브라우저가
   "더 이어질 수 있다"고 보고 월로 넘어가지 않는다. 최대를 4자리로 묶으면
   2026까지만 치면 바로 월 칸으로 넘어간다. */
const DATE_MIN = '1950-01-01';
const DATE_MAX = '2099-12-31';

function DateF({ label, hint, value, onChange }) {
  const id = label.replace(/\s/g, '');
  return (
    <div className="field">
      <label htmlFor={id}>{label} {hint && <span className="hint">{hint}</span>}</label>
      <input
        id={id}
        type="date"
        min={DATE_MIN}
        max={DATE_MAX}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Check({ label, hint, value, onChange }) {
  return (
    <label className="check">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      <span>{label} {hint && <span className="hint">— {hint}</span>}</span>
    </label>
  );
}

function Row({ k, v }) {
  return (
    <div className="row">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

function Warnings({ list }) {
  if (!list?.length) return null;
  return (
    <div role="alert">
      {list.map((w, i) => (
        <p key={i} className="verdict warn" style={{ fontWeight: 500, fontSize: 13 }}>{w}</p>
      ))}
    </div>
  );
}

/* ── 공유 링크 ──
   입력값을 주소 물음표 뒤에 실어 두면, 링크를 받은 사람이 열었을 때 같은 계산이 그대로 재현된다.
   주소만 읽고 페이지는 정적으로 두기 위해 마운트 후 useEffect에서 한 번 반영한다. */
function useQueryHydrate(apply) {
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    if ([...qs.keys()].length === 0) return;
    const get = (k) => qs.get(k);
    get.date = (k) => (/^\d{4}-\d{2}-\d{2}$/.test(qs.get(k) || '') ? qs.get(k) : null);
    get.num = (k) => {
      const v = qs.get(k);
      return v !== null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : null;
    };
    get.bool = (k) => {
      const v = qs.get(k);
      return v === null ? null : v === '1';
    };
    apply(get);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function buildQuery(params) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === '' || v === null || v === undefined) continue;
    qs.set(k, v === true ? '1' : v === false ? '0' : String(v));
  }
  return qs.toString();
}

function ShareRow({ params, resultText }) {
  const url = () => {
    const q = buildQuery(params);
    const href = `${window.location.origin}${window.location.pathname}${q ? '?' + q : ''}`;
    window.history.replaceState(null, '', href);
    return href;
  };
  return (
    <div className="share-row">
      <CopyButton getText={url} label="공유 링크 복사" copiedLabel="링크 복사됨" className="sm" />
      {resultText && (
        <CopyButton getText={() => `${resultText}\n${url()}`} label="결과 복사" copiedLabel="결과 복사됨" className="sm" />
      )}
      <span className="share-hint">링크를 열면 지금 입력값 그대로 다시 계산됩니다</span>
    </div>
  );
}

/* ── 1. 연차 ── */
function AnnualLeave({ basis }) {
  const [hireDate, setHire] = useState('');
  const [baseDate, setBase] = useState('');
  const [method, setMethod] = useState('anniversary');
  const [attendance80, setA80] = useState(true);
  const [monthlyPerfect, setMP] = useState(true);
  const [firstYearPerfectMonths, setPM] = useState(11);
  const [lowMonths, setLM] = useState(0);
  useEffect(() => setBase(todayStr()), []);
  useQueryHydrate((get) => {
    if (get.date('hire')) setHire(get.date('hire'));
    if (get.date('base')) setBase(get.date('base'));
    if (get('method') === 'fiscal' || get('method') === 'anniversary') setMethod(get('method'));
    if (get.bool('a80') !== null) setA80(get.bool('a80'));
    if (get.bool('mp') !== null) setMP(get.bool('mp'));
    if (get.num('pm') !== null) setPM(get.num('pm'));
    if (get.num('low') !== null) setLM(get.num('low'));
  });

  const r = hireDate && baseDate
    ? annualLeave({ hireDate, baseDate, method, attendance80, monthlyPerfect, firstYearPerfectMonths, lowAttendanceMonths: lowMonths || 0 })
    : null;

  const shareParams = { hire: hireDate, base: baseDate, method, a80: attendance80, mp: monthlyPerfect, pm: firstYearPerfectMonths, low: lowMonths };
  const resultText = r && !r.error
    ? [
        `[연차 계산] 입사일 ${hireDate} · 기준일 ${baseDate} · ${method === 'fiscal' ? '회계연도(1/1) 기준' : '입사일 기준'}`,
        `현재 연차연도 부여분 ${r.currentGrant}일 · 1년 미만 월 단위 ${r.monthlyLeave}일 · 누적 발생 ${r.totalAccrued}일 (만 근속 ${r.serviceYears}년 ${r.serviceMonths}개월)`,
        basis ? `근거: ${basis}` : null,
      ].filter(Boolean).join('\n')
    : null;

  return (
    <div className="calc-grid">
      <form className="panel" onSubmit={(e) => e.preventDefault()}>
        <h2>입력</h2>
        <DateF label="입사일" value={hireDate} onChange={setHire} />
        <DateF label="산정 기준일" hint="재직자는 오늘, 퇴직자는 마지막 근무일" value={baseDate} onChange={setBase} />
        <div className="field">
          <label htmlFor="method">산정 방식</label>
          <select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="anniversary">입사일 기준</option>
            <option value="fiscal">회계연도 기준 (1월 1일)</option>
          </select>
        </div>
        <Check label="직전 연 단위 산정기간 출근율 80% 이상" hint="가장 최근에 끝난 산정기간 기준. 그 이전 연도는 80% 이상으로 봅니다" value={attendance80} onChange={setA80} />
        {!attendance80 && (
          <Num label="직전 산정기간의 개근 월수" hint="0~12. 80% 미만인 해는 개근한 달만큼만 발생합니다" value={lowMonths} onChange={setLM} max={12} />
        )}
        <Check label="1년 미만 기간 매월 개근" value={monthlyPerfect} onChange={setMP} />
        {!monthlyPerfect && <Num label="1년 미만 기간 중 개근한 월수" hint="0~11" value={firstYearPerfectMonths} onChange={setPM} max={11} />}
      </form>

      <div className="panel calc-out" aria-live="polite">
        <h2>결과</h2>
        {!r ? (
          <p style={{ color: 'var(--ink3)', fontSize: 13.5 }}>입사일을 입력하면 바로 계산됩니다.</p>
        ) : r.error ? (
          <p className="verdict warn">{r.error}</p>
        ) : (
          <>
            <p className="big">{r.currentGrant}<small>일 (현재 연차연도 부여분)</small></p>
            <Row k="1년 미만 월 단위 연차" v={`${r.monthlyLeave}일`} />
            <Row k="입사 후 누적 발생 (사용분 미차감)" v={`${r.totalAccrued}일`} />
            <Row k="만 근속" v={`${r.serviceYears}년 ${r.serviceMonths}개월`} />
            {r.grants.length > 0 && (
              <details style={{ marginTop: 10, fontSize: 13 }}>
                <summary style={{ cursor: 'pointer', color: 'var(--accent-ink)', fontWeight: 500 }}>부여 이력 {r.grants.length}건 보기</summary>
                {r.grants.map((g, i) => (
                  <Row key={i} k={`${g.dateText} (${g.label})`} v={`${g.days}일`} />
                ))}
              </details>
            )}
            <p className="calc-note">
              상시 5인 미만 사업장에는 연차 유급휴가 규정이 적용되지 않습니다. 회계연도 방식의 비례연차는 일 단위
              올림 부여를 권장하며, 퇴직 정산 시에는 입사일 기준과 비교해 근로자에게 유리한 쪽을 적용해야 합니다.
            </p>
          </>
        )}
        <ShareRow params={shareParams} resultText={resultText} />
      </div>
    </div>
  );
}

/* ── 2. 퇴직금 ── */
function Severance({ basis }) {
  const [hireDate, setHire] = useState('');
  const [leaveDate, setLeave] = useState('');
  const [pay3m, setPay] = useState('');
  const [annualBonus, setBonus] = useState(0);
  const [annualLeavePay, setALP] = useState(0);
  const [dailyOrdinary, setDO] = useState(0);
  const [under15h, setU15] = useState(false);

  useQueryHydrate((get) => {
    if (get.date('hire')) setHire(get.date('hire'));
    if (get.date('leave')) setLeave(get.date('leave'));
    if (get.num('p3') !== null) setPay(get.num('p3'));
    if (get.num('bn') !== null) setBonus(get.num('bn'));
    if (get.num('alp') !== null) setALP(get.num('alp'));
    if (get.num('dor') !== null) setDO(get.num('dor'));
    if (get.bool('u15') !== null) setU15(get.bool('u15'));
  });

  const r = hireDate && leaveDate && pay3m !== ''
    ? severancePay({ hireDate, leaveDate, pay3m: pay3m || 0, annualBonus: annualBonus || 0, annualLeavePay: annualLeavePay || 0, dailyOrdinary: dailyOrdinary || 0, under15h })
    : null;

  const shareParams = { hire: hireDate, leave: leaveDate, p3: pay3m, bn: annualBonus, alp: annualLeavePay, dor: dailyOrdinary, u15: under15h };
  const resultText = r && !r.error
    ? (r.eligible
        ? [
            `[퇴직금 계산] 입사 ${hireDate} ~ 퇴직 ${leaveDate} (재직 ${won(r.days)}일)`,
            `퇴직금 ${won(r.amount)}원 (세전) · 1일 평균임금 ${won(r.avgDaily)}원 · 적용 임금 ${won(r.appliedDaily)}원${r.usedOrdinary ? ' (통상임금 적용)' : ''}`,
            basis ? `근거: ${basis}` : null,
          ].filter(Boolean).join('\n')
        : `[퇴직금 계산] 입사 ${hireDate} ~ 퇴직 ${leaveDate} — 지급 대상 아님: ${r.reason}`)
    : null;

  return (
    <div className="calc-grid">
      <form className="panel" onSubmit={(e) => e.preventDefault()}>
        <h2>입력</h2>
        <DateF label="입사일" value={hireDate} onChange={setHire} />
        <DateF label="퇴직일" hint="마지막 근무일의 다음 날" value={leaveDate} onChange={setLeave} />
        <Num label="퇴직 전 3개월 임금 총액 (원)" hint="세전. 상여·연차수당은 아래 칸에 따로" value={pay3m} onChange={setPay} step={10000} />
        <Num label="퇴직 전 1년간 상여금 총액 (원)" value={annualBonus} onChange={setBonus} step={10000} />
        <Num label="퇴직 전 1년간 연차 미사용수당 (원)" hint="퇴직 전에 이미 지급사유가 발생한 수당만. 퇴직 때문에 비로소 발생하는 미사용수당은 제외" value={annualLeavePay} onChange={setALP} step={10000} />
        <Num label="1일 통상임금 (원, 선택)" hint="입력 시 평균임금과 비교해 큰 금액 적용" value={dailyOrdinary} onChange={setDO} step={1000} />
        <Check label="4주 평균 주 소정근로시간 15시간 미만" hint="실근로가 아니라 근로계약상 소정근로시간 기준" value={under15h} onChange={setU15} />
      </form>

      <div className="panel calc-out" aria-live="polite">
        <h2>결과</h2>
        {!r ? (
          <p style={{ color: 'var(--ink3)', fontSize: 13.5 }}>입사일·퇴직일과 3개월 임금을 입력하면 계산됩니다.</p>
        ) : r.error ? (
          <p className="verdict warn">{r.error}</p>
        ) : !r.eligible ? (
          <p className="verdict warn">{r.reason}</p>
        ) : (
          <>
            <p className="big">{won(r.amount)}<small>원 (세전)</small></p>
            <Row k="재직일수" v={`${won(r.days)}일`} />
            <Row k="평균임금 산정기간" v={`${r.periodStartText} ~ 퇴직 전일 (${r.T}일)`} />
            <Row k="산정기간 임금총액 (상여·연차수당 3/12 가산)" v={`${won(r.W)}원`} />
            <Row k="1일 평균임금" v={`${won(r.avgDaily)}원`} />
            <Row k="적용 임금" v={`${won(r.appliedDaily)}원${r.usedOrdinary ? ' (통상임금 적용)' : ''}`} />
            <p className="calc-note">
              평균임금이 통상임금보다 적으면 통상임금으로 계산해야 하므로, 결근·무급휴직이 있었다면 1일 통상임금을
              함께 입력해 비교하세요. 산정기간 3개월 안에 출산전후휴가·육아휴직·산재 요양 기간이 끼어 있으면 그
              기간과 임금을 빼고 계산해야 하며, 이 계산기는 자동 보정하지 않습니다. 지급은 퇴직일부터 14일 이내,
              원칙적으로 IRP 계좌로 이전합니다.
            </p>
          </>
        )}
        <ShareRow params={shareParams} resultText={resultText} />
      </div>
    </div>
  );
}

/* ── 3. 가산수당 ── */
function Overtime({ basis }) {
  const [monthlyOrdinary, setMO] = useState('');
  const [monthlyHours, setMH] = useState(209);
  const [otHours, setOT] = useState(0);
  const [nightHours, setNH] = useState(0);
  const [holidayHours, setHH] = useState(0);
  const [holidayOverHours, setHO] = useState(0);
  const [under5, setU5] = useState(false);

  useQueryHydrate((get) => {
    if (get.num('mo') !== null) setMO(get.num('mo'));
    if (get.num('mh') !== null) setMH(get.num('mh'));
    if (get.num('ot') !== null) setOT(get.num('ot'));
    if (get.num('nh') !== null) setNH(get.num('nh'));
    if (get.num('hh') !== null) setHH(get.num('hh'));
    if (get.num('ho') !== null) setHO(get.num('ho'));
    if (get.bool('u5') !== null) setU5(get.bool('u5'));
  });

  const r = monthlyOrdinary !== '' && monthlyHours
    ? overtimePay({ monthlyOrdinary: monthlyOrdinary || 0, monthlyHours: monthlyHours || 209, otHours: otHours || 0, nightHours: nightHours || 0, holidayHours: holidayHours || 0, holidayOverHours: holidayOverHours || 0, under5 })
    : null;

  const shareParams = { mo: monthlyOrdinary, mh: monthlyHours, ot: otHours, nh: nightHours, hh: holidayHours, ho: holidayOverHours, u5: under5 };
  const resultText = r && !r.error
    ? [
        `[가산수당 계산] 월 통상임금 ${won(monthlyOrdinary || 0)}원 · 월 소정 ${monthlyHours}시간 (통상시급 ${won(r.R)}원)${under5 ? ' · 5인 미만(가산 없음)' : ''}`,
        `연장 ${otHours || 0}h · 야간 ${nightHours || 0}h · 휴일 ${holidayHours || 0}h+${holidayOverHours || 0}h → 합계 ${won(r.total)}원`,
        basis ? `근거: ${basis}` : null,
      ].filter(Boolean).join('\n')
    : null;

  return (
    <div className="calc-grid">
      <form className="panel" onSubmit={(e) => e.preventDefault()}>
        <h2>입력</h2>
        <Num label="월 통상임금 (원)" hint="기본급 + 매월 정기·일률 지급 수당" value={monthlyOrdinary} onChange={setMO} step={10000} />
        <Num label="월 소정근로시간" hint="주 40시간·주휴 포함 기준 209" value={monthlyHours} onChange={setMH} />
        <Num label="연장근로시간" value={otHours} onChange={setOT} step={0.5} />
        <Num label="야간근로시간 (22시~06시)" hint="연장·휴일과 겹치는 시간도 그대로 — 야간 가산 50%만 별도로 얹힘" value={nightHours} onChange={setNH} step={0.5} />
        <Num label="휴일근로시간 (8시간 이내)" value={holidayHours} onChange={setHH} step={0.5} />
        <Num label="휴일근로시간 (8시간 초과분)" value={holidayOverHours} onChange={setHO} step={0.5} />
        <Check label="상시 5인 미만 사업장" hint="제56조 미적용, 가산 없음" value={under5} onChange={setU5} />
      </form>

      <div className="panel calc-out" aria-live="polite">
        <h2>결과</h2>
        {!r ? (
          <p style={{ color: 'var(--ink3)', fontSize: 13.5 }}>월 통상임금을 입력하면 계산됩니다.</p>
        ) : r.error ? (
          <p className="verdict warn">{r.error}</p>
        ) : (
          <>
            <p className="big">{won(r.total)}<small>원</small></p>
            {r.note && <p className="verdict warn" style={{ fontSize: 13 }}>{r.note}</p>}
            <Row k="통상시급" v={`${won(r.R)}원`} />
            <Row k={under5 ? '연장근로 (100%)' : '연장근로수당 (150%)'} v={`${won(r.otPay)}원`} />
            <Row k={under5 ? '휴일근로 (100%)' : '휴일근로수당 · 8시간 이내 (150%)'} v={`${won(r.holPay)}원`} />
            <Row k={under5 ? '휴일 8시간 초과 (100%)' : '휴일근로수당 · 8시간 초과 (200%)'} v={`${won(r.holOverPay)}원`} />
            <Row k="야간근로 가산 (50%)" v={`${won(r.nightPay)}원`} />
            <Warnings list={r.warnings} />
            <p className="calc-note">
              야간 가산은 겹침과 무관하게 50%만 별도로 얹히므로 평일 연장이면서 야간인 1시간은 200%, 휴일(8시간
              이내)이면서 야간이면 200%로 자동 계산됩니다. 휴일근로에는 연장 가산을 중복하지 않고 8시간 초과분
              100% 가산으로 갈음합니다.
            </p>
          </>
        )}
        <ShareRow params={shareParams} resultText={resultText} />
      </div>
    </div>
  );
}

/* ── 4. 해고예고 ── */
function Dismissal({ basis }) {
  const [noticeDate, setND] = useState('');
  const [dismissalDate, setDD] = useState('');
  const [monthlyOrdinary, setMO] = useState('');
  const [exUnder3m, setE1] = useState(false);
  const [exDisaster, setE2] = useState(false);
  const [exMisconduct, setE3] = useState(false);
  useEffect(() => setND(todayStr()), []);
  useQueryHydrate((get) => {
    if (get.date('nd')) setND(get.date('nd'));
    if (get.date('dd')) setDD(get.date('dd'));
    if (get.num('mo') !== null) setMO(get.num('mo'));
    if (get.bool('e1') !== null) setE1(get.bool('e1'));
    if (get.bool('e2') !== null) setE2(get.bool('e2'));
    if (get.bool('e3') !== null) setE3(get.bool('e3'));
  });

  const anyEx = exUnder3m || exDisaster || exMisconduct;
  const r = anyEx || (noticeDate && dismissalDate && monthlyOrdinary !== '')
    ? dismissalNotice({ noticeDate, dismissalDate, monthlyOrdinary: monthlyOrdinary || 0, exUnder3m, exDisaster, exMisconduct })
    : null;

  const shareParams = { nd: noticeDate, dd: dismissalDate, mo: monthlyOrdinary, e1: exUnder3m, e2: exDisaster, e3: exMisconduct };
  const resultText = r && !r.error
    ? [
        `[해고예고 판정] 통보일 ${noticeDate || '-'} · 해고 예정일 ${dismissalDate || '-'}`,
        !r.duty
          ? `예고 의무 없음 — ${r.note}`
          : r.satisfied
            ? `예고기간 ${r.N}일 — 30일 전 예고 충족 (1일 통상임금 ${won(r.dailyOrdinary)}원)`
            : `예고기간 ${r.N}일 — 30일 미달, 해고예고수당 ${won(r.allowance)}원 (1일 통상임금 ${won(r.dailyOrdinary)}원 × 30일)`,
        basis ? `근거: ${basis}` : null,
      ].filter(Boolean).join('\n')
    : null;

  return (
    <div className="calc-grid">
      <form className="panel" onSubmit={(e) => e.preventDefault()}>
        <h2>입력</h2>
        <DateF label="해고 통보일" value={noticeDate} onChange={setND} />
        <DateF label="해고 예정일" hint="근로관계 종료일" value={dismissalDate} onChange={setDD} />
        <Num label="월 통상임금 (원)" value={monthlyOrdinary} onChange={setMO} step={10000} />
        <p style={{ fontSize: 12.5, color: 'var(--ink3)', margin: '4px 0 8px' }}>예외 사유 (하나라도 해당하면 예고 의무 없음)</p>
        <Check label="계속 근로기간 3개월 미만" value={exUnder3m} onChange={setE1} />
        <Check label="천재·사변 등으로 사업 계속 불가능" value={exDisaster} onChange={setE2} />
        <Check label="근로자가 고의로 막대한 지장·손해 (노동부령 열거 사유)" value={exMisconduct} onChange={setE3} />
      </form>

      <div className="panel calc-out" aria-live="polite">
        <h2>결과</h2>
        {!r ? (
          <p style={{ color: 'var(--ink3)', fontSize: 13.5 }}>통보일·예정일과 월 통상임금을 입력하면 판정합니다.</p>
        ) : r.error ? (
          <p className="verdict warn">{r.error}</p>
        ) : !r.duty ? (
          <>
            <p className="verdict ok">해고예고수당 지급 의무 없음</p>
            <p className="calc-note">{r.note}</p>
          </>
        ) : r.satisfied ? (
          <>
            <p className="verdict ok">예고기간 {r.N}일 — 30일 전 예고 충족</p>
            <Row k="1일 통상임금" v={`${won(r.dailyOrdinary)}원`} />
            <p className="calc-note">{r.note}</p>
          </>
        ) : (
          <>
            <p className="verdict warn">예고기간 {r.N}일 — 30일 미달, 해고예고수당 지급 대상</p>
            <p className="big">{won(r.allowance)}<small>원 (30일분 전액)</small></p>
            <Row k="1일 통상임금" v={`${won(r.dailyOrdinary)}원`} />
            <Row k="예고기간" v={`${r.N}일 (통보 당일 불산입)`} />
            <p className="calc-note">
              {r.note} 해고예고와 별개로 해고의 정당한 이유(제23조)와 서면통지(제27조)가 없으면 부당해고입니다 —
              수당을 지급해도 해고 자체가 적법해지는 것은 아닙니다.
            </p>
          </>
        )}
        <ShareRow params={shareParams} resultText={resultText} />
      </div>
    </div>
  );
}

/* ── 5. 최저임금 ── */
function MinWage({ basis }) {
  const [basePay, setBP] = useState('');
  const [fixedAllowance, setFA] = useState(0);
  const [monthlyBonus, setMB] = useState(0);
  const [welfareCash, setWC] = useState(0);
  const [weeklyHours, setWH] = useState(40);
  const [probation, setPR] = useState(false);
  const [contractUnder1y, setC1] = useState(false);
  const [simpleLabor, setSL] = useState(false);

  useQueryHydrate((get) => {
    if (get.num('bp') !== null) setBP(get.num('bp'));
    if (get.num('fa') !== null) setFA(get.num('fa'));
    if (get.num('mb') !== null) setMB(get.num('mb'));
    if (get.num('wc') !== null) setWC(get.num('wc'));
    if (get.num('wh') !== null) setWH(get.num('wh'));
    if (get.bool('pr') !== null) setPR(get.bool('pr'));
    if (get.bool('c1') !== null) setC1(get.bool('c1'));
    if (get.bool('sl') !== null) setSL(get.bool('sl'));
  });

  const r = basePay !== '' && weeklyHours
    ? minimumWage({ basePay: basePay || 0, fixedAllowance: fixedAllowance || 0, monthlyBonus: monthlyBonus || 0, welfareCash: welfareCash || 0, weeklyHours: weeklyHours || 40, probation, contractUnder1y, simpleLabor })
    : null;

  const shareParams = { bp: basePay, fa: fixedAllowance, mb: monthlyBonus, wc: welfareCash, wh: weeklyHours, pr: probation, c1: contractUnder1y, sl: simpleLabor };
  const resultText = r && !r.error
    ? [
        `[최저임금 점검] 산입 임금 월 ${won(r.M)}원 · 주 ${weeklyHours}시간 (월 환산 ${r.H}시간)`,
        r.pass
          ? `적합 — 환산 시급 ${won(r.hourly)}원 ≥ 기준 ${won(r.standard)}원${r.canReduce ? ' (수습 90% 감액 적용)' : ''}`
          : `미달 — 환산 시급 ${won(r.hourly)}원 < 기준 ${won(r.standard)}원, 월 부족액 ${won(r.shortfall)}원`,
        basis ? `근거: ${basis}` : null,
      ].filter(Boolean).join('\n')
    : null;

  return (
    <div className="calc-grid">
      <form className="panel" onSubmit={(e) => e.preventDefault()}>
        <h2>입력</h2>
        <Num label="월 기본급 (원)" value={basePay} onChange={setBP} step={10000} />
        <Num label="매월 고정수당 합계 (원)" hint="직무·직책수당 등. 연장·야간·휴일수당 제외" value={fixedAllowance} onChange={setFA} step={10000} />
        <Num label="매월 지급 상여금 (원)" hint="격월·분기·연 단위 상여는 산입 불가" value={monthlyBonus} onChange={setMB} step={10000} />
        <Num label="매월 현금성 복리후생비 (원)" hint="식대·교통비 등 현금 지급분. 현물 제외" value={welfareCash} onChange={setWC} step={10000} />
        <Num label="주 소정근로시간" hint="최대 40" value={weeklyHours} onChange={setWH} max={40} />
        <p style={{ fontSize: 12.5, color: 'var(--ink3)', margin: '4px 0 8px' }}>수습 감액 (세 요건을 모두 충족해야 90% 적용)</p>
        <Check label="수습 시작일부터 3개월 이내" value={probation} onChange={setPR} />
        <Check label="근로계약기간 1년 미만" hint="체크하면 감액 불가" value={contractUnder1y} onChange={setC1} />
        <Check label="단순노무 직종" hint="배달원·청소원·경비원 등 — 체크하면 감액 불가" value={simpleLabor} onChange={setSL} />
      </form>

      <div className="panel calc-out" aria-live="polite">
        <h2>결과</h2>
        {!r ? (
          <p style={{ color: 'var(--ink3)', fontSize: 13.5 }}>월 기본급을 입력하면 판정합니다.</p>
        ) : r.error ? (
          <p className="verdict warn">{r.error}</p>
        ) : (
          <>
            {r.pass ? (
              <p className="verdict ok">최저임금 적합 — 환산 시급 {won(r.hourly)}원 ≥ 기준 {won(r.standard)}원</p>
            ) : (
              <p className="verdict warn">최저임금 미달 — 환산 시급 {won(r.hourly)}원 &lt; 기준 {won(r.standard)}원</p>
            )}
            {!r.pass && <p className="big">{won(r.shortfall)}<small>원 / 월 부족액</small></p>}
            <Row k="월 환산 기준시간 (주휴 포함)" v={`${r.H}시간`} />
            <Row k="최저임금 산입 임금 월액" v={`${won(r.M)}원`} />
            <Row k="환산 시급" v={`${won(r.hourly)}원`} />
            <Row k="적용 최저시급" v={`${won(r.standard)}원${r.canReduce ? ' (수습 90% 감액)' : ''}`} />
            <p className="calc-note">
              2026년 최저임금은 시급 {won(MIN_WAGE_2026)}원, 주 40시간 기준 월 2,156,880원입니다. 최저임금에
              미달하는 임금 약정은 근로자가 동의했더라도 그 부분이 무효이고 최저임금액을 지급하기로 한 것으로
              간주됩니다(최저임금법 제6조). 2027년부터는 시급 10,700원이 적용됩니다.
            </p>
          </>
        )}
        <ShareRow params={shareParams} resultText={resultText} />
      </div>
    </div>
  );
}

const CALCS = {
  'annual-leave': AnnualLeave,
  'severance-pay': Severance,
  'overtime-pay': Overtime,
  'dismissal-notice': Dismissal,
  'minimum-wage': MinWage,
};

export default function CalcClient({ calcKey, basis }) {
  const C = CALCS[calcKey];
  if (!C) return null;
  return <C basis={basis} />;
}
