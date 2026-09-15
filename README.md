# 인사총무 데스크

노동법 조문 187개를 바탕으로 한 인사·총무 실무 플랫폼. 5개 모듈로 구성된다.

| 모듈 | 주소 | 내용 |
| --- | --- | --- |
| 노무법전 | `/law` | 조문 검색·5인 미만 적용 여부·즐겨찾기. 조문별 고유 주소: `/law/근로기준법/제60조` |
| 노무 계산기 | `/calc` | 연차 일수, 퇴직금, 가산수당, 해고예고수당, 최저임금 점검 (5종) |
| 상황별 업무 절차 | `/process` | 입사·퇴사·출산육아·징계해고·산재·괴롭힘 신고 (6종, 단계별 법정 기한) |
| 법정 의무 캘린더 | `/calendar` | 교육·건강진단·신고 등 정기 의무 20건, 월별 보기 |
| 규정·서식 | `/docs` | 갖춰야 할 서류 20종 — 법정 기재사항·보존기간·미비 시 제재 |

기준일: **2026. 9. 11.** 시행 법령. 모든 안내에 근거 조문 링크가 붙는다.

## 상시 근로자 수

화면 위쪽에서 상시 근로자 수를 한 번 넣으면 노무법전·캘린더·규정서식이 모두 그 규모 기준으로
적용/미적용을 표시하고, 해당 없는 항목은 흐려지거나 숨길 수 있다. 값은 브라우저에 저장되어
모듈을 옮겨도 유지된다(`nomu-headcount`).

조문·의무마다 적용 하한 인원이 붙어 있다. 쓰는 값은 1·5·10·20·30·50·100·300·500·1000 뿐이고,
`1`은 규모와 무관하게 적용된다는 뜻이다. 조문은 `threshold`/`thresholdNote`,
캘린더·서식은 `thresholdMin`(챙기기 시작하는 규모)과 `thresholdFull`(완화가 끝나 온전한 의무가 되는 규모)을 쓴다.
성희롱 예방교육처럼 "1명부터 의무지만 10명 미만은 자료 게시로 갈음"인 항목이 있어 두 값이 갈린다.

`threshold`는 조문의 `appliesUnder5`와 반드시 맞아야 한다 — `true`면 1, `false`면 5 이상.
어긋나면 화면에 서로 모순된 표시가 나간다.

## 사이트 주소

**https://udan-sc.github.io/hr-desk/**

`main`에 푸시하면 GitHub Actions가 검사 → 빌드 → 배포까지 자동으로 한다(`.github/workflows/deploy.yml`).
데이터만 고쳐 푸시해도 사이트가 갱신된다. 배포 상황은 저장소 Actions 탭에서 볼 수 있다.

## 로컬에서 실행

```
dev.cmd
```

http://localhost:3200 (127.0.0.1 바인딩이라 사내망에 노출되지 않는다).

처음 받았다면 `pnpm install` 먼저. 내보낸 결과를 실제 배포와 같은 하위 경로로 확인하려면:

```
pnpm build
node scripts/serve-out.mjs
```

http://127.0.0.1:3202/hr-desk/ 에서 열린다.

> `pnpm build`는 dev 서버를 내린 뒤에 실행한다. 켜 둔 채로 빌드하면 `.next`가 섞여 500이 뜨고,
> 그때는 `.next`를 지우고 다시 시작하면 된다.

## 배포 구조

GitHub Pages는 서버가 없어 전부 미리 구워 내보낸다(`output: 'export'`). 그래서:

- 하위 경로에서 열리므로 `basePath`가 필요하다. `<Link>`는 Next가 알아서 붙이지만
  `fetch`·`form action` 같은 생짜 경로는 `lib/site.js`의 `asset()`으로 직접 붙여야 한다.
- 조문 전문 색인은 라우트 핸들러가 아니라 `public/search-index.json` 정적 파일이다.
  `pnpm build`·`pnpm dev`가 `data/provisions.json`에서 자동으로 굽는다(커밋하지 않는다).
