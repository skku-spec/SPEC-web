# SPEC Database ERD (Entity-Relationship Diagram)

> 마지막 업데이트: 2026-02-27
> DB: Supabase (PostgreSQL)  
> ✅ 역할 마이그레이션 완료 (2026-02-27): `user_role` enum을 6값에서 3값으로 단순화
> - 변경: `outsider`, `pre_runner`, `runner`, `alumni`, `mentor`, `admin` → `outsider`, `member`, `admin`
> - 테이블: 실제 프로덕션에는 10개만 존재 (members, projects, member_projects, project_news는 스키마 정의만 존재)

---

## 목차

1. [ERD 다이어그램](#erd-다이어그램)
2. [Custom Types (ENUM)](#custom-types-enum)
3. [테이블 상세](#테이블-상세)
4. [관계 (Relationships)](#관계-relationships)
5. [인덱스](#인덱스)
6. [트리거 & 함수](#트리거--함수)
7. [RLS 정책 요약](#rls-정책-요약)

---

## ERD 다이어그램

```
┌─────────────────┐          ┌─────────────────┐
│   auth.users    │          │    profiles      │
│─────────────────│          │─────────────────│
│ id (uuid) PK    │──1:1────▶│ id (uuid) PK/FK │
└─────────────────┘          │ name             │
                             │ slug (unique)    │
                             │ role (user_role) │
                             │ bio              │
                             │ photo            │
                             │ batch            │
                             │ company          │
                             │ username         │
                             │ first_name       │
                             │ last_name        │
                             │ linkedin_url     │
                             │ created_at       │
                             │ updated_at       │
                             └────────┬─────────┘
                                      │
                    ┌─────────────────┼──────────────────┐
                    │                 │                    │
                    ▼                 ▼                    ▼
         ┌──────────────┐  ┌──────────────┐   ┌──────────────┐
         │    posts      │  │   comments   │   │  reactions    │
         │──────────────│  │──────────────│   │──────────────│
         │ id (uuid) PK  │  │ id (uuid) PK │   │ id (uuid) PK │
         │ slug (unique) │  │ post_id FK ──│──▶│ post_id FK   │
         │ title         │  │ author_id FK │   │ user_id FK   │
         │ excerpt       │  │ content      │   │ emoji        │
         │ content       │  │ parent_id FK │──┐│ created_at   │
         │ type(post_type│  │ created_at   │  ││              │
         │ author_id FK──│─▶│ updated_at   │  │└──────────────┘
         │ featured      │  └──────────────┘  │
         │ image_url     │         ▲           │
         │ published     │         │ self-ref  │
         │ created_at    │         └───────────┘
         │ updated_at    │
         └───────┬───────┘
                 │
                 │ M:N
                 ▼
         ┌──────────────┐       ┌──────────────┐
         │  post_tags    │       │    tags       │
         │──────────────│       │──────────────│
         │ post_id FK ──│──────▶│ id (uuid) PK │
         │ tag_id FK  ──│──────▶│ slug (unique) │
         │ (composite PK│       │ label(unique) │
         └──────────────┘       └──────────────┘


         ┌──────────────┐
         │    jobs       │
         │──────────────│
         │ id (uuid) PK  │
         │ company       │
         │ company_slug  │
         │ title         │
         │ description   │
         │ role          │
         │ role_slug     │
         │ location      │
         │ location_slug │
         │ salary        │
         │ tags (text[]) │
         │ remote        │
         │ logo_color    │
         │ logo_letter   │
         │ logo_url      │
         │ posted        │
         │ active        │
         │ created_by FK─│──▶ profiles.id
         └──────────────┘


         ┌──────────────┐
         │ library_items │
         │──────────────│
         │ id (uuid) PK  │
         │ slug (unique) │
         │ title         │
         │ author        │
         │ author_role   │
         │ type(content_ │
         │      type)    │
         │ categories[]  │
         │ description   │
         │ body          │
         │ date          │
         │ views         │
         │ duration      │
         │ youtube_id    │
         │ featured      │
         │ thumbnail_col │
         │ created_at    │
         └──────────────┘


         ┌──────────────┐
         │   launches    │
         │──────────────│
         │ id (uuid) PK  │
         │ company       │
         │ slug (unique) │
         │ tagline       │
         │ description   │
         │ category      │
         │ batch         │
         │ votes         │
         │ created_at    │
         └──────────────┘


         ┌──────────────┐
         │ applications  │
         │──────────────│
         │ id (uuid) PK  │
         │ name          │
         │ email         │
         │ student_id    │
         │ phone         │
         │ major         │
         │ batch         │
         │ introduction  │
         │ vision        │
         │ startup_idea  │
         │ portfolio_url │
         │ equip         │
         │ photo_exp     │
         │ design_exp    │
         │ figma         │
         │ illustrator   │
         │ experience_   │
         │   extra       │
         │ status        │
         │ created_at    │
         └──────────────┘


   ┌──────────────┐     M:N      ┌──────────────┐
   │   members     │◀────────────▶│   projects    │
   │──────────────│  member_     │──────────────│
   │ id (uuid) PK │  projects    │ id (uuid) PK │
   │ name         │              │ name          │
   │ slug(unique) │              │ slug (unique) │
   │ student_id   │              │ one_liner     │
   │ phone        │  ┌────────┐  │ description   │
   │ email        │  │member_ │  │ batch         │
   │ major        │  │projects│  │ industries[]  │
   │ runner_batch │  │────────│  │ region        │
   │ preneur_batch│  │member_ │  │ team_size     │
   │ batch_tags[] │  │ id FK──│─▶│ is_hiring     │
   │ member_type  │◀─│project_│  │ status        │
   │ department   │  │ id FK──│─▶│ website       │
   │ role         │  │role    │  │ linkedin_url  │
   │ parts[]      │  └────────┘  │ twitter_url   │
   │ photo_url    │              │ github_url    │
   │ linkedin_url │              │ logo_url      │
   │ bio          │              │ category      │
   │ notes        │              │ founded_year  │
   │ created_at   │              │ is_top_company│
   │ updated_at   │              │ is_nonprofit  │
   └──────────────┘              │ is_women_     │
                                 │   founded     │
                                 │ created_at    │
                                 │ updated_at    │
                                 └───────┬───────┘
                                         │ 1:N
                                         ▼
                                 ┌──────────────┐
                                 │ project_news  │
                                 │──────────────│
                                 │ id (uuid) PK │
                                 │ project_id FK│
                                 │ title        │
                                 │ url          │
                                 │ date         │
                                 │ created_at   │
                                 └──────────────┘
```

---

## Custom Types (ENUM)

| Type | Values | 사용처 |
|------|--------|--------|
| `user_role` | `outsider`, `member`, `admin` | `profiles.role` |
| `post_type` | `news`, `blog` | `posts.type` |
| `content_type` | `Video`, `Essay`, `Podcast`, `Guide` | `library_items.type` |



---

## 테이블 상세

### 1. `profiles` — 사용자 프로필 (auth.users 확장)

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | uuid | NOT NULL | — | PK, FK → auth.users(id) ON DELETE CASCADE |
| `name` | text | NOT NULL | `''` | |
| `slug` | text | NOT NULL | — | UNIQUE, CHECK(length > 0) |
| `role` | user_role | NOT NULL | `'outsider'` | 값: `outsider`, `member`, `admin` |
| `bio` | text | NOT NULL | `''` | |
| `photo` | text | NOT NULL | `''` | |
| `batch` | text | NOT NULL | `''` | |
| `company` | text | NOT NULL | `''` | |
| `username` | text | NOT NULL | `''` | UNIQUE (WHERE != '') |
| `first_name` | text | NOT NULL | `''` | |
| `last_name` | text | NOT NULL | `''` | |
| `linkedin_url` | text | NOT NULL | `''` | |
| `created_at` | timestamptz | NOT NULL | `now()` | |
| `updated_at` | timestamptz | NOT NULL | `now()` | auto-trigger |

---

### 2. `posts` — 블로그/뉴스 글

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `slug` | text | NOT NULL | — | UNIQUE, CHECK(length > 0) |
| `title` | text | NOT NULL | — | CHECK(length > 0) |
| `excerpt` | text | NOT NULL | `''` | |
| `content` | text | NOT NULL | `''` | |
| `type` | post_type | NOT NULL | `'blog'` | |
| `author_id` | uuid | NOT NULL | — | FK → profiles(id) ON DELETE CASCADE |
| `featured` | boolean | NOT NULL | `false` | |
| `image_url` | text | NOT NULL | `''` | |
| `published` | boolean | NOT NULL | `false` | |
| `created_at` | timestamptz | NOT NULL | `now()` | |
| `updated_at` | timestamptz | NOT NULL | `now()` | auto-trigger |

---

### 3. `tags` — 태그

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `slug` | text | NOT NULL | — | UNIQUE, CHECK(length > 0) |
| `label` | text | NOT NULL | — | UNIQUE, CHECK(length > 0) |

---

### 4. `post_tags` — 글↔태그 (M:N 조인 테이블)

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `post_id` | uuid | NOT NULL | — | FK → posts(id) ON DELETE CASCADE |
| `tag_id` | uuid | NOT NULL | — | FK → tags(id) ON DELETE CASCADE |
| `created_at` | timestamptz | NOT NULL | `now()` | |

PK: `(post_id, tag_id)` — composite

---

### 5. `comments` — 댓글 (대댓글 self-reference)

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `post_id` | uuid | NOT NULL | — | FK → posts(id) ON DELETE CASCADE |
| `author_id` | uuid | NOT NULL | — | FK → profiles(id) ON DELETE CASCADE |
| `content` | text | NOT NULL | — | CHECK(length > 0) |
| `parent_id` | uuid | NULL | `null` | FK → comments(id) ON DELETE SET NULL |
| `created_at` | timestamptz | NOT NULL | `now()` | |
| `updated_at` | timestamptz | NOT NULL | `now()` | auto-trigger |

> `parent_id`가 NULL이면 최상위 댓글, 값이 있으면 대댓글 (1레벨)

---

### 6. `reactions` — 리액션 (이모지)

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `post_id` | uuid | NOT NULL | — | FK → posts(id) ON DELETE CASCADE |
| `user_id` | uuid | NOT NULL | — | FK → profiles(id) ON DELETE CASCADE |
| `emoji` | text | NOT NULL | — | CHECK(length > 0) |
| `created_at` | timestamptz | NOT NULL | `now()` | |

UNIQUE: `(post_id, user_id, emoji)` — 같은 유저가 같은 글에 같은 이모지 중복 불가

---

### 7. `jobs` — 채용공고

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `company` | text | NOT NULL | — | |
| `company_slug` | text | NOT NULL | — | |
| `title` | text | NOT NULL | — | |
| `description` | text | NOT NULL | `''` | |
| `role` | text | NOT NULL | — | |
| `role_slug` | text | NOT NULL | — | |
| `location` | text | NOT NULL | — | |
| `location_slug` | text | NOT NULL | — | |
| `salary` | text | NOT NULL | `''` | |
| `tags` | text[] | NOT NULL | `'{}'` | |
| `remote` | boolean | NOT NULL | `false` | |
| `logo_color` | text | NOT NULL | `'#16140f'` | |
| `logo_letter` | text | NOT NULL | `'S'` | |
| `logo_url` | text | NOT NULL | `''` | |
| `posted` | text | NOT NULL | `''` | |
| `active` | boolean | NOT NULL | `true` | |
| `created_by` | uuid | NOT NULL | — | FK → profiles(id) ON DELETE RESTRICT |
| `created_at` | timestamptz | NOT NULL | `now()` | |
| `updated_at` | timestamptz | NOT NULL | `now()` | auto-trigger |

---

### 8. `library_items` — 라이브러리 (영상/에세이/팟캐스트/가이드)

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `slug` | text | NOT NULL | — | UNIQUE, CHECK(length > 0) |
| `title` | text | NOT NULL | — | CHECK(length > 0) |
| `author` | text | NOT NULL | — | |
| `author_role` | text | NOT NULL | `''` | |
| `type` | content_type | NOT NULL | — | ENUM |
| `categories` | text[] | NOT NULL | `'{}'` | |
| `description` | text | NOT NULL | `''` | |
| `body` | text | NOT NULL | `''` | |
| `date` | text | NOT NULL | `''` | |
| `views` | integer | NOT NULL | `0` | |
| `duration` | text | NOT NULL | `''` | |
| `youtube_id` | text | NOT NULL | `''` | |
| `featured` | boolean | NOT NULL | `false` | |
| `thumbnail_color` | text | NOT NULL | `'#16140f'` | |
| `created_at` | timestamptz | NOT NULL | `now()` | |
| `updated_at` | timestamptz | NOT NULL | `now()` | auto-trigger |

---

### 9. `launches` — 런치 (프로젝트 발표)

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `company` | text | NOT NULL | — | CHECK(length > 0) |
| `slug` | text | NOT NULL | — | UNIQUE, CHECK(length > 0) |
| `tagline` | text | NOT NULL | — | |
| `description` | text | NOT NULL | `''` | |
| `category` | text | NOT NULL | `''` | |
| `batch` | text | NOT NULL | `''` | |
| `votes` | integer | NOT NULL | `0` | |
| `active` | boolean | NOT NULL | `true` | |
| `created_at` | timestamptz | NOT NULL | `now()` | |
| `updated_at` | timestamptz | NOT NULL | `now()` | auto-trigger |

---

### 10. `applications` — 지원서

> ⚠️ SQL 마이그레이션 파일에 CREATE TABLE이 없음 (Supabase Dashboard에서 직접 생성된 것으로 추정)

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `name` | text | NOT NULL | — | |
| `email` | text | NOT NULL | — | |
| `student_id` | text | NULL | — | |
| `phone` | text | NULL | — | |
| `major` | text | NULL | — | |
| `batch` | text | NOT NULL | — | |
| `introduction` | text | NOT NULL | — | |
| `vision` | text | NULL | — | |
| `startup_idea` | text | NULL | — | |
| `portfolio_url` | text | NULL | — | |
| `equip` | boolean | NOT NULL | `false` | |
| `photo_exp` | boolean | NOT NULL | `false` | |
| `design_exp` | boolean | NOT NULL | `false` | |
| `figma` | boolean | NOT NULL | `false` | |
| `illustrator` | boolean | NOT NULL | `false` | |
| `experience_extra` | text | NULL | — | |
| `status` | text | NOT NULL | `'pending'` | |
| `created_at` | timestamptz | NOT NULL | `now()` | |

---

### ⚠️ 11. `members` — SPEC 멤버 (스키마만 정의, 실제 프로덕션 비어 있음)

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `name` | text | NOT NULL | — | |
| `slug` | text | NOT NULL | — | UNIQUE |
| `student_id` | text | NULL | — | 🔒 admin-only |
| `phone` | text | NULL | — | 🔒 admin-only |
| `email` | text | NULL | — | 🔒 admin-only |
| `major` | text | NULL | — | |
| `learner_batch` | text | NULL | — | 러너 기수 (1기, 2기...) |
| `preneur_batch` | text | NULL | — | 프러너 기수 |
| `batch_tags` | text[] | NOT NULL | `'{}'` | e.g. `['1기 러너', '3기 프러너']` |
| `member_type` | text | NOT NULL | `'runner'` | CHECK: `러너`, `프러너`, `alumni` |
| `department` | text | NULL | — | 대외홍보부, 기획운영부, 학술전략부 |
| `role` | text | NULL | — | 부원, 부장, 회장, 부회장 |
| `parts` | text[] | NOT NULL | `'{}'` | 기획, 마케팅, 개발, 제작 |
| `photo_url` | text | NULL | — | |
| `linkedin_url` | text | NULL | — | |
| `bio` | text | NULL | — | |
| `notes` | text | NULL | — | |
| `created_at` | timestamptz | NOT NULL | `now()` | |
| `updated_at` | timestamptz | NOT NULL | `now()` | auto-trigger |
> **주의**: 이 테이블은 프로덕션 데이터베이스에 CREATE TABLE 문이 없습니다. 스키마 정의만 존재하며, 실제로는 사용되지 않습니다.
---

### ⚠️ 12. `projects` — 프로젝트/스타트업 (스키마만 정의, 실제 프로덕션 비어 있음)

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `name` | text | NOT NULL | — | |
| `slug` | text | NOT NULL | — | UNIQUE |
| `one_liner` | text | NULL | — | |
| `description` | text | NULL | — | |
| `batch` | text | NULL | — | |
| `industries` | text[] | NOT NULL | `'{}'` | |
| `region` | text | NULL | — | |
| `team_size` | integer | NULL | — | |
| `is_hiring` | boolean | NOT NULL | `false` | |
| `status` | text | NOT NULL | `'Active'` | CHECK: `Active`, `Inactive`, `Acquired`, `Public` |
| `website` | text | NULL | — | |
| `linkedin_url` | text | NULL | — | |
| `twitter_url` | text | NULL | — | |
| `github_url` | text | NULL | — | |
| `logo_url` | text | NULL | — | |
| `category` | text | NULL | — | CHECK: `featured`, `breakthrough`, NULL |
| `founded_year` | integer | NULL | — | |
| `is_top_company` | boolean | NOT NULL | `false` | |
| `is_nonprofit` | boolean | NOT NULL | `false` | |
| `is_women_founded` | boolean | NOT NULL | `false` | |
| `created_at` | timestamptz | NOT NULL | `now()` | |
| `updated_at` | timestamptz | NOT NULL | `now()` | auto-trigger |
> **주의**: 이 테이블은 프로덕션 데이터베이스에 CREATE TABLE 문이 없습니다. 스키마 정의만 존재하며, 실제로는 사용되지 않습니다.
---

### ⚠️ 13. `member_projects` — 멤버↔프로젝트 (스키마만 정의, 실제 프로덕션 비어 있음)

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `member_id` | uuid | NOT NULL | — | FK → members(id) ON DELETE CASCADE |
| `project_id` | uuid | NOT NULL | — | FK → projects(id) ON DELETE CASCADE |
| `role` | text | NULL | — | 프로젝트 내 역할 |

PK: `(member_id, project_id)` — composite
> **주의**: 이 테이블은 프로덕션 데이터베이스에 CREATE TABLE 문이 없습니다. 스키마 정의만 존재하며, 실제로는 사용되지 않습니다.
---

### ⚠️ 14. `project_news` — 프로젝트 뉴스 (스키마만 정의, 실제 프로덕션 비어 있음)

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | PK |
| `project_id` | uuid | NOT NULL | — | FK → projects(id) ON DELETE CASCADE |
| `title` | text | NOT NULL | — | |
| `url` | text | NULL | — | |
| `date` | text | NULL | — | |
| `created_at` | timestamptz | NOT NULL | `now()` | |
> **주의**: 이 테이블은 프로덕션 데이터베이스에 CREATE TABLE 문이 없습니다. 스키마 정의만 존재하며, 실제로는 사용되지 않습니다.
---

## 관계 (Relationships)

### FK 관계 전체 맵

| From (FK) | → To (PK) | 관계 | ON DELETE |
|-----------|-----------|------|-----------|
| `profiles.id` | `auth.users.id` | 1:1 | CASCADE |
| `posts.author_id` | `profiles.id` | N:1 | CASCADE |
| `comments.post_id` | `posts.id` | N:1 | CASCADE |
| `comments.author_id` | `profiles.id` | N:1 | CASCADE |
| `comments.parent_id` | `comments.id` | N:1 (self) | SET NULL |
| `reactions.post_id` | `posts.id` | N:1 | CASCADE |
| `reactions.user_id` | `profiles.id` | N:1 | CASCADE |
| `post_tags.post_id` | `posts.id` | N:1 | CASCADE |
| `post_tags.tag_id` | `tags.id` | N:1 | CASCADE |
| `jobs.created_by` | `profiles.id` | N:1 | RESTRICT |
| `member_projects.member_id` | `members.id` | N:1 | CASCADE |
| `member_projects.project_id` | `projects.id` | N:1 | CASCADE |
| `project_news.project_id` | `projects.id` | N:1 | CASCADE |

### M:N 관계

| 테이블 A | 조인 테이블 | 테이블 B |
|----------|------------|----------|
| `posts` | `post_tags` | `tags` |
| `members` | `member_projects` | `projects` |

### 독립 테이블 (FK 없음)

- `applications` — 비회원도 제출 가능, auth 연결 없음
- `library_items` — author는 text 필드 (FK 아님)
- `launches` — 독립 엔티티
- `tags` — 참조만 받음 (post_tags에서)
- `members` — profiles와 별개 (auth 연결 없음)
- `projects` — 독립 엔티티

---

## 인덱스

| 테이블 | 인덱스 | 컬럼 |
|--------|--------|------|
| profiles | `idx_profiles_role` | `role` |
| profiles | `idx_profiles_slug` | `slug` |
| profiles | `idx_profiles_username_unique` | `username` WHERE `!= ''` (UNIQUE) |
| posts | `idx_posts_author_id` | `author_id` |
| posts | `idx_posts_type_published_created_at` | `type, published, created_at DESC` |
| posts | `idx_posts_published_created_at` | `published, created_at DESC` |
| post_tags | `idx_post_tags_tag_id` | `tag_id` |
| comments | `idx_comments_post_id_created_at` | `post_id, created_at ASC` |
| comments | `idx_comments_author_id` | `author_id` |
| comments | `idx_comments_parent_id` | `parent_id` |
| reactions | `idx_reactions_post_id` | `post_id` |
| reactions | `idx_reactions_user_id` | `user_id` |
| jobs | `idx_jobs_active_created_at` | `active, created_at DESC` |
| jobs | `idx_jobs_company_slug` | `company_slug` |
| library_items | `idx_library_items_type_created_at` | `type, created_at DESC` |
| library_items | `idx_library_items_featured_created_at` | `featured, created_at DESC` |
| launches | `idx_launches_active_created_at` | `active, created_at DESC` |
| launches | `idx_launches_votes` | `votes DESC` |
| members | `idx_members_learner_batch` | `learner_batch` |
| members | `idx_members_member_type` | `member_type` |
| members | `idx_members_slug` | `slug` |
| projects | `idx_projects_slug` | `slug` |
| projects | `idx_projects_batch` | `batch` |
| member_projects | `idx_member_projects_member` | `member_id` |
| member_projects | `idx_member_projects_project` | `project_id` |
| project_news | `idx_project_news_project` | `project_id` |

---

## 트리거 & 함수

### 자동 트리거

| 트리거 | 테이블 | 이벤트 | 함수 |
|--------|--------|--------|------|
| `on_auth_user_created` | `auth.users` | AFTER INSERT | `handle_new_user()` — 프로필 자동 생성 |
| `set_profiles_updated_at` | `profiles` | BEFORE UPDATE | `set_updated_at()` |
| `set_posts_updated_at` | `posts` | BEFORE UPDATE | `set_updated_at()` |
| `set_comments_updated_at` | `comments` | BEFORE UPDATE | `set_updated_at()` |
| `set_jobs_updated_at` | `jobs` | BEFORE UPDATE | `set_updated_at()` |
| `set_library_items_updated_at` | `library_items` | BEFORE UPDATE | `set_updated_at()` |
| `set_launches_updated_at` | `launches` | BEFORE UPDATE | `set_updated_at()` |

### 헬퍼 함수

| 함수 | 반환 | 설명 |
|------|------|------|
| `set_updated_at()` | trigger | `updated_at = now()` 자동 설정 |
| `slugify(input)` | text | URL-safe slug 생성 |
| `handle_new_user()` | trigger | auth.users INSERT 시 profiles 자동 생성 (role='outsider') |
| `custom_access_token_hook(event)` | jsonb | JWT claims에 `user_role` 주입 |
| `get_user_role()` | user_role | JWT에서 현재 유저 역할 추출 |
| `can_write()` | boolean | member 이상 여부 |
| `is_admin()` | boolean | admin 역할 여부 |

---

## RLS 정책 요약

### profiles

| 정책 | 동작 | 조건 |
|------|------|------|
| `profiles_read_all` | SELECT | 모든 유저 |
| `profiles_update_self_or_admin` | UPDATE | 본인 OR admin |

### posts

| 정책 | 동작 | 조건 |
|------|------|------|
| `posts_read_published_or_owner_or_admin` | SELECT | published=true OR 본인 OR admin |
| `posts_insert_blog_by_writer` | INSERT | can_write() AND 본인 AND type='blog' |
| `posts_insert_news_by_admin` | INSERT | is_admin() AND 본인 AND type='news' |
| `posts_update_author_or_admin` | UPDATE | 본인 OR admin |
| `posts_delete_author_or_admin` | DELETE | 본인 OR admin |

### tags

| 정책 | 동작 | 조건 |
|------|------|------|
| `tags_read_all` | SELECT | 모든 유저 |
| `tags_insert_admin` | INSERT | admin |
| `tags_update_admin` | UPDATE | admin |
| `tags_delete_admin` | DELETE | admin |

### post_tags

| 정책 | 동작 | 조건 |
|------|------|------|
| `post_tags_read_all` | SELECT | 모든 유저 |
| `post_tags_manage_..._insert` | INSERT | post의 author 또는 admin |
| `post_tags_manage_..._delete` | DELETE | post의 author 또는 admin |

### comments

| 정책 | 동작 | 조건 |
|------|------|------|
| `comments_read_all` | SELECT | 모든 유저 |
| `comments_insert_writer_own_author` | INSERT | can_write() AND 본인 |
| `comments_delete_author_or_admin` | DELETE | 본인 OR admin |

### reactions

| 정책 | 동작 | 조건 |
|------|------|------|
| `reactions_read_all` | SELECT | 모든 유저 |
| `reactions_insert_writer_own_user` | INSERT | can_write() AND 본인 |
| `reactions_delete_own` | DELETE | 본인만 |

### jobs

| 정책 | 동작 | 조건 |
|------|------|------|
| `jobs_read_active_or_admin` | SELECT | active=true OR admin |
| `jobs_insert_admin` | INSERT | admin |
| `jobs_update_admin` | UPDATE | admin |
| `jobs_delete_admin` | DELETE | admin |

### library_items

| 정책 | 동작 | 조건 |
|------|------|------|
| `library_items_read_all` | SELECT | 모든 유저 |
| `library_items_insert_admin` | INSERT | admin |
| `library_items_update_admin` | UPDATE | admin |
| `library_items_delete_admin` | DELETE | admin |

### launches

| 정책 | 동작 | 조건 |
|------|------|------|
| `launches_read_all` | SELECT | 모든 유저 |
| `launches_insert_admin` | INSERT | admin |
| `launches_update_admin` | UPDATE | admin |
| `launches_delete_admin` | DELETE | admin |

### members, projects, member_projects, project_news (스키마만 정의, 실제 비어 있음)

| 정책 | 동작 | 조건 |
|------|------|------|
| Public read | SELECT | 모든 유저 (4개 테이블 모두) — 단 테이블들은 실제로는 비어 있음 |
| Admin write | INSERT/UPDATE | `WITH CHECK (true)` ⚠️ — RLS가 실질적으로 열려 있음 |

> ⚠️ **중요**: `members`, `projects`, `member_projects`, `project_news` 테이블은 모두 다른 뢜낌/구조 데이터베이스에서 관리되는 것으로 예상되며 프로덕션에는 CREATE TABLE 문이 없습니다.

### applications

> ⚠️ **메모**: `applications` 테이블도 SQL 파일에 CREATE TABLE 문이 없습니다. Supabase Dashboard에서 직접 생성되며, RLS 정책은 널 다른 공간에서 관리되고 있을 검지를 대비하도록 함.
