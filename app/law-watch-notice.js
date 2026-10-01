import { lawGoKrUrl, BASE_DATE } from '../lib/data';
import { watchFor, lawVersionUrl, watchStatus } from '../lib/platform';

const fmt = (iso) => {
  const [y, m, d] = iso.split('-');
  return `${y}. ${Number(m)}. ${Number(d)}.`;
};

/* 조문 상세 — 매주 자동 확인에서 이 조문 원문이 바뀌었거나 바뀔 예정이면 알린다.
   이미 '관련 개정' 배너(사람이 정리한 것)에 같은 시행일이 있으면 중복해 띄우지 않는다. */
export default function LawWatchNotice({ provision, curatedDates = [] }) {
  const w = watchFor(provision.law, provision.article);
  if (!w) return null;
  const upcoming = (w.upcoming || []).filter((u) => !curatedDates.includes(u.efYd));
  if (!w.changedSinceBase && !upcoming.length) return null;

  return (
    <aside className="watch-notice" aria-label="원문 변경 알림">
      <div className="wn-h">
        <span className="wn-mark" aria-hidden="true">!</span>
        국가법령정보센터 자동 확인 ({fmt(watchStatus.checkedAt)})
      </div>
      {w.changedSinceBase && (
        <p className="wn-row">
          <b>기준일({BASE_DATE}) 이후 이 조문 원문이 바뀌었습니다.</b>
          {w.latestAmend ? ` 최근 개정 표시 ${fmt(w.latestAmend)}` : ''} 아래 요약은 개정 전 기준일 수 있으니 현행 원문을 확인하세요.{' '}
          <a href={lawGoKrUrl(provision)} target="_blank" rel="noopener noreferrer">
            현행 원문 보기<span className="vh"> (새 창)</span> ↗
          </a>
        </p>
      )}
      {upcoming.map((u) => (
        <p key={`${u.efYd}-${u.lawNo}`} className="wn-row">
          <b>{fmt(u.efYd)} 시행 예정 개정</b>으로 이 조문이 바뀝니다 (법률 제{u.lawNo}호, {fmt(u.ancYd)} 공포).{' '}
          <a href={lawVersionUrl(u.lsiSeq, u.efYd)} target="_blank" rel="noopener noreferrer">
            개정 후 원문 보기<span className="vh"> (새 창)</span> ↗
          </a>
        </p>
      ))}
    </aside>
  );
}
