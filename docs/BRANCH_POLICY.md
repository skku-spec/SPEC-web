# SPEC Branch Policy

이 문서는 SPEC 웹 저장소의 공식 브랜치 운영 규칙입니다.

## 기본 원칙

- 모든 기능 개발과 버그 수정은 `dev` 기준으로 진행합니다.
- 작업 브랜치는 반드시 `dev`에서 분기합니다.
- 프로덕션 반영은 `dev`에서 검토와 확인을 마친 뒤 `main`으로 승격합니다.
- `main`은 릴리즈 브랜치이며, 일반 작업 브랜치에서 직접 머지하지 않습니다.

## 표준 흐름

```text
feature/*, fix/*, docs/*, ui/* -> dev -> main
```

1. `dev` 최신화
2. 작업 브랜치 생성
3. 작업 브랜치에서 구현 및 검증
4. PR 생성: `work branch -> dev`
5. 리뷰, CI, 프리뷰 확인
6. PR 생성: `dev -> main`
7. 프로덕션 배포 확인

## 금지 사항

- `main`에 직접 push
- 일반 기능/수정 PR을 `main`으로 직접 생성
- `main`만 앞선 상태를 장기간 방치

## 예외: 긴급 hotfix

긴급 장애 대응으로 `main`에 직접 hotfix를 머지해야 할 수 있습니다. 이 경우에도 흐름은 여기서 끝나면 안 됩니다.

필수 후속 조치:

1. `main` 변경을 즉시 `dev`에 반영
2. 가능하면 `main -> dev` PR로 흔적을 남기고, 급하면 fast-forward 후 바로 push
3. `dev`와 `main`의 HEAD가 다시 일치하는지 확인

권장 명령:

```bash
git checkout dev
git fetch origin
git merge --ff-only origin/main
git push origin dev
```

## 시작 전 체크리스트

```bash
git checkout dev
git pull origin dev
git checkout -b feature/my-change
```

## 릴리즈 체크리스트

- `dev` 기준 최종 리뷰 완료
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- 필요 시 프리뷰 QA 완료
- PR 생성: `dev -> main`

## 운영 메모

- 브랜치 정책 위반이 발생하면 가장 먼저 `dev`와 `main`의 차이를 해소합니다.
- 에이전트나 자동화 도구도 이 정책을 따라야 합니다.
