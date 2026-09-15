/* 계산기 산식을 사양(calculators.json)의 worked 예시로 검산한다. pnpm build 전에 수동 실행. */
import { annualLeave, severancePay, overtimePay, dismissalNotice, minimumWage } from '../lib/calc.js';

let fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + ' | got=' + JSON.stringify(got) + ' want=' + JSON.stringify(want));
  if (!ok) fail++;
};

// 1. 연차: 입사 2023-07-01, 기준 2026-09-14 → 월차 11, 현재 부여 16, 누적 57, 만 3년
const a = annualLeave({ hireDate: '2023-07-01', baseDate: '2026-09-14', method: 'anniversary', attendance80: true, monthlyPerfect: true });
eq('연차 월차', a.monthlyLeave, 11);
eq('연차 현재부여', a.currentGrant, 16);
eq('연차 누적', a.totalAccrued, 57);
eq('연차 근속', a.serviceYears, 3);
// 경계: 딱 365일(1주년 전날) → 15일 미발생, 366일째(응당일) → 발생
eq('연차 365일', annualLeave({ hireDate: '2025-01-01', baseDate: '2025-12-31', method: 'anniversary', attendance80: true, monthlyPerfect: true }).totalAccrued, 11);
eq('연차 366일', annualLeave({ hireDate: '2025-01-01', baseDate: '2026-01-01', method: 'anniversary', attendance80: true, monthlyPerfect: true }).totalAccrued, 26);
// 회계연도: 2025-07-02 입사, 2026-01-01 비례 = 15×183/365 = 7.52
const f = annualLeave({ hireDate: '2025-07-02', baseDate: '2026-01-02', method: 'fiscal', attendance80: true, monthlyPerfect: true });
eq('회계연도 비례', f.grants[0].days, 7.52);
// 21년 이상 상한 25
eq('연차 상한', annualLeave({ hireDate: '2000-01-01', baseDate: '2026-01-02', method: 'anniversary', attendance80: true, monthlyPerfect: true }).currentGrant, 25);

// 2. 퇴직금: 입사 2023-09-15, 퇴직 2026-09-15, 3개월 900만+연상여 240만 → 9,399,881원
const s = severancePay({ hireDate: '2023-09-15', leaveDate: '2026-09-15', pay3m: 9000000, annualBonus: 2400000 });
eq('퇴직금 재직일수', s.days, 1096);
eq('퇴직금 산정일수', s.T, 92);
eq('퇴직금 평균임금', s.avgDaily, 104347.83);
eq('퇴직금 금액', s.amount, 9399881);
eq('퇴직금 1년미만', severancePay({ hireDate: '2026-01-01', leaveDate: '2026-12-31', pay3m: 9000000 }).eligible, false);
eq('퇴직금 딱365일', severancePay({ hireDate: '2026-01-01', leaveDate: '2027-01-01', pay3m: 9000000 }).eligible, true);

// 3. 가산수당: 통상임금 270만/209h, 연장10(야간겹침4), 휴일8 → 합계 374,642
const o = overtimePay({ monthlyOrdinary: 2700000, monthlyHours: 209, otHours: 10, nightHours: 4, holidayHours: 8 });
eq('가산 시급', o.R, 12918.66);
eq('가산 합계', o.total, 374642);
const o5 = overtimePay({ monthlyOrdinary: 2700000, monthlyHours: 209, otHours: 10, nightHours: 4, holidayHours: 8, under5: true });
eq('가산 5인미만', o5.total, Math.ceil((2700000 / 209) * 18));

// 4. 해고예고: 통보 9/14, 예정 9/30, 월 300만 → 16일, 3,444,977원
const d = dismissalNotice({ noticeDate: '2026-09-14', dismissalDate: '2026-09-30', monthlyOrdinary: 3000000 });
eq('해고예고 일수', d.N, 16);
eq('해고예고 수당', d.allowance, 3444977);
eq('해고예고 30일충족', dismissalNotice({ noticeDate: '2026-09-01', dismissalDate: '2026-10-01', monthlyOrdinary: 3000000 }).allowance, 0);

// 5. 최저임금: 기본 200만+식대 10만, 주40h → 미달, 부족 56,880원
const m = minimumWage({ basePay: 2000000, welfareCash: 100000, weeklyHours: 40 });
eq('최저 H', m.H, 209);
eq('최저 시급', m.hourly, 10047.85);
eq('최저 판정', m.pass, false);
eq('최저 부족액', m.shortfall, 56880);
const mp = minimumWage({ basePay: 2000000, welfareCash: 100000, weeklyHours: 40, probation: true });
eq('최저 수습감액', mp.pass, true);
eq('최저 수습기준', mp.standard, 9288);
// 초단시간: 주휴 없음
eq('최저 초단시간H', minimumWage({ basePay: 500000, weeklyHours: 12 }).H, Math.round((12 * 365) / 7 / 12));


// --- 검증 워크플로 지적 반영분 ---
// A. 출근율 80% 미만은 '직전' 산정기간 하나에만 적용 (과거 연도 소급 금지)
const low = annualLeave({ hireDate: '2023-07-01', baseDate: '2026-09-14', method: 'anniversary', attendance80: false, monthlyPerfect: true, lowAttendanceMonths: 3 });
eq('80%미만 직전연도만', low.grants.map(g => g.days), [15, 15, 3]);
eq('80%미만 누적', low.totalAccrued, 11 + 15 + 15 + 3);
eq('80%미만 현재부여', low.currentGrant, 3);
// 회계연도의 비례연차에는 80% 토글을 적용하지 않는다
const lowFiscal = annualLeave({ hireDate: '2025-07-02', baseDate: '2025-12-31', method: 'fiscal', attendance80: false, monthlyPerfect: true, lowAttendanceMonths: 2 });
eq('비례연차 80%무관', lowFiscal.grants.length, 0);
// 1년 미만 개근 월수 직접 입력은 경과 개월수로 상한
eq('월차 상한', annualLeave({ hireDate: '2026-06-01', baseDate: '2026-09-14', method: 'anniversary', attendance80: true, monthlyPerfect: false, firstYearPerfectMonths: 11 }).monthlyLeave, 3);

// B. 만 1년은 역법 기준 — 윤년(2024-02-29)이 낀 구간은 365일로도 만 1년 미달
eq('퇴직금 윤년365일', severancePay({ hireDate: '2023-12-31', leaveDate: '2024-12-30', pay3m: 9000000 }).eligible, false);
eq('퇴직금 윤년366일', severancePay({ hireDate: '2023-12-31', leaveDate: '2024-12-31', pay3m: 9000000 }).eligible, true);

// C. 5인 미만은 연장 한도 경고를 내지 않는다
eq('5인미만 한도경고없음', overtimePay({ monthlyOrdinary: 2700000, otHours: 80, under5: true }).warnings.length, 0);
eq('5인이상 한도경고', overtimePay({ monthlyOrdinary: 2700000, otHours: 80 }).warnings.length, 1);

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} FAILED`);
process.exit(fail ? 1 : 0);
