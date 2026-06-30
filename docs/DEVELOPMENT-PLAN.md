# SPEC 웹사이트 개발 계획서

> 최종 업데이트: 2026-02-12
> 상태: 계획 확정, 구현 대기

---

## 1. 프로젝트 개요

SPEC(성균관대 창업학회) 웹사이트를 100% 정적 사이트에서 인증, DB, 관리자 패널을 갖춘 동적 플랫폼으로 전환한다.

### 1.1 현재 상태

| 항목 | 상태 |
|------|------|
| 프레임워크 | Next.js 16.1.6, React 19, TypeScript, Tailwind CSS v4 |
| 데이터베이스 | 없음 |
| 인증 | 없음 |
| API 라우트 | 없음 (`app/api/` 미존재) |
| 미들웨어 | 없음 |
| 서버 액션 | 없음 |
| 환경 변수 | 없음 |
| CMS / 관리자 | 없음 |
| 블로그 | 정적 (`blogData.ts`에 20개 포스트 하드코딩) |
| 기타 데이터 | 8개 TS 파일, ~189개 레코드, ~152KB 전부 정적 |

### 1.2 목표 상태

- 유저 인증 (Google + 카카오 OAuth)
- 6단계 역할 기반 접근 제어
- DB 기반 블로그 (소식/블로그 분리, 글쓰기, Tiptap 에디터)
- 댓글 (대댓글 스레드) + 이모지 반응
- 이미지 업로드 (Supabase Storage)
- 관리자 패널 (유저 관리, 콘텐츠 CRUD)
- jobs, library, launches DB 마이그레이션

### 1.3 핵심 아키텍처 장점

기존 `lib/api.ts`가 이미 `async` 함수 패턴으로 구성되어 있어, Supabase로 전환 시 **호출하는 쪽 코드 변경이 거의 없음**:

```typescript
// 현재 (정적)
export async function getCompanies() { return COMPANIES; }

// 전환 후 (동일 시그니처, 호출부 변경 불필요)
export async function getCompanies() {
  const supabase = createServerClient(/* ... */);
  const { data } = await supabase.from('companies').select('*');
  return data;
}
```

---

## 2. 기술 스택

| 영역 | 선택 | 비용 | 근거 |
|------|------|------|------|
| **Auth** | Supabase Auth | $0 | 무료 50K MAU, Google+카카오 네이티브, RLS 연동 |
| **DB** | Supabase PostgreSQL | $0 | 무료 500MB, Realtime 내장 |
| **Storage** | Supabase Storage | $0 | 무료 1GB, 이미지 업로드용 |
| **에디터** | Tiptap WYSIWYG | $0 | 리치 에디터, 노션 스타일 UX |
| **Admin UI** | Shadcn/ui + Server Actions | $0 | 직접 구축, 완전한 통제 |
| **댓글/반응** | Server Actions + Optimistic UI | $0 | 모던 패턴, API 라우트 불필요 |

### 2.1 Supabase 무료 티어 예산

| 리소스 | 한도 | 예상 사용량 |
|--------|------|------------|
| MAU | 50,000 | 50-200 |
| DB 용량 | 500 MB | ~10 MB |
| Storage | 1 GB | ~100 MB |
| Realtime 동시접속 | 200 | 5-20 |
| Bandwidth | 5 GB | <1 GB |

---

## 3. 확정된 설계 결정

| 항목 | 결정 | 비고 |
|------|------|------|
| OAuth 제공자 | Google + 카카오 | 네이버는 추후 필요시 추가 |
| 블로그 에디터 | Tiptap WYSIWYG | 노션 스타일 리치 에디터 |
| 이미지 업로드 | Supabase Storage 파일 업로드 | URL 입력도 병행 가능 |
| 댓글 구조 | 대댓글 (스레드) | `parent_id` 기반 중첩 |
| DB 마이그레이션 범위 | blog + jobs + library + launches | companies/founders/people은 Phase 6 (향후) |
| Admin 패널 | 단계별 구축 | Phase 4: 유저+블로그, Phase 5: 나머지 |

---

## 4. 역할 체계

```
admin (관리자)
  - SPEC 소식(뉴스) 작성 가능
  - 블로그 작성 가능
  - 모든 콘텐츠 CRUD
  - 유저 역할 변경 (승격/강등)
  - /admin 패널 접근

mentor (멘토)
  - 블로그 작성 가능
  - 댓글, 반응 가능

alumni (알럼)
  - 블로그 작성 가능
  - 댓글, 반응 가능
  - (러너/프러너 기간 종료 후 관리자가 수동 승격)

runner (러너)
  - 블로그 작성 가능
  - 댓글, 반응 가능

pre_runner (프러너)
  - 블로그 작성 가능
  - 댓글, 반응 가능

outsider (외부인)
  - 콘텐츠 열람만 가능
  - 글쓰기, 댓글, 반응 불가
  - 신규 가입 시 기본 역할
```

