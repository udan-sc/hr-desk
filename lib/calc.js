/* 노무 계산기 산식. UI와 분리된 순수 함수 — data/platform/calculators.json 사양(rule/pseudocode)을
   구현했고, 각 함수는 사양의 worked 예시로 검산된다(scripts/calc.test.mjs). */

/* ── 날짜 유틸: 'YYYY-MM-DD' → UTC 정오 기준으로 다뤄 시간대 문제를 피한다 ── */
export const parseD = (s) => {
  const [y, m, d] = String(s).split('-').map(Number);
  return Date.UTC(y, m - 1, d, 12);
};
const D = 24 * 60 * 60 * 1000;
export const diffDays = (a, b) => Math.round((b - a) / D);
const ymd = (t) => {
  const x = new Date(t);
  return [x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()];
};
const lastDay = (y, m) => new Date(Date.UTC(y, m + 1, 0, 12)).getUTCDate();
/* 응당일이 없으면 그 달 말일로 보정 (1/31 + 1개월 = 2/28·29) */
export const addMonths = (t, n) => {
  const [y, m, d] = ymd(t);
  const ny = y + Math.floor((m + n) / 12);
  const nm = ((m + n) % 12 + 12) % 12;
  return Date.UTC(ny, nm, Math.min(d, lastDay(ny, nm)), 12);
};
export const addYears = (t, n) => addMonths(t, n * 12);
/* addMonths(a,k) <= b 를 만족하는 최대 k */
export const fullMonths = (a, b) => {
  if (b < a) return 0;
  let k = Math.max(0, Math.floor(diffDays(a, b) / 31));
  while (addMonths(a, k + 1) <= b) k++;
  while (k > 0 && addMonths(a, k) > b) k--;
  return k;
};
export const fullYears = (a, b) => Math.floor(fullMonths(a, b) / 12);
export const fmtDate = (t) => {
  const [y, m, d] = ymd(t);
  return `${y}. ${m + 1}. ${d}.`;
};

const round2 = (x) => Math.round(x * 100) / 100;
export const MIN_WAGE_2026 = 10320;

/* ── 1. 연차 유급휴가 (근로기준법 제60조) ── */
export function annualLeave({ hireDate, baseDate, method, attendance80, monthlyPerfect, firstYearPerfectMonths = 11, lowAttendanceMonths = 0 }) {
  const hire = parseD(hireDate);
  const base = parseD(baseDate);
  if (!(base >= hire)) return { error: '산정 기준일이 입사일보다 빠릅니다.' };

  const M = fullMonths(hire, base);
  const capMonthly = Math.min(11, M);
  const monthlyLeave = monthlyPerfect ? capMonthly : Math.max(0, Math.min(capMonthly, firstYearPerfectMonths));
  const baseGrant = (n) => Math.min(25, 15 + Math.floor((n - 1) / 2));

  const grants = [];
  if (method === 'fiscal') {
    /* 회계연도(1/1) 방식: 첫 1/1은 비례연차, 이후 매년 1/1에 근속연수 기준 부여 */
    const [hy] = ymd(hire);
    let fy = Date.UTC(hy + 1, 0, 1, 12);
    let first = true;
    while (fy <= base) {
      if (first) {
        const prevDays = diffDays(hire, fy); /* 입사일~12/31 (양끝 포함) */
        grants.push({ date: fy, days: round2((15 * prevDays) / 365), label: `비례연차 (전년도 재직 ${prevDays}일)`, proportional: true });
        first = false;
      } else {
        const y = fullYears(hire, fy);
        grants.push({ date: fy, days: y >= 1 ? baseGrant(y) : 0, label: y >= 1 ? `만 ${y}년` : '만 1년 미만' });
      }
      fy = addYears(fy, 1);
    }
  } else {
    /* 입사일 방식: n주년 응당일(baseDate 당일 포함)에 발생 */
    for (let n = 1; addYears(hire, n) <= base; n++) {
      grants.push({ date: addYears(hire, n), days: baseGrant(n), label: `만 ${n}년` });
    }
  }

  /* 출근율 80% 미만은 '가장 최근에 끝난 연 단위 산정기간' 하나에만 적용한다.
     과거 연도까지 소급 적용하면 누적 발생이 과소 계산된다. 비례연차에는 적용하지 않는다. */
  const last = grants[grants.length - 1];
  if (!attendance80 && last && !last.proportional) {
    last.days = Math.max(0, Math.min(12, lowAttendanceMonths));
    last.label += ' · 출근율 80% 미만';
  }

  const currentGrant = grants.length ? grants[grants.length - 1].days : monthlyLeave;
  const totalAccrued = round2(monthlyLeave + grants.reduce((s, g) => s + g.days, 0));
  return {
    monthlyLeave,
    currentGrant,
    totalAccrued,
    serviceYears: fullYears(hire, base),
    serviceMonths: M % 12,
    grants: grants.map((g) => ({ ...g, dateText: fmtDate(g.date) })),
  };
}

