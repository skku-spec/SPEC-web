# SPEC Web

Next.js 기반 SPEC 웹 애플리케이션.

## Getting Started

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

---

## Branch Strategy

```
main (production)
 |
dev (preview/staging)
 |
feature/xxx (작업 브랜치)
```

| Branch | 용도 | 배포 환경 |
|--------|------|-----------|
| `main` | 프로덕션 코드 | Vercel Production |
| `dev` | 통합/스테이징 | Vercel Preview |
| `feature/*`, `fix/*`, `ui/*` 등 | 개별 작업 | - |

### Branch 규칙

- `main`, `dev` 브랜치에 **직접 push 금지** (PR을 통해서만 머지)
- 모든 작업은 `dev`에서 새 브랜치를 생성하여 진행
- 일반 작업 PR은 반드시 `dev`를 대상으로 생성하고, 배포는 `dev -> main` 승격으로만 진행
- `main`에 긴급 hotfix가 직접 머지되면 즉시 `dev`를 `main`에 다시 맞춰야 함
- 브랜치 네이밍: `feature/기능명`, `fix/버그명`, `ui/화면명` 등

상세 운영 규칙은 [docs/BRANCH_POLICY.md](docs/BRANCH_POLICY.md)를 기준으로 합니다.

---

## CI/CD Pipeline

### 자동 실행 조건

| 이벤트 | 대상 브랜치 | 실행 내용 |
|--------|-------------|-----------|
| PR 생성/업데이트 | `dev`, `main` | Lint + Typecheck + Build |
| Push (머지) | `dev` | Lint + Typecheck + Build + **Preview 배포** |
| Push (머지) | `main` | Lint + Typecheck + Build + **Production 배포** |

### CI 검사 항목

1. **Lint** (`npm run lint`) - ESLint 코드 스타일 검사
2. **Typecheck** (`npx tsc --noEmit`) - TypeScript 타입 검사
3. **Build** (`npm run build`) - 빌드 성공 여부

> 3개 검사가 모두 통과해야 배포가 진행됩니다.

### 배포 플로우

```
feature 브랜치에서 작업
        |
        v
  dev로 PR 생성 -----> CI 검사 (lint, typecheck, build)
        |
   리뷰 & 승인
        |
        v
  dev에 머지 -------> CI 검사 + Preview 배포 (Vercel)
        |
    QA / 확인
        |
        v
  main으로 PR 생성 --> CI 검사 (lint, typecheck, build)
        |
   리뷰 & 승인
        |
        v
  main에 머지 ------> CI 검사 + Production 배포 (Vercel)
```

예외적으로 `main`에 직접 들어간 hotfix가 있으면, 같은 변경을 `dev`에도 즉시 반영한 뒤 다음 작업을 진행합니다.

---

## Collaboration Rules

### 1. 작업 시작

```bash
# dev 브랜치에서 최신 코드를 받고 새 브랜치 생성
git checkout dev
git pull origin dev
git checkout -b feature/my-feature
```

### 2. 작업 중

```bash
# 커밋은 자주, 작은 단위로
git add .
git commit -m "feat: 로그인 폼 UI 추가"
```

### 3. 커밋 메시지 컨벤션

```
<type>: <description>

feat:     새로운 기능
fix:      버그 수정
docs:     문서 변경
style:    코드 포맷팅 (기능 변경 없음)
refactor: 리팩토링 (기능 변경 없음)
test:     테스트 추가/수정
chore:    빌드, 설정 파일 등 기타 변경
```

### 4. PR 생성

```bash
# 리모트에 push
git push origin feature/my-feature
```

- GitHub에서 `dev` 브랜치로 PR 생성
- PR 제목에 작업 내용 명시
- CI 검사 통과 확인 후 리뷰 요청

### 5. 코드 리뷰

- PR에 최소 1명 이상의 리뷰 권장
- CI 검사가 실패하면 머지 불가
- 리뷰어의 코멘트에 대응 후 재요청

### 6. 머지 후

```bash
# 로컬 dev 업데이트
git checkout dev
git pull origin dev

# 머지된 feature 브랜치 삭제
git branch -d feature/my-feature
```

---

## PR Checklist

PR 생성 시 아래 항목을 확인해주세요:

- [ ] `npm run lint` 통과
- [ ] `npx tsc --noEmit` 통과
- [ ] `npm run build` 성공
- [ ] 관련 없는 파일 변경이 포함되지 않았는지 확인
- [ ] PR 설명에 변경 사항 요약 작성
