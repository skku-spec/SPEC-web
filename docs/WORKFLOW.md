# SPEC 웹사이트 개발 워크플로우

이 문서는 팀의 실제 브랜치 운영 규칙과 배포 흐름을 정리한 기준 문서입니다.
브랜치 정책의 단일 기준은 `docs/BRANCH_POLICY.md`이며, 이 문서는 그 정책을 실무 흐름으로 풀어쓴 버전입니다.

## TL;DR

- 브랜치: `main`(프로덕션), `dev`(통합/검증), `feat/*`(작업 브랜치)
- PR: 기본은 `feat/* -> dev`, 릴리즈는 항상 `dev -> main`
- CI: PR/push 시 `lint`, `typecheck`, `build` 확인
- 배포: Vercel 프로덕션 도메인 `https://skku-spec.com`
- 예외적으로 `main`에 hotfix가 직접 들어가면 즉시 `main -> dev` 동기화

---

## 1) 브랜치 전략

### 기본 브랜치

- `main`: 프로덕션(실사용) 기준 브랜치
- `dev`: 통합/검증 브랜치(여러 작업을 모아 확인)

### 핵심 규칙

- 일반 기능 개발과 버그 수정은 모두 `dev` 기준으로 진행합니다.
- 작업 브랜치는 반드시 `dev`에서 분기합니다.
- `main`은 릴리즈 브랜치입니다. 일반 작업 브랜치에서 직접 머지하지 않습니다.
- `main`에 예외적으로 hotfix가 들어가면, 같은 변경을 즉시 `dev`에도 반영합니다.

### 작업 브랜치 네이밍(권장)

- `feat/<topic>`: 기능 추가
- `fix/<topic>`: 버그 수정
- `chore/<topic>`: 설정/정리
- `docs/<topic>`: 문서

예시:

```bash
git checkout -b feat/about-curriculum
```

---

## 2) 작업 흐름(권장)

### 일반 작업

1. `feat/*` 브랜치 생성
2. 커밋/푸시
3. PR 생성: `feat/* -> dev`
4. CI 결과 확인(아래 3번)
5. `dev`에서 실제 사이트(프리뷰/통합 상태) 확인

### 릴리즈(배포)

1. PR 생성: `dev -> main`
2. 머지
3. Vercel 프로덕션(`skku-spec.com`)에서 확인

### 예외 처리: main hotfix

1. 긴급 대응으로 `main`에 hotfix 머지
2. 즉시 `dev` 체크아웃
3. `main`을 `dev`로 fast-forward 또는 `main -> dev` PR 생성
4. `dev`와 `main`이 다시 같은 HEAD인지 확인

> 참고: 팀 운영상 AI(Claude Code 같은 CLI)가 PR 생성/머지까지 할 수 있습니다.
> 사람과 에이전트 모두 같은 브랜치 규칙을 따라야 합니다.

---

## 3) CI(Continuous Integration)

GitHub Actions 워크플로우: `CI/CD` (`.github/workflows/cicd.yml`)

### 언제 도나?

- `dev`, `main`에 대한 `pull_request`
- `dev`, `main`에 대한 `push`

### 무엇을 확인하나?

- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`
- Build: `npm run build`

CI가 빨간불이면, "머지를 막는 강제 장치"는 아니어도 **원인 확인 후 진행**을 권장합니다.

---

## 4) CD(Continuous Deployment) / 배포

### 프로덕션

- 프로덕션 도메인: `https://skku-spec.com`
- Vercel 프로젝트: `yc-clone`

### GitHub Actions 기반 CD (선택)

현재 워크플로우에는 CD job이 포함되어 있고, 아래 시크릿이 설정되면 자동 배포가 가능합니다.

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

> 현재 레포에는 GitHub Actions 시크릿이 아직 없으면, CD 단계는 자동으로 스킵됩니다.

### 수동 배포(필요 시)

Vercel Dashboard에서 배포하거나, CLI로도 배포할 수 있습니다.

```bash
vercel --prod
```

---

## 5) 환경 변수(중요)

이 프로젝트는 Supabase + middleware 기반으로 동작합니다. **Vercel 환경변수 미설정 시 전체 요청이 500으로 터질 수 있습니다.**

필수(최소):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (관리자/업로드/운영 스크립트용)

호환:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 기존 로컬 설정을 위한 fallback으로만 지원합니다.
- `SUPABASE_SERVICE_ROLE_KEY`는 기존 서버 키 설정을 위한 fallback으로만 지원합니다.

원칙:

- `.env.local`은 커밋하지 않습니다.
- `NEXT_PUBLIC_*` 값은 클라이언트에 노출될 수 있습니다(의도된 동작).

---

## 6) 롤백(장애 대응)

가장 빠른 복구는 Vercel에서 **이전 배포로 되돌리기**입니다.

권장 플로우:

1. Vercel Dashboard → Deployments → 직전 정상 배포 확인
2. 도메인(`skku-spec.com`)을 이전 배포로 재지정(rollback)
3. 원인 수정 후 다시 배포

---

## 7) (옵션) PR/머지 CLI 예시

```bash
# PR 생성 (base=dev)
gh pr create --base dev --fill

# 머지
gh pr merge --squash --delete-branch
```
