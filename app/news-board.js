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

/* 홈 '오늘의 인사노무 이슈' — 주제 순위와 고용노동부 발표만 간추린다(언론 보도 전체는 /news).
   제목과 링크만 모은다(기사 본문은 각 언론사·고용노동부에 있음). */
export default function NewsBoard() {
  if (!news?.items?.length) return null;
  const official = news.items.filter((x) => x.kind === 'official').slice(0, 4);

  return (
    <section className="tpanel newsboard" aria-labelledby="nb-h">
      <div className="tpanel-hrow">
        <h3 id="nb-h" className="tpanel-h">
          오늘의 인사노무 이슈
        </h3>
        <span className="tpanel-note">{fmt(Date.parse(news.updatedAt))} 기준</span>
        <Link className="more" href="/news">
          소식 전체 →
        </Link>
      </div>

      {news.issues?.length > 0 && (
        <ol className="nb-ranks">
          {news.issues.map((i, n) => (
            <li key={i.key} className="nb-r">
              <span className="nb-rank" aria-hidden="true">
                {n + 1}
              </span>
              <div className="nb-rb">
                <div className="nb-ih">
                  <b>{i.label}</b>
                  <span className="nb-count">
                    24시간 {i.count}건{i.officialCount > 0 ? ` · 고용노동부 ${i.officialCount}건` : ''}
                  </span>
                </div>
                <ul className="nb-heads">
                  {i.headlines.slice(0, 2).map((h) => (
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
              </div>
            </li>
          ))}
        </ol>
      )}

      {official.length > 0 && (
        <div className="nb-off">
          <h4>고용노동부 발표</h4>
          <ul className="nb-heads">
            {official.map((x) => (
              <Headline key={x.url} x={x} showSource={false} />
            ))}
          </ul>
        </div>
      )}

      <p className="nb-foot">
        고용노동부·매일노동뉴스·주요 언론의 제목과 링크만 모읍니다. 순위는 최근 24시간 기사 제목에 나온 주제를 센 것이며, 내용은
        원문과 관련 기준으로 확인하세요.
      </p>
    </section>
  );
}
