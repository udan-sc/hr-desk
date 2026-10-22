import Link from 'next/link';
import { news } from '../lib/platform';

const KST = 9 * 3600 * 1000;
const fmt = (ms) => {
  const d = new Date(ms + KST);
  const md = `${d.getUTCMonth() + 1}. ${d.getUTCDate()}.`;
  const hh = d.getUTCHours();
  const mm = d.getUTCMinutes();
  /* 공식 보도자료는 날짜만 있어 09:00으로 들어온다 — 그런 것은 날짜만 보인다 */
  return hh === 9 && mm === 0 ? md : `${md} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

function Headline({ x, showSource = true }) {
  return (
    <li className="nb-li">
      <a href={x.url} target="_blank" rel="noopener noreferrer">
        {x.title}
        <span className="vh"> (새 창)</span>
      </a>
      <span className="nb-meta">
        {showSource && <>{x.source} · </>}
        {fmt(x.ms)}
        {x.also > 0 && ` · 비슷한 기사 ${x.also}건 더`}
      </span>
    </li>
  );
}

/* 홈 '오늘의 인사노무 이슈' — 제목과 링크만 모은다(기사 본문은 각 언론사·고용노동부에 있음). */
export default function NewsBoard() {
  if (!news?.items?.length) return null;
  const official = news.items.filter((x) => x.kind === 'official').slice(0, 5);
  const press = news.items.filter((x) => x.kind !== 'official').slice(0, 6);

  return (
    <section className="newsboard" aria-label="오늘의 인사노무 이슈">
      <div className="sec-head">
        <h2>오늘의 인사노무 이슈</h2>
        <span className="note">{fmt(Date.parse(news.updatedAt))} 기준 · 하루 세 번 갱신</span>
      </div>

      {news.issues?.length > 0 && (
        <ol className="nb-issues">
          {news.issues.map((i, n) => (
            <li key={i.key} className="nb-issue">
              <div className="nb-ih">
                <span className="nb-rank" aria-hidden="true">{n + 1}</span>
                <b>{i.label}</b>
                <span className="nb-count">
                  최근 24시간 {i.count}건{i.articles > i.count ? ` (받아쓴 기사 포함 ${i.articles}건)` : ''}
                  {i.officialCount > 0 ? ` · 고용노동부 ${i.officialCount}건` : ''}
                </span>
              </div>
              <ul className="nb-heads">
                {i.headlines.map((h) => (
                  <Headline key={h.url} x={h} />
                ))}
              </ul>
              {i.links?.length > 0 && (
                <div className="nb-links">
                  <span className="nb-links-l">관련 기준</span>
                  {i.links.map((l) => (
                    <Link key={l.href} className="tag" href={l.href}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="nb-cols">
        <div className="nb-col">
          <h3>고용노동부 발표</h3>
          <ul>
            {official.map((x) => (
              <Headline key={x.url} x={x} />
            ))}
          </ul>
        </div>
        <div className="nb-col">
          <h3>언론 보도</h3>
          <ul>
            {press.map((x) => (
              <Headline key={x.url} x={x} />
            ))}
          </ul>
        </div>
      </div>

      <p className="nb-foot">
        고용노동부·매일노동뉴스·주요 언론의 제목과 링크만 모아 보여 줍니다. 순위는 최근 24시간 기사 제목에 나온 주제를 센
        것이며, 내용 판단은 원문과 관련 기준을 확인하세요. <Link href="/news">소식 전체 보기 →</Link>
      </p>
    </section>
  );
}
