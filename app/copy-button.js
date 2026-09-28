'use client';

import { useRef, useState } from 'react';

/* 클립보드 복사 버튼. text(고정 문자열) 또는 getText(누를 때 계산)를 받는다.
   복사가 막힌 환경에서는 내용을 창으로 띄워 직접 긁을 수 있게 한다. */
export default function CopyButton({ text, getText, label = '복사', copiedLabel = '복사됨', className = '' }) {
  const [done, setDone] = useState(false);
  const timer = useRef(null);

  async function copy() {
    const value = getText ? getText() : text;
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setDone(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1800);
    } catch {
      window.prompt('자동 복사가 막혀 있습니다. 아래 내용을 직접 복사하세요.', value);
    }
  }

  return (
    <button type="button" className={`copybtn ${className}`.trim()} onClick={copy}>
      <span aria-hidden="true" className="ci">{done ? '✓' : '⧉'}</span>
      <span aria-live="polite">{done ? copiedLabel : label}</span>
    </button>
  );
}

/* 브라우저 인쇄 대화상자를 연다. @media print 스타일이 메뉴·버튼을 걷어내므로
   조문과 행정해석만 종이(또는 PDF)에 담긴다. */
export function PrintButton({ label = '인쇄 · PDF 저장' }) {
  return (
    <button type="button" className="copybtn" onClick={() => window.print()}>
      <span aria-hidden="true" className="ci">⎙</span>
      <span>{label}</span>
    </button>
  );
}
