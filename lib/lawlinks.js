/* 법령 약칭 → 정식 명칭과 국가법령정보센터 링크.
   데이터 파일을 불러오지 않는 순수 모듈이라 클라이언트 번들에 넣어도 가볍다. */
export const LAW_OFFICIAL = {
  '퇴직급여법': '근로자퇴직급여 보장법',
  '남녀고용평등법': '남녀고용평등과 일ㆍ가정 양립 지원에 관한 법률',
  '기간제법': '기간제 및 단시간근로자 보호 등에 관한 법률',
  '파견법': '파견근로자 보호 등에 관한 법률',
  '중대재해처벌법': '중대재해 처벌 등에 관한 법률',
  '산재보험법': '산업재해보상보험법',
  '노동조합법': '노동조합 및 노동관계조정법',
  '근로자참여법': '근로자참여 및 협력증진에 관한 법률',
  '고령자고용법': '고용상 연령차별금지 및 고령자고용촉진에 관한 법률',
  '채용절차법': '채용절차의 공정화에 관한 법률',
  '근로자의날법': '근로자의 날 제정에 관한 법률',
  '장애인차별금지법': '장애인차별금지 및 권리구제 등에 관한 법률',
  '장애인고용법': '장애인고용촉진 및 직업재활법',
  '고용산재보험료징수법': '고용보험 및 산업재해보상보험의 보험료징수 등에 관한 법률',
};

export const officialLaw = (name) => LAW_OFFICIAL[name] || name;

/* 국가법령정보센터 링크. 조문 표기가 단일 조문이 아니면 법령 단위로 연결한다. */
export function lawGoKrUrl(p) {
  const base = 'https://www.law.go.kr/법령/' + encodeURIComponent(officialLaw(p.law));
  return /^제\d+조(의\d+)?$/.test(p.article) ? base + '/' + encodeURIComponent(p.article) : base;
}

export const provisionHref = (p) => `/law/${encodeURIComponent(p.law)}/${encodeURIComponent(p.article)}`;

/* 인용문(복사되는 글)에 넣는 주소 — 퍼센트 인코딩 없이 한글 그대로 두어 읽기 좋게 한다.
   브라우저에 붙여 넣으면 알아서 인코딩되므로 그대로 동작한다. */
export function lawGoKrDisplayUrl(p) {
  const base = 'https://www.law.go.kr/법령/' + officialLaw(p.law);
  return /^제\d+조(의\d+)?$/.test(p.article) ? base + '/' + p.article : base;
}
