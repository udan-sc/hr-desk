'use client';

import { useEffect, useState } from 'react';
import Icon from './nav-icons';

/* 조문 화면의 즐겨찾기 단추. 노무법전·즐겨찾기 화면과 같은 저장소(localStorage 'nomu-favs', 키는 '법령|조문')를 쓴다.
   hydration이 어긋나지 않도록 저장소는 마운트 후에만 읽는다. */
const FAV_KEY = 'nomu-favs';

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    return Array.isArray(v) ? v.filter((k) => typeof k === 'string') : [];
  } catch {
    return [];
  }
};

export default function FavToggle({ favKey, name }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    setOn(read().includes(favKey));
    /* 다른 탭에서 바꾼 즐겨찾기도 따라간다 */
    const onStorage = (e) => {
      if (e.key === FAV_KEY) setOn(read().includes(favKey));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [favKey]);

  const toggle = () => {
    const list = read();
    const next = list.includes(favKey) ? list.filter((k) => k !== favKey) : [...list, favKey];
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch {
      /* 저장이 막혀도 이번 화면에서는 그대로 동작한다 */
    }
    setOn(next.includes(favKey));
  };

  return (
    <button
      type="button"
      className={`copybtn fav-btn${on ? ' on' : ''}`}
      onClick={toggle}
      aria-pressed={on}
      aria-label={`${name} 즐겨찾기`}
      title={on ? '즐겨찾기에서 빼기' : '즐겨찾기에 담기'}
    >
      <Icon name="favorites" size={17} stroke={1.9} />
    </button>
  );
}
