import { news } from '../../lib/platform';
import NewsList from './news-list';

export const metadata = {
  title: '인사노무 소식',
  description: '고용노동부 발표와 노동 전문지·주요 언론의 인사노무 기사 제목을 하루 세 번 모아 보여 줍니다.',
  alternates: { canonical: '/news' },
};

const TOPIC_LABELS = {
  'wage-arrears': '임금체불',
  'ordinary-wage': '통상임금·수당',
  'min-wage': '최저임금',
  safety: '산업재해·중대재해',
  'labor-relations': '노조·노사관계',
  hours: '근로시간',
  'retirement-age': '정년·고령 고용',
  parental: '육아·출산·모성보호',
  harassment: '괴롭힘·성희롱',
  dismissal: '해고·구조조정',
  nonregular: '비정규·플랫폼',
  insurance: '고용보험·실업급여',
  pension: '퇴직금·퇴직연금',
};

export default function NewsPage() {
  return (
    <main>
      <div className="wrap">
        <header className="topic-head">
          <div className="eyebrow">하루 세 번 자동 갱신 · 제목과 원문 링크만</div>
          <h1>인사노무 소식</h1>
          <p>
            고용노동부 보도자료·정책자료와 매일노동뉴스, 인사노무 키워드로 걸러낸 주요 언론 기사를 모았습니다. 같은 보도를
            여러 매체가 받아쓴 기사는 하나로 묶었습니다. 기사 내용은 각 원문에서 확인하세요.
          </p>
        </header>
        <NewsList items={news.items || []} updatedAt={news.updatedAt} topicLabels={TOPIC_LABELS} />
      </div>
    </main>
  );
}
