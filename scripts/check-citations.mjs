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
const qaIds = new Set();
for (const q of read('data/platform/qa.json')) {
  if (qaIds.has(q.id)) dead.push(`qa: 번호 중복 ${q.id}`);
  qaIds.add(q.id);
  if (!q.provisions?.length) dead.push(`qa ${q.id}: 근거 조문 없음`);
  checkRefs(`qa ${q.id}`, q);
}
for (const w of read('data/platform/wizards.json')) {
  for (const [id, r] of Object.entries(w.results || {})) checkRefs(`wizards ${w.key}/${id}`, r);
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

console.log(`인용 ${total}건 검사`);
if (dead.length) {
  console.log(`조문 데이터에 없는 인용 ${dead.length}건:`);
  dead.forEach((d) => console.log('  ' + d));
  process.exit(1);
}
console.log('모든 인용이 조문 데이터와 연결됩니다.');
