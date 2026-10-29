import Link from 'next/link';
import Icon from './nav-icons';
import { practiceFor } from '../lib/platform';

/* 조문 상세의 '인사담당자 체크' — 이 조문 때문에 회사가 할 일을 한곳에 모은다.
   새 설명을 쓰지 않고, 절차·캘린더·서식·판정·계산기가 이 조문을 근거로 든 항목만 거꾸로 모아 링크로 잇는다.
   (조문 화면 오른쪽 열, 근거 복사 카드 다음. 좁은 화면·인쇄에서는 조문 내용·실무 해설 바로 아래에 온다) */

/* 절차 단계 이름은 '절차 · 단계'로 묶여 온다 — 절차 이름은 작은 머리글, 단계 이름은 굵게 */
const splitStep = (label) => {
  const i = label.indexOf(' · ');
  return i < 0 ? { ctx: '', title: label } : { ctx: label.slice(0, i), title: label.slice(i + 3) };
};

/* 판정·계산 도구 이름은 '판정: …' / '계산: …' — 머리말은 꼬리표로 뗀다 */
const splitTool = (label) => {
  const m = /^(판정|계산):\s*/.exec(label);
  return m ? { kind: m[1], title: label.slice(m[0].length) } : { kind: '', title: label };
};

function Group({ label, className, children }) {
  return (
    <div className={`hrc-g${className ? ` ${className}` : ''}`}>
      <h3 className={className === 'hrc-tools' ? 'hrc-tools-l' : undefined}>{label}</h3>
      {children}
    </div>
  );
}

export default function HrCheck({ law, article }) {
  const p = practiceFor(law, article);
  if (!p.steps.length && !p.calendar.length && !p.docs.length && !p.tools.length) return null;
  /* 판정·계산 도구만 있는 상자는 인쇄할 내용이 없다 */
  const onlyTools = !p.steps.length && !p.calendar.length && !p.docs.length;
  return (
    <section className={onlyTools ? 'hrcheck hrc-only-tools' : 'hrcheck'} aria-labelledby="hrc-h">
      <div className="hrc-head">
        <span className="hrc-mk" aria-hidden="true">
          <Icon name="check" size={16} stroke={2} />
        </span>
        <div>
          <h2 id="hrc-h">인사담당자 체크</h2>
          <p className="hrc-sub">이 조문 때문에 할 일</p>
        </div>
      </div>

      <div className="hrc-body">
        {p.steps.length > 0 && (
          <Group label="할 일·기한">
            <ul className="hrc-list">
              {p.steps.map((x) => {
                const s = splitStep(x.label);
                return (
                  <li key={x.href}>
                    <Link href={x.href}>
                      {s.ctx && <span className="hrc-ctx">{s.ctx}</span>}
                      <span className="hrc-t">{s.title}</span>
                    </Link>
                    {x.note && (
                      <span className="hrc-note">
                        <Icon name="clock" size={14} stroke={1.9} />
                        {x.note}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Group>
        )}

        {p.calendar.length > 0 && (
          <Group label="정기 일정">
            <ul className="hrc-list hrc-cal">
              {p.calendar.map((x) => (
                <li key={x.href}>
                  <Link href={x.href}>
                    <span className="hrc-t">{x.label}</span>
                  </Link>
                  {x.note && (
                    <span className="hrc-note">
                      <Icon name="calendar" size={14} stroke={1.9} />
                      {x.note}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Group>
        )}

        {p.docs.length > 0 && (
          <Group label="갖출 서류">
            <ul className="hrc-docs">
              {p.docs.map((x) => (
                <li key={x.href}>
                  <Link href={x.href}>
                    <Icon name="docs" size={16} stroke={1.9} className="hrc-di" />
                    <span className="hrc-dt">
                      {x.label}
                      {x.note && <span className="hrc-dn">{x.note}</span>}
                    </span>
                    <Icon name="chevron" size={14} stroke={2} className="hrc-go" />
                  </Link>
                </li>
              ))}
            </ul>
          </Group>
        )}

        {p.tools.length > 0 && (
          <Group label="판정·계산" className="hrc-tools">
            <div className="hrc-tool-list">
              {p.tools.map((x) => {
                const t = splitTool(x.label);
                return (
                  <Link key={x.href} className="hrc-tool" href={x.href}>
                    <Icon name={t.kind === '계산' ? 'calc' : 'check'} size={17} stroke={1.9} className="hrc-ti" />
                    {t.kind && <span className="hrc-k">{t.kind}</span>}
                    <span className="hrc-tt">{t.title}</span>
                  </Link>
                );
              })}
            </div>
          </Group>
        )}

        <p className="hrc-foot">절차·캘린더·서식·도구 가운데 이 조문을 근거로 든 것을 모았습니다. 우리 회사 적용 여부는 조문 제목 아래 적용 규모 배지를 확인하세요.</p>
      </div>
    </section>
  );
}