/* ── 2. 퇴직금 (퇴직급여법 제8조) ── */
export function severancePay({ hireDate, leaveDate, pay3m, annualBonus = 0, annualLeavePay = 0, dailyOrdinary = 0, under15h = false }) {
  const hire = parseD(hireDate);
  const leave = parseD(leaveDate);
  const days = diffDays(hire, leave);
  if (days <= 0) return { error: '퇴직일이 입사일보다 빠릅니다.' };
  if (under15h) return { eligible: false, reason: '4주 평균 주 소정근로시간 15시간 미만(초단시간) 근로자는 퇴직급여 적용 제외입니다.', days };
  /* 만 1년은 역법으로 판단한다. 재직기간에 2월 29일이 끼면 만 1년이 366일이므로
     days >= 365로 보면 하루 이르게 지급 대상이 된다. */
  if (leave < addYears(hire, 1)) {
    return { eligible: false, reason: `계속근로기간이 ${days}일로 만 1년에 못 미쳐 퇴직금이 발생하지 않습니다.`, days };
  }

  const periodStart = addMonths(leave, -3);
  const T = diffDays(periodStart, leave); /* 89~92일 — 90일로 고정하면 안 된다 */
  const W = pay3m + (annualBonus * 3) / 12 + (annualLeavePay * 3) / 12;
  const avg = W / T;
  const applied = dailyOrdinary > avg ? dailyOrdinary : avg;
  const amount = Math.ceil((applied * 30 * days) / 365);
  return {
    eligible: true,
    days,
    periodStartText: fmtDate(periodStart),
    T,
    W: Math.round(W),
    avgDaily: round2(avg),
    appliedDaily: round2(applied),
    usedOrdinary: dailyOrdinary > avg,
    amount,
  };
}

