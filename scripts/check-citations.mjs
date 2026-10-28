/* 모듈 데이터의 (law, article) 인용이 조문 데이터에 실재하는지 확인한다. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const known = new Set(read('data/provisions.json').flatMap((a) => a.provisions.map((p) => `${p.law}|${p.article}`)));
let total = 0;
const dead = [];

for (const file of ['calculators', 'processes', 'calendar', 'documents', 'glossary', 'changes', 'precedents', 'qa', 'wizards']) {
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === 'object') {
      if (node.law && node.article && Object.keys(node).length <= 2) {
        total++;
        if (!known.has(`${node.law}|${node.article}`)) dead.push(`${file}: ${node.law} ${node.article}`);
        return;
      }
      Object.values(node).forEach(walk);
    }
  };
  walk(read(`data/platform/${file}.json`));
}

/* 조문의 적용 규모 정합성: 5명 미만에도 적용되면 시작 인원 1, 아니면 5 이상의 정해진 문턱 */
const TIERS = [1, 5, 10, 20, 30, 50, 100, 300, 500];
for (const p of read('data/provisions.json').flatMap((a) => a.provisions)) {
  total++;
  if (!TIERS.includes(p.threshold)) dead.push(`provisions: ${p.law} ${p.article} 적용 인원 ${p.threshold}이 정해진 문턱이 아님`);
  else if (p.appliesUnder5 ? p.threshold !== 1 : p.threshold < 5)
    dead.push(`provisions: ${p.law} ${p.article} 5명 미만 적용(${p.appliesUnder5})과 적용 인원(${p.threshold})이 어긋남`);
}

/* 실무 Q&A·판정 도우미의 판례·행정해석·용어·계산기 인용과 판정 흐름 연결 */
const caseNos = new Set(read('data/platform/precedents.json').map((p) => p.caseNo));
const interpKeys = new Set(
  read('data/platform/interpretations.json').flatMap((g) => g.interpretations.map((i) => `${g.law}|${g.article}|${i.docNumber}`))
);
const termIds = new Set(read('data/platform/glossary.json').map((g) => g.id));
const calcKeys = new Set(read('data/platform/calculators.json').map((c) => c.key));
const checkRefs = (where, x) => {
  for (const no of x.precedents || []) {
    total++;
    if (!caseNos.has(no)) dead.push(`${where}: 판례 ${no}`);
  }
  for (const it of x.interpretations || []) {
    total++;
    if (!interpKeys.has(`${it.law}|${it.article}|${it.docNumber}`)) dead.push(`${where}: 행정해석 ${it.law} ${it.article} ${it.docNumber}`);
  }
  for (const id of x.terms || []) {
    total++;
    if (!termIds.has(id)) dead.push(`${where}: 용어 ${id}`);
  }
  if (x.calc) {
    total++;
    if (!calcKeys.has(x.calc)) dead.push(`${where}: 계산기 ${x.calc}`);
  }
};
/* '바로 하기' 연결(tools) — 가리키는 절차·판정·계산기·서식·일정·Q&A가 실제로 있어야 한다 */
const toolKeys = {
  process: new Set(read('data/platform/processes.json').map((p) => p.slug)),
  check: new Set(read('data/platform/wizards.json').map((w) => w.key)),
  calc: calcKeys,
  docs: new Set(read('data/platform/documents.json').map((d) => d.name)),
  calendar: new Set(read('data/platform/calendar.json').map((o) => o.title)),
  qa: new Set(read('data/platform/qa.json').map((q) => q.id)),
};
const checkTools = (where, tools) => {
  if (!tools) return;
  for (const [kind, list] of Object.entries(tools)) {
    if (!toolKeys[kind]) {
      dead.push(`${where}: 바로 하기 종류 ${kind}`);
      continue;
    }
    for (const v of list) {
      total++;
      if (!toolKeys[kind].has(v)) dead.push(`${where}: 바로 하기 ${kind} ${v}`);
    }
  }
};
for (const p of read('data/platform/processes.json')) (p.steps || []).forEach((s, i) => checkTools(`processes ${p.slug}/${i + 1}단계`, s.tools));
for (const o of read('data/platform/calendar.json')) checkTools(`calendar ${o.title}`, o.tools);
for (const d of read('data/platform/documents.json')) checkTools(`documents ${d.name}`, d.tools);

