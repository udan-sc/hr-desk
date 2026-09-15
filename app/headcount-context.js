'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { HEADCOUNT_KEY, DEFAULT_HEADCOUNT, clampHeadcount } from '../lib/headcount';

const Ctx = createContext({ headcount: DEFAULT_HEADCOUNT, setHeadcount: () => {}, ready: false });

export function HeadcountProvider({ children }) {
  const [headcount, setValue] = useState(DEFAULT_HEADCOUNT);
  const [ready, setReady] = useState(false);

  /* 서버 렌더와 어긋나지 않도록 저장값은 hydration 이후에 읽는다. */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(HEADCOUNT_KEY);
      if (saved !== null) setValue(clampHeadcount(saved));
    } catch {
      /* 저장소를 못 읽어도 기본값으로 동작한다 */
    }
    setReady(true);
  }, []);

  const setHeadcount = useCallback((n) => {
    const v = clampHeadcount(n);
    setValue(v);
    try {
      localStorage.setItem(HEADCOUNT_KEY, String(v));
    } catch {
      /* 저장 실패는 무시 — 이번 세션에서는 그대로 동작한다 */
    }
  }, []);

  const value = useMemo(() => ({ headcount, setHeadcount, ready }), [headcount, setHeadcount, ready]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useHeadcount = () => useContext(Ctx);
