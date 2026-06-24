# Team Space IA

## 1. Entry Points

- Desktop Navbar: 로그인 버튼 옆 기존 `Apply` 버튼을 `Team Space` 또는 `팀스페이스` 버튼으로 교체한다.
- Mobile Navbar: 기존 `Apply Now` CTA 영역을 동일하게 `팀스페이스`로 교체한다.
- Unauthenticated user: 버튼 클릭 시 `/login?redirect=/team-space`로 이동한다.
- Authenticated outsider: 접근 불가 안내 후 홈으로 이동하거나 권한 없음 화면을 표시한다.

## 2. Route Structure

```text
/team-space
  Team overview dashboard

/team-space/[teamId]
  Team detail space

/team-space/[teamId]/office-hours/[officeHourId]
  Optional office-hour detail or edit view
```

관리 전용 CRUD가 필요하면 기존 admin 패턴을 따라 다음 보조 라우트를 둔다.

```text
/admin/teams
  Team CRUD and member assignment
```

## 3. Global Navigation Behavior

- `ApplyButton` 컴포넌트는 재사용 여부를 검토한다. 모집 전용 네이밍이 강하므로 `HeaderCtaButton` 또는 `MemberActionButton`으로 분리하는 것이 적절하다.
- Navbar 버튼 텍스트는 운영 단계 기준으로 `팀스페이스`를 기본값으로 사용한다.
- 모집 기간에 다시 `Apply`가 필요하면 site setting 또는 recruitment setting으로 CTA destination을 제어한다.

## 4. Page Hierarchy

### `/team-space`

- Header: 페이지명, 현재 사용자 역할, 담당 팀 필터
- Summary: 전체 팀 수, 진행 중 CTA, blocked CTA, 오피스아워 예정 팀
- Team List: 팀명, 팀원, 담당 프러너, 최신 CTA, 다음 오피스아워 날짜
- Empty State: 배정된 팀이 없을 때 안내

### `/team-space/[teamId]`

- Team Header: 팀명, 설명, 멤버, 담당 프러너
- CTA Panel: 상태별 CTA 리스트, 생성/수정 모달
- Office Hours Panel: 최신 기록, 2주 주기 히스토리, 새 기록 작성
- Activity Notes: CTA 변경 및 오피스아워 작성 이력

## 5. Role-Based Information Architecture

| Role | `/team-space` | Team Detail | Mutation |
| --- | --- | --- | --- |
| outsider | 접근 불가 | 접근 불가 | 불가 |
| learner | 본인 팀만 | 본인 팀만 | CTA 상태/코멘트 |
| preneur | 전체 팀 | 전체 팀 | 팀/CTA/OH 관리 |
| is_admin | 전체 팀 | 전체 팀 | 전체 관리 |

## 6. Data Model Draft

```text
startup_teams
  id, name, description, batch, lead_preneur_id, created_at, updated_at

startup_team_members
  id, team_id, profile_id, role_in_team, created_at

team_ctas
  id, team_id, title, description, assignee_id, due_date, status, created_by, updated_at

office_hours
  id, team_id, held_at, next_due_at, summary, decisions, next_actions, created_by, updated_at

office_hour_attendees
  id, office_hour_id, profile_id
```

## 7. Key States

- Loading: 팀 목록 skeleton
- No Team: 러너가 아직 팀에 배정되지 않은 상태
- No CTA: 팀 생성 직후 CTA가 없는 상태
- Overdue CTA: 마감일이 지난 CTA 강조
- Office Hour Due: 마지막 오피스아워 이후 14일 이상 지난 팀 강조

