/* 플랫폼 모듈 등록부. 헤더 내비게이션, 홈 대시보드, 푸터가 모두 이 목록을 쓴다. */
export const SITE_NAME = '인사총무 데스크';
export const SITE_TAGLINE = '근거 조문까지 붙은 인사·총무 실무 도구';

export const MODULES = [
  {
    slug: 'law',
    href: '/law',
    name: '노무법전',
    short: '노무법전',
    blurb: '노동법 핵심 조문을 검색하고 5명 미만 사업장 적용 여부까지 확인합니다.',
    mark: '法',
  },
  {
    slug: 'calc',
    href: '/calc',
    name: '노무 계산기',
    short: '계산기',
    blurb: '연차 일수, 퇴직금, 가산수당, 해고예고수당, 최저임금 미달을 계산합니다.',
    mark: '算',
  },
  {
    slug: 'process',
    href: '/process',
    name: '상황별 업무 절차',
    short: '업무 절차',
    blurb: '입사·퇴사·출산육아·징계·산재·괴롭힘 신고 때 밟아야 할 순서를 봅니다.',
    mark: '順',
  },
  {
    slug: 'calendar',
    href: '/calendar',
    name: '법정 의무 캘린더',
    short: '캘린더',
    blurb: '교육·건강진단·신고처럼 해마다 챙겨야 하는 일을 달별로 모았습니다.',
    mark: '曆',
  },
  {
    slug: 'docs',
    href: '/docs',
    name: '규정·서식',
    short: '규정·서식',
    blurb: '갖춰야 할 서류와 법정 기재사항, 보존기간을 정리했습니다.',
    mark: '書',
  },
];

export const moduleBySlug = (slug) => MODULES.find((m) => m.slug === slug) || null;