/* Q&A의 5명 미만 표시(under5) — 모양과, 근거 조문의 적용 규모와 정면으로 어긋나지 않는지 */
const thresholdOf = new Map(read('data/provisions.json').flatMap((a) => a.provisions.map((p) => [`${p.law}|${p.article}`, p.threshold || (p.appliesUnder5 ? 1 : 5)])));
const checkUnder5 = (where, q) => {
  const u = q.under5;
  if (!u) return;
  if (!['same', 'partial', 'none'].includes(u.status)) return dead.push(`${where}: under5 상태 ${u.status}`);
  if (u.status !== 'same' && !String(u.note || '').trim()) dead.push(`${where}: under5 설명 없음`);
  const ts = (q.provisions || []).map((c) => thresholdOf.get(`${c.law}|${c.article}`)).filter(Boolean);
  if (u.status === 'none' && ts.length && ts.every((t) => t <= 1)) dead.push(`${where}: 5명 미만 '해당 없음'인데 근거 조문이 모두 규모 무관`);
  if (u.status === 'same' && ts.length && ts.every((t) => t >= 5)) dead.push(`${where}: 5명 미만 '같음'인데 근거 조문이 모두 5명 이상 적용`);
};

const qaIds = new Set();
for (const q of read('data/platform/qa.json')) {
  if (qaIds.has(q.id)) dead.push(`qa: 번호 중복 ${q.id}`);
  qaIds.add(q.id);
  if (!q.provisions?.length) dead.push(`qa ${q.id}: 근거 조문 없음`);
  checkRefs(`qa ${q.id}`, q);
  checkTools(`qa ${q.id}`, q.tools);
  checkUnder5(`qa ${q.id}`, q);
}
for (const w of read('data/platform/wizards.json')) {
  for (const [id, r] of Object.entries(w.results || {})) {
    checkRefs(`wizards ${w.key}/${id}`, r);
    checkTools(`wizards ${w.key}/${id}`, r.tools);
  }
  if (!w.start) continue;
  /* 모든 선택지가 실재하는 다음 질문이나 결과로 이어지고, 첫 질문에서 모든 질문·결과에 닿으며, 되돌아오는 고리가 없어야 한다 */
  const seen = new Set();
  const used = new Set();
  const visit = (id, trail) => {
    const node = w.nodes[id];
    if (!node) return dead.push(`wizards ${w.key}: 없는 질문 ${id}`);
    if (trail.includes(id)) return dead.push(`wizards ${w.key}: 고리 ${[...trail, id].join('→')}`);
    seen.add(id);
    for (const o of node.options) {
      if (Boolean(o.next) === Boolean(o.result)) dead.push(`wizards ${w.key}/${id}: 선택지 "${o.label}"의 다음이 하나가 아님`);
      if (o.result) {
        used.add(o.result);
        if (!w.results[o.result]) dead.push(`wizards ${w.key}/${id}: 없는 결과 ${o.result}`);
      } else if (o.next) visit(o.next, [...trail, id]);
    }
  };
  visit(w.start, []);
  for (const id of Object.keys(w.nodes)) if (!seen.has(id)) dead.push(`wizards ${w.key}: 닿지 않는 질문 ${id}`);
  for (const id of Object.keys(w.results)) if (!used.has(id)) dead.push(`wizards ${w.key}: 쓰이지 않는 결과 ${id}`);
}

/* 조문 화면은 해설 표시(※ 등)로 '조문 내용'과 '실무 해설'을 나눈다 — 표시가 없는 조문은 해설이 원문 요약 칸에 섞일 수 있어 알려만 준다
   (위임 내용만 요약해 해설이 없는 조문도 있으므로 빌드를 멈추지는 않음). 표시 목록은 lib/data.js NOTE_MARK와 같게 유지 */
const NOTE_RE = /※|▷|▶|실무 ?포인트|\[개정 (?:예고|시행 예정)\]|\[\d{4}\.\s?\d{1,2}\.\s?\d{1,2}\.? ?시행\]/;
const unmarked = read('data/provisions.json')
  .flatMap((a) => a.provisions)
  .filter((p) => !NOTE_RE.test(p.text))
  .map((p) => `${p.law} ${p.article}`);
if (unmarked.length) console.warn(`참고: 해설 표시(※ 등)가 없는 조문 ${unmarked.length}개 — ${unmarked.join(', ')}`);

console.log(`인용 ${total}건 검사`);
if (dead.length) {
  console.log(`조문 데이터에 없는 인용 ${dead.length}건:`);
  dead.forEach((d) => console.log('  ' + d));
  process.exit(1);
}
console.log('모든 인용이 조문 데이터와 연결됩니다.');
