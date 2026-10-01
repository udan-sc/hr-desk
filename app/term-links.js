import Link from 'next/link';
import { glossaryById, termMatcher } from '../lib/platform';

/* 본문 속 용어를 용어 사전으로 잇는다. 같은 용어는 문단마다 첫 등장만 링크해
   줄마다 밑줄이 깔리지 않게 한다. 마우스를 올리면 한 줄 요약이 뜬다. */
export default function TermLinks({ text }) {
  const str = String(text || '');
  if (!termMatcher.source) return str;
  const re = new RegExp(termMatcher.source, 'g');
  const seen = new Set();
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(str))) {
    const id = termMatcher.idOf[m[0]];
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const g = glossaryById.get(id);
    out.push(str.slice(last, m.index));
    /* 툴팁은 ::after가 아니라 실제 자식 요소로 둔다 — 생성 콘텐츠는 링크의 접근 가능한
       이름에 섞여 스크린리더가 조문 한가운데서 요약문을 읽어 버린다. */
    out.push(
      <Link key={m.index} className="term" href={`/terms#${id}`}>
        {m[0]}
        <span className="tip" aria-hidden="true">{g?.plain || g?.term || ''}</span>
      </Link>
    );
    last = m.index + m[0].length;
  }
  out.push(str.slice(last));
  return <>{out}</>;
}
