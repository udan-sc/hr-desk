import Link from 'next/link';
import Icon from './nav-icons';

/* 홈 대시보드(시안 C) 카드의 머리 줄 — 아이콘 칸 · 제목(h2) · 한 줄 설명 · 오른쪽 '전체' 링크.
   서버·클라이언트 부품이 함께 쓰므로 훅을 쓰지 않는다. */
export default function CardHead({ id, icon, title, badge, sub, moreHref, more = '전체' }) {
  return (
    <div className="hd-head">
      <div className="hd-head-l">
        <span className="hd-ic" aria-hidden="true">
          <Icon name={icon} size={16} stroke={1.9} />
        </span>
        <div className="hd-head-tx">
          <h2 id={id} className="hd-h">
            {title}
            {/* 읽어 줄 때 제목과 붙지 않게 띄운다(화면에서는 flex 간격) */}
            {badge ? <> {badge}</> : null}
          </h2>
          {sub ? <p className="hd-sub">{sub}</p> : null}
        </div>
      </div>
      {moreHref ? (
        <Link className="hd-more" href={moreHref}>
          {more}
          <Icon name="chevron" size={14} stroke={2} />
        </Link>
      ) : null}
    </div>
  );
}