### 4.1 블로그 분리

| 섹션 | 라우트 | 작성 권한 | 콘텐츠 |
|------|--------|----------|--------|
| SPEC 소식 | `/blog?tab=news` | admin만 | 공식 공지, 이벤트, 배치 업데이트 |
| SPEC 블로그 | `/blog?tab=blog` | 모든 멤버 (pre_runner 이상) | 개인 포스트, 학습 기록, 경험 공유 |

단일 `posts` 테이블에 `type` 컬럼 (`'news'` | `'blog'`)으로 구분. RLS 정책으로 `type='news'` INSERT는 admin만 허용.

---

## 5. 데이터베이스 스키마

### 5.1 ER 다이어그램

```
                    ┌─────────────┐
                    │  auth.users │  (Supabase 관리)
                    └──────┬──────┘
                           │ trigger: on_auth_user_created
                           v
                    ┌─────────────┐
                    │  profiles   │  id, name, role, slug, batch...
                    └──┬───┬───┬──┘
                       │   │   │
          ┌────────────┘   │   └──────────────┐
          v                v                   v
    ┌───────────┐   ┌────────────┐     ┌────────────┐
    │   posts   │   │  comments  │     │ reactions   │
    │ (news +   │<──│  post_id   │     │  post_id    │
    │  blog)    │   │  author_id │     │  user_id    │
    └─────┬─────┘   │  parent_id │     │  emoji      │
          │         └────────────┘     └────────────┘
          │ many-to-many
          v
    ┌───────────┐     ┌──────────┐
    │ post_tags │────>│   tags   │
    └───────────┘     └──────────┘

    ┌───────────┐   ┌────────────────┐   ┌───────────┐
    │   jobs    │   │ library_items  │   │ launches  │
    │ (admin)   │   │   (admin)      │   │  (admin)  │
    └───────────┘   └────────────────┘   └───────────┘

    --- 정적 유지 (Phase 6 향후) ---
    companies-data.ts, company-details-data.ts
    founders-data.ts, people-data.ts
```

### 5.2 테이블 정의

#### profiles (auth.users 확장)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | auth.users(id) FK |
| name | TEXT NOT NULL | 이름 |
| slug | TEXT UNIQUE | URL 식별자 |
| role | user_role DEFAULT 'outsider' | 역할 |
| bio | TEXT | 자기소개 |
| photo | TEXT | 아바타 URL |
| batch | TEXT | 기수 (예: '4기') |
| company | TEXT | 소속 회사 |
| created_at | TIMESTAMPTZ | 가입일 |
| updated_at | TIMESTAMPTZ | 수정일 |

자동 트리거: `auth.users` INSERT 시 `profiles` 자동 생성.
Custom Access Token Hook: JWT에 `user_role` 자동 주입.

#### posts (블로그 + 소식 통합)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 자동 생성 |
| slug | TEXT UNIQUE NOT NULL | URL 식별자 |
| title | TEXT NOT NULL | 제목 |
| excerpt | TEXT | 요약 |
| content | TEXT NOT NULL | 본문 (Tiptap JSON 또는 HTML) |
| type | post_type NOT NULL DEFAULT 'blog' | 'news' 또는 'blog' |
| author_id | UUID FK → profiles | 작성자 |
| featured | BOOLEAN DEFAULT false | 피처 여부 |
| image_url | TEXT | 대표 이미지 |
| published | BOOLEAN DEFAULT false | 공개 여부 |
| created_at | TIMESTAMPTZ | 작성일 |
| updated_at | TIMESTAMPTZ | 수정일 |

#### tags

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 자동 생성 |
| slug | TEXT UNIQUE NOT NULL | URL 식별자 |
| label | TEXT NOT NULL | 표시 이름 (예: '커리큘럼') |

#### post_tags (다대다)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| post_id | UUID FK → posts | |
| tag_id | UUID FK → tags | |
| PK | (post_id, tag_id) | |

