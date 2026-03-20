# Padlet API Documentation & Integration Guide (v1)

이 문서는 SPEC-web 프로젝트에서 Padlet API를 연동하고 활용하는 방법과 공식 문서(`https://docs.padlet.dev/reference/get-board-by-id`)를 바탕으로 한 상세 명세를 정리한 가이드입니다.

---

## 1. API 기본 체계

Padlet API는 **v1** 버전을 사용하며, **JSON:API** 오픈 소스 표준 규격을 따릅니다.

### 1-1. 주요 헤더 및 인증
연동 시 다음 헤더 정보가 필수적으로 포함되어야 합니다.
*   **인증**: `X-Api-Key` 전송 (헤더 키 이름은 `X-Api-Key` 또는 `x-api-key` 모두 가능).
*   **데이터 타입**: `Accept: application/vnd.api+json` (JSON:API 규격을 위해 필수).
    - *주의*: 일반적인 `application/json` 사용 시 API가 정상적으로 응답하지 않을 수 있습니다.

### 1-2. 기본 URL 구조
*   `GET https://api.padlet.dev/v1/boards/{board_id}`
*   `board_id`: 16~22자 내외의 문자열 형식 ID.

---

## 2. 데이터 구조 및 연동 (JSON:API)

응답 데이터는 최상위 `data` 객체와 연관 리소스들을 담은 `included` 배열로 구성됩니다.

### 2-1. `data` (보드 정보)
*   `id`: 보드 ID
*   `type`: "board"
*   `attributes`: 보드 제목(`title`), 설명(`description`), 웹 URL(`webUrl`), 설정 정보(`settings`), 작성자 정보(`builder`) 등.
*   `relationships`: 보드와 관계된 섹션(`sections`), 포스트(`posts`), 댓글(`comments`) 리소스들의 링크 정보.

### 2-2. `included` (연관 리소스)
`include` 쿼리 파라미터(예: `?include=posts,sections`)를 사용하면 해당 리소스의 실제 데이터가 `included` 배열에 포함되어 내려옵니다.

#### 포스트 (Type: `post`)
가장 많이 활용되는 데이터로, 작성자(Author) 정보가 핵심입니다.
*   **작성자 확인 경로 (2가지 상황)**:
    1.  **임베디드**: `attributes.author` 객체 내에 `fullName`, `username`, `shortName`, `avatarUrl` 등이 직접 포함. (*이메일은 제외되는 경우가 많음*)
    2.  **관계 참조**: `relationships.author`를 통해 `type: "user"`인 리소스로 연결. 이 경우 `included`에서 해당 유저를 찾아 더 상세한 정보(`email`, `displayName`, `name`)를 가져올 수 있음.

#### 섹션 (Type: `section`)
*   `attributes.title`: 섹션 이름 (예: "1주차 미션", "2주차 과제").
*   `attributes.sortIndex`: 섹션 정렬 순서.

---

## 3. SPEC-web 연동 구현 전략

우리 프로젝트는 과제 제출 자동 체크를 위해 다음과 같은 전략을 사용합니다.

### 3-1. 수집 및 정규화
*   **Proxy Route**: API 키 보안을 위해 서버 사이드(`app/api/padlet/board/route.ts`)에서 데이터를 수집.
*   **Normalization**: `posts`와 `sections`를 추출하여 유저 매칭이 용이한 형태로 정규화.
*   **Name Resolution**: 작성자 이름을 가져올 때 `fullName` -> `displayName` -> `name` 순서로 필드를 검사하여 유실을 최소화함.

### 3-2. 매칭 로직 (Fuzzy & Exact Match)
학생의 제출 여부를 판단하기 위해 다음 기준을 복합적으로 활용합니다.
*   **개인 과제**: 러너의 본명(`name`) 및 `username`이 포스트 작성자 정보와 일치하는지 확인.
*   **팀 과제**: `homework_team_assignments` 정보를 바탕으로, 해당 팀에 속한 **어떠한 멤버**라도 포스트를 작성했는지 확인.
*   **섹션 필터링**: 보드 전체가 아닌, 해당 과제에 해당하는 **특정 섹션**에 올라온 포스트만 유효한 제출로 인정.

---

## 4. 트러블슈팅 및 팁
*   **데이터 갱신**: Padlet API 호출 시 `next: { revalidate: 60 }`과 같은 캐싱 전략을 사용하여 API 할당량 소모를 방지하고 성능을 최적화합니다.
*   **작성자 식별 실패**: 작성자가 Padlet에 로그인하지 않고 '익명'으로 글을 남길 경우, 이름 검색이 불가능하므로 러너들에게 실명/ID 등록을 가이드해야 합니다.

---
*Last Updated: 2026-03-20*
