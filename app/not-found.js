import Link from 'next/link';

export const metadata = { title: '찾을 수 없는 조문' };

export default function NotFound() {
  return (
    <main>
      <div className="wrap">
        <div className="detail">
          <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 900, fontSize: 30, margin: '20px 0 0' }}>
            해당 조문이 없습니다
          </h1>
          <p className="lede">
            주소를 잘못 입력했거나, 이 법전에 아직 수록하지 않은 조문입니다. 조문 찾기에서 검색어로 다시 찾아보세요.
          </p>
          <p style={{ marginTop: 26, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Link className="backlink" style={{ marginTop: 0 }} href="/law">
              ← 노무법전
            </Link>
            <Link className="backlink" style={{ marginTop: 0 }} href="/topic">
              분야별로 보기
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