- 응답 헤더를 줄 수 없어 CSP는 `app/layout.js`의 meta 태그로 대신한다.
- 주소는 `NEXT_PUBLIC_BASE_PATH`·`NEXT_PUBLIC_SITE_URL`로 정해지고 **빌드 시점에 구워진다**.
  워크플로가 저장소 이름에서 자동으로 채우므로 저장소 이름을 바꾸면 주소도 따라 바뀐다.

## 구조

```
data/provisions.json          조문 원천 데이터 (분야 10개 × 조문 배열)
data/platform/                모듈 데이터: calculators / processes / calendar / documents .json
lib/data.js                   조문 로딩·색인·관련 조문·법령 약칭(LAW_OFFICIAL)
lib/platform.js               모듈 데이터 로딩 + 인용→조문 링크 해석 (없는 인용은 링크 미생성)
lib/calc.js                   계산기 산식 (순수 함수)
scripts/calc.test.mjs         산식 검산 — node scripts/calc.test.mjs (수정 시 반드시 실행)
lib/modules.js                모듈 등록부 (헤더·홈·푸터가 공유)
lib/headcount.js              상시 근로자 수 구간·적용 판정·표기
app/headcount-context.js      규모 설정 공유 (localStorage, 모듈 간 유지)
app/headcount-bar.js          규모 입력 UI
app/scope-badges.js           적용/미적용 배지
app/scope-filter.js           "N건 중 M건 적용" 요약과 숨기기 토글
app/browse-client.js          노무법전 검색·필터 (클라이언트)
app/calc/calc-client.js       계산기 입력·결과 (클라이언트)
```

## 데이터 갱신

- **조문**: `data/provisions.json` 수정. 새 법령 약칭은 `lib/data.js`의 `LAW_OFFICIAL`에도 추가.
  새 조문에는 `threshold`와 `thresholdNote`도 넣는다(없으면 `appliesUnder5`에서 1 또는 5로 자동 보정된다).
- **절차·캘린더·서식**: `data/platform/*.json` 수정. `citations`의 (law, article)이 조문 데이터에
  없으면 링크가 조용히 빠진다.

- **계산기 산식**: `lib/calc.js` 수정 후 검산 36건이 전부 PASS여야 한다.
  최저임금이 바뀌면 `MIN_WAGE_2026` 상수와 홈 기준 카드(`lib/data.js`의 `cards`)를 함께 고친다.

홈 화면 전송량 관련: 조문 전문은 `/search-index.json`으로 분리되어 검색·펼치기 시점에 한 번만
로드된다. 자세한 내력은 git 히스토리와 `lib/data.js`의 주석 참고.

### 데이터를 고쳤다면

```
pnpm check
```

계산기 검산 36건과 인용 227건 연결을 한 번에 확인한다. 빌드 전에 반드시 통과시킬 것.

## 팀원과 함께 쓰기

저장소는 public이라 누구나 읽을 수 있지만, 고칠 수 있는 사람은 소유자와 초대된 협업자뿐이다.
팀원에게 수정 권한을 주려면 저장소 **Settings → Collaborators → Add people**에서 GitHub 계정을 초대한다.

내용을 고치는 가장 흔한 경로:

1. `data/provisions.json`(조문) 또는 `data/platform/*.json`(계산기·절차·캘린더·서식)을 고친다
2. `pnpm check`로 검산·인용 연결을 확인한다
3. `main`에 푸시하면 3~5분 안에 사이트에 반영된다

푸시 전에 `pnpm check`가 통과해야 한다. 통과하지 못하면 GitHub Actions가 배포를 멈추므로
잘못된 수치가 사이트에 올라가는 일은 없다.

## 주의

참조용 자료다. 계산 결과와 절차는 일반적인 경우를 전제로 하며, 개별 사안은 원문 조문과
행정해석·판례 확인이 필요하다.