#### comments (스레드형)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 자동 생성 |
| post_id | UUID FK → posts NOT NULL | 대상 포스트 |
| author_id | UUID FK → profiles NOT NULL | 작성자 |
| content | TEXT NOT NULL | 댓글 내용 |
| parent_id | UUID FK → comments NULLABLE | 대댓글 시 부모 댓글 ID |
| created_at | TIMESTAMPTZ | 작성일 |
| updated_at | TIMESTAMPTZ | 수정일 |

#### reactions (이모지 반응)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 자동 생성 |
| post_id | UUID FK → posts NOT NULL | 대상 포스트 |
| user_id | UUID FK → profiles NOT NULL | 반응한 유저 |
| emoji | TEXT NOT NULL | 이모지 (예: '👍', '🔥', '❤️', '🎉', '🤔', '👀') |
| created_at | TIMESTAMPTZ | |
| UNIQUE | (post_id, user_id, emoji) | 유저당 이모지별 1개 |

#### jobs

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 자동 생성 |
| company | TEXT NOT NULL | 회사명 |
| company_slug | TEXT | 회사 슬러그 |
| title | TEXT NOT NULL | 직무 제목 |
| description | TEXT | 설명 |
| role | TEXT | 직무 분류 |
| role_slug | TEXT | 직무 슬러그 |
| location | TEXT | 근무지 |
| location_slug | TEXT | 근무지 슬러그 |
| salary | TEXT | 급여 |
| tags | TEXT[] | 태그 배열 |
| remote | BOOLEAN DEFAULT false | 원격 가능 |
| logo_color | TEXT | 로고 배경색 |
| logo_letter | TEXT | 로고 이니셜 |
| posted | TIMESTAMPTZ DEFAULT now() | 게시일 |
| active | BOOLEAN DEFAULT true | 활성 여부 |
| created_by | UUID FK → profiles | 작성자 |

#### library_items

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 자동 생성 |
| slug | TEXT UNIQUE NOT NULL | URL 식별자 |
| title | TEXT NOT NULL | 제목 |
| author | TEXT | 저자/멘토 |
| author_role | TEXT | 직함 |
| type | content_type NOT NULL | Video/Essay/Podcast/Guide |
| categories | TEXT[] | 카테고리 배열 |
| description | TEXT | 요약 |
| body | TEXT | 본문 |
| date | TEXT | 날짜 |
| views | INTEGER DEFAULT 0 | 조회수 |
| duration | TEXT | 재생 시간 |
| youtube_id | TEXT | YouTube 임베드 ID |
| featured | BOOLEAN DEFAULT false | 피처 여부 |
| thumbnail_color | TEXT | 대체 배경색 |
| created_at | TIMESTAMPTZ | |

#### launches

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID PK | 자동 생성 |
| company | TEXT NOT NULL | 회사명 |
| slug | TEXT | 슬러그 |
| tagline | TEXT | 한줄 소개 |
| description | TEXT | 설명 |
| category | TEXT | 카테고리 |
| batch | TEXT | 배치 |
| votes | INTEGER DEFAULT 0 | 투표 수 |
| created_at | TIMESTAMPTZ | |

### 5.3 RLS (Row Level Security) 정책 요약

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| profiles | 모든 유저 | 트리거 자동 | 본인 또는 admin | - |
| posts | 공개된 글 (+ 본인 미공개 글 + admin) | can_write + (news는 admin만) | 본인 또는 admin | 본인 또는 admin |
| comments | 모든 유저 | can_write (author_id=본인) | 본인 | 본인 또는 admin |
| reactions | 모든 유저 | can_write (user_id=본인) | - | 본인 |
| tags | 모든 유저 | admin | admin | admin |
| post_tags | 모든 유저 | 글 작성자 또는 admin | - | 글 작성자 또는 admin |
| jobs | 활성(active) 또는 admin | admin | admin | admin |
| library_items | 모든 유저 | admin | admin | admin |
| launches | 모든 유저 | admin | admin | admin |

`can_write` = role이 pre_runner, runner, alumni, mentor, admin 중 하나.

---

## 6. 실행 계획

### Phase 0: 기반 셋업 (Day 1-2, ~2.5h)

Supabase 프로젝트 생성, 클라이언트 유틸리티, 미들웨어 스켈레톤.
사용자에게 보이는 변화 없음.

