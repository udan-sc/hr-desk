import Icon from './nav-icons';

/* 조문 화면 카드의 머리(시안 C) — 연한 포인트색 아이콘 칸 + 제목(+ 건수) + 보조 설명, 오른쪽 끝에 링크나 꼬리표.
   건수는 제목 안에 두어 '관련 판례 13건'처럼 함께 읽힌다. */
export default function CardHead({ icon, id, title, count, sub, children }) {
  return (
    <div className="ac-head">
      <span className="ac-mk" aria-hidden="true">
        <Icon name={icon} size={16} stroke={1.9} />
      </span>
      <div className="ac-tx">
        <h2 id={id}>
          {title}
          {count > 0 && (
            <>
              {' '}
              <span className="ac-n">{count}건</span>
            </>
          )}
        </h2>
        {sub && <p className="ac-sub">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
