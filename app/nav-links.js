'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/* 현재 경로에 해당하는 메뉴에 표시를 붙인다. 노무법전의 하위 경로(/law/..., /topic/...)도 노무법전으로 친다. */
export default function NavLinks({ modules }) {
  const path = usePathname();
  const activeOf = (m) =>
    m.slug === 'law' ? path === '/law' || path.startsWith('/law/') || path.startsWith('/topic') : path === m.href || path.startsWith(m.href + '/');
  return (
    <>
      {modules.map((m) => {
        const cur = activeOf(m);
        return (
          <Link key={m.slug} href={m.href} className={cur ? 'cur' : undefined} aria-current={cur ? 'page' : undefined}>
            {m.short}
          </Link>
        );
      })}
    </>
  );
}
