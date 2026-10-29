import Link from 'next/link';
import { news } from '../lib/platform';
import CardHead from './home-card';

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

const updated = () => (
  <>
    <span className="mono">{fmt(Date.parse(news.updatedAt))}</span> 기준
  </>
);

/* 홈 '오늘의 인사노무 이슈' — 주제 순위만 간추린다(언론 보도 전체는 /news).
   제목과 링크만 모은다(기사 본문은 각 언론사·고용노동부에 있음).
   고용노동부 발표는 아래 NewsOfficial이 오른쪽 열의 따로 된 카드로 보인다(두 열 높이를 맞추려고 나눴다). */
export default function NewsBoard() {
  if (!news?.items?.length || !news.issues?.length) return null;

  return (
    <section className="hd-card newsboard" aria-labelledby="nb-h">
      <CardHead id="nb-h" icon="news" title="오늘의 인사노무 이슈" sub={updated()} moreHref="/news" more="소식 전체" />
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
      <p className="nb-foot">
        고용노동부·매일노동뉴스·주요 언론의 제목과 링크만 모읍니다. 순위는 최근 24시간 기사 제목에 나온 주제를 센 것이며, 내용은
        원문과 관련 기준으로 확인하세요.
      </p>
    </section>
  );
}

/* 홈 '고용노동부 발표' — 최근 공식 보도자료 제목 4건 */
export function NewsOfficial() {
  const official = (news?.items || []).filter((x) => x.kind === 'official').slice(0, 4);
  if (!official.length) return null;

  return (
    <section className="hd-card newsboard nb-off" aria-labelledby="nbo-h">
      <CardHead id="nbo-h" icon="file" title="고용노동부 발표" sub={updated()} />
      <ul className="nb-heads">
        {official.map((x) => (
          <Headline key={x.url} x={x} showSource={false} />
        ))}
      </ul>
    </section>
  );
}