| # | 작업 | 소요 | 선행 | 생성/수정 파일 |
|---|------|------|------|--------------|
| 0.1 | Supabase 프로젝트 생성 (dashboard.supabase.com) | 15m | - | (외부) |
| 0.2 | `.env.local` 생성 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`) | 10m | 0.1 | `.env.local`, `.env.example` |
| 0.3 | `@supabase/supabase-js` + `@supabase/ssr` 설치 | 5m | - | `package.json` |
| 0.4 | `lib/supabase/server.ts` — 서버 클라이언트 팩토리 (쿠키 핸들링) | 30m | 0.2, 0.3 | `lib/supabase/server.ts` |
| 0.5 | `lib/supabase/client.ts` — 브라우저 클라이언트 팩토리 (싱글톤) | 15m | 0.2, 0.3 | `lib/supabase/client.ts` |
| 0.6 | `lib/supabase/middleware.ts` — 세션 리프레시 + 쿠키 업데이트 헬퍼 | 30m | 0.4 | `lib/supabase/middleware.ts` |
| 0.7 | `middleware.ts` 루트 생성 — 라우트 보호 스켈레톤 (패스스루, 세션 리프레시만) | 30m | 0.6 | `middleware.ts` |
| 0.8 | `.env.local`을 `.gitignore`에 추가, `.env.example` 생성 | 5m | 0.2 | `.gitignore`, `.env.example` |
| 0.9 | `next.config.ts` — Supabase Storage 도메인을 `remotePatterns`에 추가 | 10m | 0.1 | `next.config.ts` |

**병렬 가능**: 0.1 + 0.3 동시. 이후 0.4 + 0.5 동시.

**체크포인트**: 사이트가 기존과 동일하게 작동하며, Supabase 클라이언트 사용 준비 완료.

---

### Phase 1: 인증 시스템 (Day 2-4, ~8h)

Google/카카오 로그인, 역할 표시, Navbar 인증 상태, 라우트 보호.

| # | 작업 | 소요 | 선행 | 생성/수정 파일 |
|---|------|------|------|--------------|
| 1.1 | DB 마이그레이션: `profiles` 테이블 + `handle_new_user()` 트리거 + Custom Access Token Hook | 30m | Phase 0 | (Supabase SQL) |
| 1.2 | Supabase Auth 설정: Google + Kakao OAuth 활성화, redirect URL 설정 | 30m | 0.1 | (외부: Supabase + Google Cloud + Kakao Developers) |
| 1.3 | TypeScript 타입 생성: `npx supabase gen types typescript` | 20m | 1.1 | `lib/supabase/types.ts` |
| 1.4 | `app/login/page.tsx` — 로그인 페이지 (OAuth 버튼, SPEC 브랜딩, 한국어) | 1.5h | 0.4, 1.2 | `app/login/page.tsx` |
| 1.5 | `app/auth/callback/route.ts` — OAuth 콜백 핸들러 | 30m | 0.4 | `app/auth/callback/route.ts` |
| 1.6 | `hooks/useUser.ts` — 클라이언트 훅 `{ user, role, isLoading }` | 30m | 0.5 | `hooks/useUser.ts` |
| 1.7 | `components/Navbar.tsx` 수정 — 로그인/로그아웃 버튼, 아바타+이름+역할 배지 | 1h | 1.4, 1.6 | `components/Navbar.tsx` |
| 1.8 | `middleware.ts` 업데이트 — `/admin/*` admin만, `/blog/write` + `/blog/edit/*` can_write만 | 45m | 0.7, 1.1 | `middleware.ts` |
| 1.9 | `lib/auth.ts` — 서버 헬퍼: `getCurrentUser()`, `requireAuth()`, `requireRole()`, `isAdmin()` | 30m | 0.4, 1.1 | `lib/auth.ts` |
| 1.10 | `app/profile/page.tsx` — 프로필 조회 (이름, 이메일, 역할 배지, 가입일) | 45m | 1.6 | `app/profile/page.tsx` |
| 1.11 | `profiles` RLS 정책 적용 | 30m | 1.1 | (Supabase SQL) |

**병렬 가능**: 1.1 + 1.2 동시 / 1.4 + 1.5 + 1.6 동시 / 1.3은 1.1 완료 후.

**체크포인트**: 로그인 → Google/카카오 선택 → 리디렉트 → Navbar에 이름+"외부인" 배지. Admin 라우트 403.

---

### Phase 2: 블로그 DB 마이그레이션 + 글쓰기 (Day 4-8, ~13h)

블로그를 Supabase에서 서빙. 소식/블로그 탭 분리. 멤버 글쓰기. Tiptap 에디터. 이미지 업로드.

| # | 작업 | 소요 | 선행 | 생성/수정 파일 |
|---|------|------|------|--------------|
| 2.1 | DB 마이그레이션: `posts`, `tags`, `post_tags` 테이블 + 인덱스 | 30m | Phase 0 | (Supabase SQL) |
| 2.2 | 시드 스크립트: `blogData.ts` 파싱 → Supabase INSERT (20 posts + 9 tags) | 1h | 2.1 | `scripts/seed-blog.ts` |
| 2.3 | `posts`, `tags`, `post_tags` RLS 정책 적용 | 1h | 2.1, 1.1 | (Supabase SQL) |
| 2.4 | `lib/api.ts` 업데이트 — 블로그 함수들을 Supabase 쿼리로 교체 | 1.5h | 2.1, 0.4 | `lib/api.ts` |
| 2.5 | `app/blog/page.tsx` 수정 — "소식"/"블로그" 탭 UI, DB에서 fetch | 1.5h | 2.4 | `app/blog/page.tsx` |
| 2.6 | `app/blog/[slug]/page.tsx` 수정 — DB에서 단일 포스트 fetch, 작성자 정보 join | 45m | 2.4 | `app/blog/[slug]/page.tsx` |
| 2.7 | `app/blog/tag/[tag]/page.tsx` 수정 — DB에서 태그 필터링 | 30m | 2.4 | `app/blog/tag/[tag]/page.tsx` |
| 2.8 | Tiptap 설치 + 에디터 컴포넌트 구축 (`@tiptap/react`, `@tiptap/starter-kit` 등) | 2h | - | `components/blog/TiptapEditor.tsx`, `package.json` |
| 2.9 | Supabase Storage 설정 — `blog-images` 버킷 생성, 업로드 유틸리티 | 1h | 0.1 | `lib/storage.ts` |
| 2.10 | `app/blog/write/page.tsx` — 글쓰기 페이지: 제목, Tiptap 에디터, 태그, 타입 선택, 이미지 업로드, 미리보기 | 2.5h | 2.8, 2.9, 1.9 | `app/blog/write/page.tsx` |
| 2.11 | `app/blog/edit/[slug]/page.tsx` — 글 수정 (작성자/admin만, 폼 공유) | 1h | 2.10 | `app/blog/edit/[slug]/page.tsx` |
| 2.12 | Server Actions `lib/actions/posts.ts`: `createPost()`, `updatePost()`, `deletePost()`, `toggleFeatured()`, `togglePublished()` | 1.5h | 2.1, 1.9 | `lib/actions/posts.ts` |
| 2.13 | `generateStaticParams` DB fetch로 전환, ISR `revalidate = 60` 추가 | 20m | 2.4 | `app/blog/[slug]/page.tsx` |
| 2.14 | `blogData.ts` 삭제 (모든 페이지 DB 작동 확인 후) | 10m | 2.5, 2.6, 2.7 | 삭제: `app/blog/blogData.ts` |
| 2.15 | "글쓰기" 버튼 블로그 페이지에 추가 (pre_runner 이상만 표시) | 20m | 2.5, 1.6 | `app/blog/page.tsx` |

**병렬 가능**: 2.2 + 2.3 + 2.8 + 2.9 동시 / 2.10 → 2.11 순차.

**체크포인트**: 블로그 DB 서빙. 소식/블로그 탭 작동. 멤버 "글쓰기" 가능. Tiptap 에디터로 리치 콘텐츠 작성. 이미지 업로드. URL 미변경.

---

### Phase 3: 댓글 & 반응 (Day 8-10, ~8h)

이모지 반응 (6종) + 스레드형 댓글.

| # | 작업 | 소요 | 선행 | 생성/수정 파일 |
|---|------|------|------|--------------|
| 3.1 | DB 마이그레이션: `comments` + `reactions` 테이블 + 인덱스 + UNIQUE 제약 | 20m | Phase 0 | (Supabase SQL) |
| 3.2 | `comments`, `reactions` RLS 정책 적용 | 30m | 3.1, 1.1 | (Supabase SQL) |
| 3.3 | Server Actions `lib/actions/comments.ts`: `addComment()`, `deleteComment()`, `getCommentsByPost()` | 1h | 3.1, 1.9 | `lib/actions/comments.ts` |
| 3.4 | Server Actions `lib/actions/reactions.ts`: `toggleReaction()`, `getReactionsByPost()` | 30m | 3.1, 1.9 | `lib/actions/reactions.ts` |
| 3.5 | `components/blog/CommentSection.tsx` — 스레드형 댓글 UI: 댓글 목록(중첩), 작성 폼, 답글 버튼, 삭제, 로그인 프롬프트 | 2.5h | 3.3, 1.6 | `components/blog/CommentSection.tsx` |
| 3.6 | `components/blog/ReactionBar.tsx` — 이모지 6종 (👍🔥❤️🎉🤔👀), 카운트, 내 반응 하이라이트, 토글 | 1.5h | 3.4, 1.6 | `components/blog/ReactionBar.tsx` |
| 3.7 | ReactionBar Optimistic UI — 서버 응답 전 즉시 토글, 에러 시 롤백 | 45m | 3.6 | `components/blog/ReactionBar.tsx` |
| 3.8 | `app/blog/[slug]/page.tsx`에 CommentSection + ReactionBar 통합 | 30m | 3.5, 3.6 | `app/blog/[slug]/page.tsx` |

**병렬 가능**: 3.3 + 3.4 동시 / 3.5 + 3.6 동시.

**체크포인트**: 모든 블로그 포스트에 반응바 + 댓글 섹션. 멤버는 반응/댓글 가능. 외부인은 "로그인이 필요합니다" 프롬프트.

---

### Phase 4: 관리자 패널 — 유저 + 블로그 (Day 10-12, ~8h)

`/admin` 대시보드. 유저 역할 관리, 블로그 CRUD.

| # | 작업 | 소요 | 선행 | 생성/수정 파일 |
|---|------|------|------|--------------|
| 4.1 | Shadcn/ui 초기화 + 필수 컴포넌트 설치 (Button, Input, Select, Table, Dialog, Badge, Tabs, Textarea, DropdownMenu) | 30m | - | `components/ui/*`, `package.json` |
| 4.2 | `app/admin/layout.tsx` — 관리자 셸: 사이드바 (Dashboard, Users, Posts), 브레드크럼, "사이트로 돌아가기" | 1h | 4.1, 1.8 | `app/admin/layout.tsx` |
| 4.3 | `app/admin/page.tsx` — 대시보드: 통계 카드 (역할별 유저 수, 타입별 글 수, 댓글 수) | 1h | 4.2, 0.4 | `app/admin/page.tsx` |
| 4.4 | `app/admin/users/page.tsx` — 유저 목록 테이블: 이름, 이메일, 역할(배지), 가입일. 역할 변경 드롭다운. 검색/필터. | 2h | 4.2, 1.9 | `app/admin/users/page.tsx` |
| 4.5 | Server Action `lib/actions/admin.ts`: `updateUserRole()` — admin만, profiles.role 업데이트 | 30m | 1.9 | `lib/actions/admin.ts` |
| 4.6 | `app/admin/posts/page.tsx` — 글 목록: 제목, 타입(news/blog), 작성자, 공개 토글, 피처 토글, 작성일. 삭제. | 2h | 4.2, 2.12 | `app/admin/posts/page.tsx` |
| 4.7 | `app/admin/posts/new/page.tsx` — "SPEC 소식" 작성 (type=news 고정, Tiptap 에디터 재사용) | 1h | 2.10, 4.2 | `app/admin/posts/new/page.tsx` |

**병렬 가능**: 4.4 + 4.6 독립 (둘 다 4.2만 선행).

**체크포인트**: `/admin` → 대시보드 통계. 유저 역할 변경. 블로그 글 관리 (공개/비공개/피처/삭제). 비admin은 리디렉트.

---

### Phase 5: 나머지 데이터 마이그레이션 + Admin 확장 (Day 12-14, ~9h)

Jobs, library, launches를 Supabase로 전환. Admin CRUD 추가.

| # | 작업 | 소요 | 선행 | 생성/수정 파일 |
|---|------|------|------|--------------|
| 5.1 | DB 마이그레이션: `jobs`, `library_items`, `launches` 테이블 생성 | 30m | Phase 0 | (Supabase SQL) |
| 5.2 | 시드 스크립트 3개: jobs (15건), library (35건), launches (31건) | 1.5h | 5.1 | `scripts/seed-jobs.ts`, `scripts/seed-library.ts`, `scripts/seed-launches.ts` |
| 5.3 | RLS 정책: jobs, library_items, launches (공개 읽기, admin CRUD) | 30m | 5.1 | (Supabase SQL) |
| 5.4 | `lib/api.ts` 업데이트: jobs, library, launches 함수 Supabase 쿼리로 교체 | 2.5h | 5.1, 0.4 | `lib/api.ts` |
| 5.5 | 검증: `/jobs`, `/jobs/role/[role]`, `/jobs/location/[city]` 필터, 카운트, 페이지네이션 | 30m | 5.4 | (테스트) |
| 5.6 | 검증: `/library`, `/library/[slug]`, `/library/search` 검색, 카테고리, YouTube 임베드 | 30m | 5.4 | (테스트) |
| 5.7 | 검증: `/launches` 카테고리 필터, 투표 수 | 15m | 5.4 | (테스트) |
| 5.8 | `generateStaticParams` DB fetch 전환 + ISR revalidate | 30m | 5.4 | jobs/library 라우트 파일들 |
| 5.9 | 정적 파일 삭제 (검증 후): `jobsData.ts`, `library-data.ts`, `launches-data.ts` | 10m | 5.5, 5.6, 5.7 | 3개 파일 삭제 |
| 5.10 | Admin - `app/admin/jobs/page.tsx`: CRUD 테이블 + 추가 다이얼로그 | 1.5h | 4.2 | `app/admin/jobs/page.tsx` |
| 5.11 | Admin - `app/admin/library/page.tsx`: CRUD 테이블 + 추가 다이얼로그 | 1.5h | 4.2 | `app/admin/library/page.tsx` |
| 5.12 | Admin - `app/admin/launches/page.tsx`: CRUD 테이블 | 1h | 4.2 | `app/admin/launches/page.tsx` |
| 5.13 | Server Actions: `lib/actions/jobs.ts`, `lib/actions/library.ts`, `lib/actions/launches.ts` | 2h | 5.1, 1.9 | 3개 파일 |

**병렬 가능**: 5.2 (시드 3개) 동시 / 5.10 + 5.11 + 5.12 독립 / 5.5 + 5.6 + 5.7 동시.

**체크포인트**: Jobs, library, launches 동적 전환. Admin에서 CRUD 가능. 정적 파일 삭제. URL 미변경.

---

### Phase 6: Companies/Founders/People 마이그레이션 (향후, ~11.5h)

> 현재 스코프 밖. 필요 시 별도 진행.

| # | 작업 | 소요 |
|---|------|------|
| 6.1 | `companies` + `company_details` 통합 테이블 설계, 슬러그 정규화 | 1h |
| 6.2 | 테이블 생성, 시드 (28+10건) | 2h |
| 6.3 | `founders` 테이블, 시드 (24건) | 1h |
| 6.4 | `people` 테이블, 시드 (16건) | 1h |
| 6.5 | `lib/api.ts` 업데이트 | 1.5h |
| 6.6 | Admin CRUD 3개 섹션 | 4h |
| 6.7 | 검증 | 1h |

---

## 7. 의존성 그래프

```
Phase 0 (기반)
  │
  ├──> Phase 1 (인증)
  │      │
  │      ├──> Phase 2 (블로그 마이그레이션)
  │      │      │
  │      │      ├──> Phase 3 (댓글 & 반응)
  │      │      │
  │      │      └──> Phase 4 (Admin: 유저 + 블로그)
  │      │             │
  │      │             └──> Phase 5 (나머지 마이그레이션 + Admin 확장)
  │      │                    │
  │      │                    └──> Phase 6 (향후)
  │      │
  │      └──> Phase 4.4-4.5 (유저 관리)는 Phase 1 직후 시작 가능
  │
  └──> Phase 5.10-5.13 (Admin jobs/library/launches)는
       Phase 0 + 1 후 바로 시작 가능 (블로그 불필요)
```

---

## 8. 타임라인

```
Day 1-2   ████ Phase 0 (기반)
Day 2-4   ████████ Phase 1 (인증)
Day 4-8   ████████████████ Phase 2 (블로그)
Day 8-10  ████████ Phase 3 (댓글/반응)
Day 10-12 ████████ Phase 4 (Admin 유저+블로그)
Day 12-14 ████████ Phase 5 (나머지 마이그레이션)
```

| Phase | 기간 | 소요 | 누적 |
|-------|------|------|------|
| 0: 기반 | Day 1-2 | 2.5h | 2.5h |
| 1: 인증 | Day 2-4 | 8h | 10.5h |
| 2: 블로그 | Day 4-8 | 13h | 23.5h |
| 3: 댓글/반응 | Day 8-10 | 8h | 31.5h |
| 4: Admin (유저+블로그) | Day 10-12 | 8h | 39.5h |
| 5: 나머지 마이그레이션 | Day 12-14 | 9h | 48.5h |
| **합계** | **14일** | **~49h** | |

---

## 9. 생성될 파일 목록

```
yc-clone/
├── .env.local                              # Phase 0
├── .env.example                            # Phase 0
├── middleware.ts                            # Phase 0 → Phase 1 업데이트
├── lib/
│   ├── supabase/
│   │   ├── server.ts                       # Phase 0
│   │   ├── client.ts                       # Phase 0
│   │   ├── middleware.ts                   # Phase 0
│   │   └── types.ts                        # Phase 1 (자동 생성)
│   ├── auth.ts                             # Phase 1
│   ├── storage.ts                          # Phase 2
│   └── actions/
│       ├── posts.ts                        # Phase 2
│       ├── comments.ts                     # Phase 3
│       ├── reactions.ts                    # Phase 3
│       ├── admin.ts                        # Phase 4
│       ├── jobs.ts                         # Phase 5
│       ├── library.ts                      # Phase 5
│       └── launches.ts                     # Phase 5
├── hooks/
│   └── useUser.ts                          # Phase 1
├── app/
│   ├── login/page.tsx                      # Phase 1
│   ├── auth/callback/route.ts              # Phase 1
│   ├── profile/page.tsx                    # Phase 1
│   ├── blog/
│   │   ├── write/page.tsx                  # Phase 2
│   │   └── edit/[slug]/page.tsx            # Phase 2
│   └── admin/
│       ├── layout.tsx                      # Phase 4
│       ├── page.tsx                        # Phase 4 (대시보드)
│       ├── users/page.tsx                  # Phase 4
│       ├── posts/
│       │   ├── page.tsx                    # Phase 4
│       │   └── new/page.tsx                # Phase 4
│       ├── jobs/page.tsx                   # Phase 5
│       ├── library/page.tsx                # Phase 5
│       └── launches/page.tsx               # Phase 5
├── components/
│   ├── blog/
│   │   ├── TiptapEditor.tsx                # Phase 2
│   │   ├── CommentSection.tsx              # Phase 3
│   │   └── ReactionBar.tsx                 # Phase 3
│   └── ui/                                 # Phase 4 (shadcn/ui)
│       ├── button.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── dialog.tsx
│       ├── badge.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── dropdown-menu.tsx
└── scripts/                                # 일회성 시드 스크립트
    ├── seed-blog.ts                        # Phase 2
    ├── seed-jobs.ts                        # Phase 5
    ├── seed-library.ts                     # Phase 5
    └── seed-launches.ts                    # Phase 5
```

### 수정 파일

| 파일 | Phase | 변경 내용 |
|------|-------|----------|
| `lib/api.ts` | 2, 5 | 정적 → Supabase 쿼리 |
| `components/Navbar.tsx` | 1 | 로그인/로그아웃 UI 추가 |
| `app/blog/page.tsx` | 2 | 소식/블로그 탭, DB fetch |
| `app/blog/[slug]/page.tsx` | 2, 3 | DB fetch, 댓글/반응 통합 |
| `app/blog/tag/[tag]/page.tsx` | 2 | DB fetch |
| `next.config.ts` | 0 | remotePatterns 추가 |
| `package.json` | 0, 2, 4 | 의존성 추가 |
| `.gitignore` | 0 | .env.local 추가 |

### 삭제 파일

| 파일 | Phase | 이유 |
|------|-------|------|
| `app/blog/blogData.ts` | 2 | DB로 마이그레이션 완료 |
| `app/jobs/jobsData.ts` | 5 | DB로 마이그레이션 완료 |
| `app/library/library-data.ts` | 5 | DB로 마이그레이션 완료 |
| `lib/launches-data.ts` | 5 | DB로 마이그레이션 완료 |

---

## 10. 전제 조건

- Supabase 무료 계정 생성 필요
- Google Cloud Console에서 OAuth 클라이언트 ID 발급 필요
- Kakao Developers에서 앱 등록 + OAuth 설정 필요
- 개발자 1명 기준 14일 (하루 3-4시간 작업 가정)

---

## 11. 리스크 & 완화

| 리스크 | 확률 | 영향 | 완화 방안 |
|--------|------|------|----------|
| Supabase 무료 티어 한도 초과 | 낮음 | 중간 | 50K MAU vs 200 유저, 500MB vs ~10MB |
| Tiptap 번들 사이즈 증가 | 중간 | 낮음 | dynamic import로 에디터만 lazy load |
| OAuth 설정 복잡도 | 중간 | 낮음 | Supabase 공식 가이드 따라 설정 |
| RLS 정책 버그 | 중간 | 높음 | 각 Phase마다 권한 테스트 포함 |
| 마이그레이션 중 데이터 손실 | 낮음 | 높음 | 정적 파일은 삭제 전 DB 검증 완료 확인 |
