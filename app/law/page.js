import BrowseClient from '../browse-client';
import { browseProvisions, categories, laws, cards, stats, BASE_DATE } from '../../lib/data';

export const metadata = {
  title: '노무법전',
  description: `사업주·인사담당자가 자주 찾는 노동법 핵심 조문 ${stats.provisions}개를 검색하고, 상시 5명 미만 사업장 적용 여부까지 확인합니다.`,
  alternates: { canonical: '/law' },
};

export default function LawPage() {
  return (
    <main>
      <div className="wrap">
        <h1 className="vh">노무법전 — 노동법 핵심 조문 찾기</h1>
        <BrowseClient
          provisions={browseProvisions}
          categories={categories}
          laws={laws}
          cards={cards}
          baseDate={BASE_DATE}
        />
      </div>
    </main>
  );
}
