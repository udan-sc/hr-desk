import { Suspense } from 'react';
import { browseProvisions } from '../../lib/data';
import { shortId } from '../../lib/lawlinks';
import FavoritesClient from './favorites-client';

export const metadata = {
  title: '즐겨찾기',
  description: '노무법전에서 별표한 조문을 한곳에 모아 보고, 링크 하나로 팀에 공유합니다.',
  alternates: { canonical: '/favorites' },
};

export default function FavoritesPage() {
  const items = browseProvisions.map(({ key, law, article, title, summary, href, threshold, category }) => ({
    key,
    sid: shortId(law, article),
    law,
    article,
    title,
    summary,
    href,
    threshold,
    category,
  }));
  return (
    <main>
      <div className="wrap">
        {/* 제목·설명은 서버에서 그려 JS가 늦어도 빈 화면이 되지 않게 한다 */}
        <header className="topic-head">
          <div className="eyebrow">노무법전 ☆ 모아보기</div>
          <h1>즐겨찾기</h1>
          <p>노무법전에서 ☆를 누른 조문이 여기 모입니다. 링크를 복사해 팀에 보내면 같은 목록을 그대로 볼 수 있습니다.</p>
        </header>
        {/* 주소의 ?k= 를 읽는 컴포넌트는 정적 내보내기에서 Suspense로 감싸야 빌드가 통과한다 */}
        <Suspense fallback={<p className="fav-loading" aria-busy="true">불러오는 중…</p>}>
          <FavoritesClient items={items} />
        </Suspense>
      </div>
    </main>
  );
}
