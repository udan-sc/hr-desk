/* 모듈 데이터의 (law, article) 인용이 조문 데이터에 실재하는지 확인한다. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));

const known = new Set(read('data/provisions.json').flatMap((a) => a.provisions.map((p) => `${p.law}|${p.article}`)));
let total = 0;
const dead = [];

for (const file of ['calculators', 'processes', 'calendar', 'documents']) {
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

console.log(`인용 ${total}건 검사`);
if (dead.length) {
  console.log(`조문 데이터에 없는 인용 ${dead.length}건:`);
  dead.forEach((d) => console.log('  ' + d));
  process.exit(1);
}
console.log('모든 인용이 조문 데이터와 연결됩니다.');
