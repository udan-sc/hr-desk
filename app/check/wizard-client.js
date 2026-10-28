'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import CopyButton from '../copy-button';
import { SITE_URL } from '../../lib/site';

const TONE_LABEL = { yes: '해당', no: '해당 없음', caution: '따져 볼 것' };

/* 판정 흐름 — 답은 선택지 번호 배열(?a=0.1.0)로 주소에 남아 그대로 공유된다 */
function walk(w, answers) {
  const steps = [];
  let nodeId = w.start;
  for (const a of answers) {
    const node = w.nodes[nodeId];
    const opt = node?.options[a];
    if (!opt) break;
    steps.push({ nodeId, node, opt, a });
    if (opt.result) return { steps, result: w.results[opt.result] || null, resultId: opt.result, nodeId: null };
    nodeId = opt.next;
  }
  return { steps, result: null, resultId: null, nodeId };
}

/* onResult: 결론이 나거나 사라질 때 결과 id를 알린다(상시 근로자 수 계산기가 쓴다) */
export default function WizardClient({ w, onResult }) {
  const [answers, setAnswers] = useState([]);
  const [ready, setReady] = useState(false);
  const qRef = useRef(null);

  useEffect(() => {
    const a = new URLSearchParams(window.location.search).get('a');
    if (a && /^\d+(\.\d+){0,20}$/.test(a)) {
      /* 실제로 걸어간 답만 남긴다 — 결과 뒤에 붙은 군더더기나 없는 선택지는 버리고 주소도 정리 */
      const valid = walk(w, a.split('.').map(Number)).steps.map((s) => s.a);
      setAnswers(valid);
      const sp = new URLSearchParams(window.location.search);
      if (valid.length) sp.set('a', valid.join('.'));
      else sp.delete('a');
      const qs = sp.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    }
    setReady(true);
  }, [w]);

  const { steps, result, resultId, nodeId } = useMemo(() => walk(w, answers), [w, answers]);
  const node = nodeId ? w.nodes[nodeId] : null;
  useEffect(() => {
    onResult?.(resultId);
  }, [resultId, onResult]);

  const set = (next, focus = true) => {
    setAnswers(next);
    const sp = new URLSearchParams(window.location.search);
    if (next.length) sp.set('a', next.join('.'));
    else sp.delete('a');
    const qs = sp.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
    if (focus) requestAnimationFrame(() => qRef.current?.focus());
  };

  /* 공유 주소는 누를 때의 주소창 그대로 — 같은 화면의 계산기 입력(p·d·n·u)도 함께 실린다 */
  const shareUrl = () => `${SITE_URL}/check/${w.key}/${window.location.search}`;
  const resultText = () =>
    [
      `[판정 도우미] ${w.title}`,
      ...steps.map((s) => `- ${s.node.q} → ${s.opt.label}`),
      `결과: ${result.verdict}`,
      result.detail,
      result.caveat ? `※ ${result.caveat}` : '',
      result.provisions.length ? `근거: ${result.provisions.map((p) => p.label).join(', ')}` : '',
      `확인: ${shareUrl()}`,
    ]
      .filter(Boolean)
      .join('\n');

  return (
    <div className={`wz${steps.length ? '' : ' wz-blank'}`} aria-busy={!ready || undefined}>
      {steps.length > 0 && (
        <ol className="wz-trail" aria-label="지금까지 답한 것">
          {steps.map((s, i) => (
            <li key={i}>
              <span className="wz-tq">{s.node.q}</span>
              <span className="wz-ta">{s.opt.label}</span>
              <button type="button" className="wz-edit" onClick={() => set(answers.slice(0, i))}>
                고치기<span className="vh"> — {s.node.q} (지금 답: {s.opt.label})</span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {node && (
        <section className="wz-card" aria-labelledby="wz-q">
          <div className="wz-step">질문 {steps.length + 1}</div>
          <h2 id="wz-q" className="wz-q" tabIndex={-1} ref={qRef}>
            {node.q}
          </h2>
          {node.help && <p className="wz-help">{node.help}</p>}
          <div className="wz-opts">
            {node.options.map((o, i) => (
              <button key={i} type="button" className="wz-opt" onClick={() => set([...answers, i])}>
                {o.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {result && (
        <section className={`wz-card wz-result tone-${result.tone}`} aria-labelledby="wz-r">
          <div className="wz-step">판정 결과 · {TONE_LABEL[result.tone] || '결과'}</div>
          {/* 결과 카드가 화면보다 길어도 결론 제목이 보이도록 제목에 포커스한다 */}
          <h2 id="wz-r" className="wz-verdict" tabIndex={-1} ref={qRef}>
            {result.verdict}
          </h2>
          <p className="wz-detail">{result.detail}</p>
          {result.caveat && (
            <p className="qa-cav">
              <b>주의</b>
              {result.caveat}
            </p>
          )}
          <dl className="qa-refs">
            {result.provisions.length > 0 && (
              <>
                <dt>근거 조문</dt>
                <dd>
                  {result.provisions.map((p) => (
                    <Link key={p.href} className="tag" href={p.href} title={p.title}>
                      {p.label}
                    </Link>
                  ))}
                </dd>
              </>
            )}
            {result.precedents.length > 0 && (
              <>
                <dt>판례</dt>
                <dd>
                  {result.precedents.map((p) => (
                    <Link key={p.href} className="tag" href={p.href} title={p.note}>
                      {p.label}
                    </Link>
                  ))}
                </dd>
              </>
            )}
            {(result.calc || result.tools?.length > 0) && (
              <>
                <dt>다음 단계</dt>
                <dd>
                  {result.calc && (
                    <Link className="tag tag-calc" href={result.calc.href}>
                      {result.calc.label}로 계산하기 →
                    </Link>
                  )}
                  {result.tools?.map((t) => (
                    <Link key={t.href} className="tag tag-calc" href={t.href}>
                      {t.label} →
                    </Link>
                  ))}
                </dd>
              </>
            )}
          </dl>
          <div className="qa-foot">
            <CopyButton getText={resultText} label="판정 결과 복사" className="sm" />
            <CopyButton getText={shareUrl} label="결과 링크 복사" className="sm" />
          </div>
        </section>
      )}

      {steps.length > 0 && (
        <div className="wz-ctrl">
          <button type="button" className="hc-clear" onClick={() => set(answers.slice(0, -1))}>
            ← 이전 질문
          </button>
          <button type="button" className="hc-clear" onClick={() => set([])}>
            처음부터
          </button>
        </div>
      )}
    </div>
  );
}