/* ── 3. 연장·야간·휴일 가산수당 (근로기준법 제56조) ── */
export function overtimePay({ monthlyOrdinary, monthlyHours = 209, otHours = 0, nightHours = 0, holidayHours = 0, holidayOverHours = 0, under5 = false }) {
  if (!monthlyHours) return { error: '월 소정근로시간을 입력하세요.' };
  const R = monthlyOrdinary / monthlyHours;
  const warnings = [];
  if (R < MIN_WAGE_2026) warnings.push(`통상시급 ${round2(R).toLocaleString()}원이 2026년 최저임금(10,320원)에 미달할 소지가 있습니다.`);

  let otPay, holPay, holOverPay, nightPay, note;
  if (under5) {
    otPay = R * otHours;
    holPay = R * holidayHours;
    holOverPay = R * holidayOverHours;
    nightPay = 0;
    note = '상시 5인 미만 사업장은 제56조가 적용되지 않아 가산 없이 실근로 100%만 지급합니다. 연장근로 한도(제53조)도 적용되지 않습니다.';
  } else {
    otPay = R * otHours * 1.5;
    holPay = R * holidayHours * 1.5;
    holOverPay = R * holidayOverHours * 2.0;
    nightPay = R * nightHours * 0.5; /* 가산분만 — 실근로 100%는 다른 항목에서 계산됨 */
    note = null;
    /* 한도 판단은 1주 총근로 40시간 초과분 기준이고(대법원 2020도15393),
       입력된 연장시간에는 1일 8시간 초과분이 섞일 수 있어 확정이 아닌 '소지'로만 알린다. */
    if (otHours > 12 * 4.345) {
      warnings.push('연장근로가 주 평균 12시간을 넘습니다 — 제53조 한도 초과 소지가 있으며, 수당을 지급해도 한도 위반은 해소되지 않습니다. 한도는 1주 총근로 40시간 초과분으로 판단하므로(대법원 2020도15393) 1일 8시간 초과분이 포함된 입력이면 실제로는 한도 내일 수 있습니다.');
    }
  }
  const total = Math.ceil(otPay + holPay + holOverPay + nightPay);
  return { R: round2(R), otPay: Math.round(otPay), holPay: Math.round(holPay), holOverPay: Math.round(holOverPay), nightPay: Math.round(nightPay), total, warnings, note };
}

/* ── 4. 해고예고수당 (근로기준법 제26조) ── */
export function dismissalNotice({ noticeDate, dismissalDate, monthlyOrdinary, exUnder3m = false, exDisaster = false, exMisconduct = false }) {
  if (exUnder3m || exDisaster || exMisconduct) {
    return {
      duty: false,
      allowance: 0,
      note: '해고예고 의무가 없습니다(제26조 단서). 다만 예외③은 고용노동부령에 한정 열거된 사유만 해당하며, 단순 근무태만·성과부진은 해당하지 않습니다. 해고예고가 면제되어도 해고의 정당한 이유(제23조)와 서면통지(제27조)는 그대로 필요합니다.',
    };
  }
  const N = diffDays(parseD(noticeDate), parseD(dismissalDate));
  if (N < 0) return { error: '해고 예정일이 통보일보다 빠릅니다.' };
  const daily = (monthlyOrdinary / 209) * 8;
  if (N >= 30) {
    return { duty: true, satisfied: true, N, dailyOrdinary: round2(daily), allowance: 0, note: '30일 전 예고를 충족했습니다. 기간 계산 다툼을 피하려면 31일 이상 여유를 권장합니다.' };
  }
  return {
    duty: true,
    satisfied: false,
    N,
    dailyOrdinary: round2(daily),
    allowance: Math.ceil(daily * 30),
    note: '예고기간이 30일에 미달하면 부족 일수만큼이 아니라 30일분 통상임금 전액을 해고와 동시에 지급해야 합니다.',
  };
}

/* ── 5. 최저임금 미달 점검 (최저임금법 제5조·제6조) ── */
export function minimumWage({ basePay, fixedAllowance = 0, monthlyBonus = 0, welfareCash = 0, weeklyHours = 40, probation = false, contractUnder1y = false, simpleLabor = false }) {
  if (!weeklyHours) return { error: '주 소정근로시간을 입력하세요.' };
  const weeklyPaid = weeklyHours >= 15 ? weeklyHours + (weeklyHours * 8) / 40 : weeklyHours;
  const H = Math.round((weeklyPaid * 365) / 7 / 12);
  const M = basePay + fixedAllowance + monthlyBonus + welfareCash;
  const hourly = M / H;
  const canReduce = probation && !contractUnder1y && !simpleLabor;
  const standard = canReduce ? MIN_WAGE_2026 * 0.9 : MIN_WAGE_2026;
  const pass = hourly >= standard;
  return {
    H,
    M,
    hourly: round2(hourly),
    standard,
    canReduce,
    pass,
    shortfall: pass ? 0 : Math.ceil(standard * H - M),
    weeklyPaidHours: round2(weeklyPaid),
  };
}
