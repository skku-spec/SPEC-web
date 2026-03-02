create extension if not exists "pgcrypto";

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  student_id text,
  phone text,
  email text,
  major text,
  runner_batch text,
  preneur_batch text,
  batch_tags text[] not null default '{}',
  member_type text not null default '러너' check (member_type in ('러너', '프러너', 'alumni')),
  department text,
  role text,
  parts text[] not null default '{}',
  photo_url text,
  linkedin_url text,
  bio text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  one_liner text,
  description text,
  batch text,
  industries text[] not null default '{}',
  region text,
  team_size integer,
  is_hiring boolean not null default false,
  status text not null default 'Active' check (status in ('Active', 'Inactive', 'Acquired', 'Public')),
  website text,
  linkedin_url text,
  twitter_url text,
  github_url text,
  logo_url text,
  category text,
  founded_year integer,
  is_top_company boolean not null default false,
  is_nonprofit boolean not null default false,
  is_women_founded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_projects (
  member_id uuid not null references public.members(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  role text,
  primary key (member_id, project_id)
);

create table if not exists public.project_news (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  url text,
  date text,
  created_at timestamptz not null default now()
);

create index if not exists idx_members_runner_batch on public.members(runner_batch);
create index if not exists idx_members_member_type on public.members(member_type);
create index if not exists idx_members_slug on public.members(slug);
create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_batch on public.projects(batch);
create index if not exists idx_member_projects_member on public.member_projects(member_id);
create index if not exists idx_member_projects_project on public.member_projects(project_id);
create index if not exists idx_project_news_project on public.project_news(project_id);

drop trigger if exists set_members_updated_at on public.members;
create trigger set_members_updated_at
before update on public.members
for each row
execute function set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function set_updated_at();

alter table public.members enable row level security;
alter table public.projects enable row level security;
alter table public.member_projects enable row level security;
alter table public.project_news enable row level security;

drop policy if exists "members_read_all" on public.members;
create policy "members_read_all" on public.members for select using (true);

drop policy if exists "projects_read_all" on public.projects;
create policy "projects_read_all" on public.projects for select using (true);

drop policy if exists "member_projects_read_all" on public.member_projects;
create policy "member_projects_read_all" on public.member_projects for select using (true);

drop policy if exists "project_news_read_all" on public.project_news;
create policy "project_news_read_all" on public.project_news for select using (true);

drop policy if exists "members_admin_insert" on public.members;
create policy "members_admin_insert" on public.members for insert with check (public.is_admin());
drop policy if exists "members_admin_update" on public.members;
create policy "members_admin_update" on public.members for update using (public.is_admin());
drop policy if exists "members_admin_delete" on public.members;
create policy "members_admin_delete" on public.members for delete using (public.is_admin());

drop policy if exists "projects_admin_insert" on public.projects;
create policy "projects_admin_insert" on public.projects for insert with check (public.is_admin());
drop policy if exists "projects_admin_update" on public.projects;
create policy "projects_admin_update" on public.projects for update using (public.is_admin());
drop policy if exists "projects_admin_delete" on public.projects;
create policy "projects_admin_delete" on public.projects for delete using (public.is_admin());

drop policy if exists "member_projects_admin_insert" on public.member_projects;
create policy "member_projects_admin_insert" on public.member_projects for insert with check (public.is_admin());
drop policy if exists "member_projects_admin_update" on public.member_projects;
create policy "member_projects_admin_update" on public.member_projects for update using (public.is_admin());
drop policy if exists "member_projects_admin_delete" on public.member_projects;
create policy "member_projects_admin_delete" on public.member_projects for delete using (public.is_admin());

drop policy if exists "project_news_admin_insert" on public.project_news;
create policy "project_news_admin_insert" on public.project_news for insert with check (public.is_admin());
drop policy if exists "project_news_admin_update" on public.project_news;
create policy "project_news_admin_update" on public.project_news for update using (public.is_admin());
drop policy if exists "project_news_admin_delete" on public.project_news;
create policy "project_news_admin_delete" on public.project_news for delete using (public.is_admin());

insert into public.projects (
  name,
  slug,
  one_liner,
  description,
  batch,
  industries,
  region,
  team_size,
  is_hiring,
  status,
  website,
  linkedin_url,
  twitter_url,
  github_url,
  logo_url,
  category,
  founded_year,
  is_top_company,
  is_nonprofit,
  is_women_founded
)
values
  (
    'LINKIT',
    'linkit',
    '대학생 커리어 네트워킹 및 연결 플랫폼',
    $desc$linkit은 대학생들이 선배, 멘토, 동료와 연결되어 커리어를 탐색하고 인턴십 기회를 발견할 수 있도록 돕는 네트워킹 플랫폼이다. 학과와 관심 분야를 기반으로 유의미한 연결을 만들어주며, 실질적인 커리어 정보를 교환할 수 있는 환경을 제공한다. SPEC 1기에서 시작된 프로젝트로, 대학생 취업 준비 과정의 정보 비대칭 문제를 해결하고자 한다.$desc$,
    '1기',
    array['커리어', '네트워킹'],
    '서울',
    3,
    false,
    'Active',
    '#',
    null,
    null,
    null,
    null,
    null,
    2024,
    false,
    false,
    false
  ),
  (
    'On The Record',
    'on-the-record',
    '음악 기반 소셜 미디어 플랫폼',
    $desc$On The Record는 음악 취향을 기반으로 사람들을 연결하는 소셜 미디어 플랫폼이다. 사용자는 자신이 좋아하는 음악을 공유하고, 플레이리스트를 만들며, 비슷한 취향을 가진 사람들과 소통할 수 있다. SPEC 1기 프로젝트로 출발하여, 음악이라는 공통 관심사를 통해 새로운 형태의 소셜 네트워크를 만들어가고 있다.$desc$,
    '1기',
    array['음악', '소셜미디어'],
    '서울',
    5,
    false,
    'Active',
    '#',
    null,
    null,
    null,
    null,
    null,
    2024,
    false,
    false,
    false
  ),
  (
    'K-HI',
    'k-hi',
    '어르신을 위한 지도 서비스와 위급상황 감지 위치 추적 시스템',
    $desc$K-HI는 디지털 기기 사용이 어려운 어르신들을 위해 직관적인 지도 서비스를 제공하고, 위급상황 발생 시 자동으로 보호자에게 알림을 보내는 위치 추적 시스템이다. 큰 글씨와 간단한 인터페이스로 시니어 사용자의 접근성을 높였으며, IoT 센서를 활용한 낙상 감지 기능도 함께 개발하고 있다. SPEC 2기 프로젝트로, 고령화 사회에서 어르신의 안전한 외출을 지원하는 것을 목표로 한다.$desc$,
    '2기',
    array['시니어케어', 'IoT'],
    '서울',
    4,
    false,
    'Active',
    '#',
    null,
    null,
    null,
    '/logos/teams/돋보길.png',
    null,
    2025,
    false,
    false,
    false
  ),
  (
    'ByOrbit',
    'byorbit',
    '농산물 부산물을 활용한 재가공 서비스',
    $desc$ByOrbit는 수확 후 버려지는 농산물 부산물을 수거하여 새로운 식품이나 원료로 재가공하는 서비스이다. 순환경제 관점에서 농업 폐기물을 줄이고, 농가에는 추가 수입원을 제공한다. SPEC 2기 프로젝트로, 지속가능한 농업 생태계를 만들기 위한 비즈니스 모델을 구축하고 있다.$desc$,
    '2기',
    array['농업', '지속가능'],
    '서울',
    2,
    false,
    'Active',
    '#',
    null,
    null,
    null,
    '/logos/teams/바이올빗.jpg',
    null,
    2025,
    false,
    false,
    false
  ),
  (
    'FAXI',
    'faxi',
    '트렌디한 포터블 모바일 팩스 서비스',
    $desc$FAXI는 스마트폰만으로 팩스를 보내고 받을 수 있는 모바일 팩스 서비스이다. 관공서 서류 제출이나 계약서 전송 등 아직 팩스가 필요한 상황에서, 별도의 팩스 기기 없이 간편하게 이용할 수 있도록 했다. SPEC 2기 프로젝트로, 레거시 통신 수단을 현대적으로 재해석하여 접근성을 높이는 것을 목표로 한다.$desc$,
    '2기',
    array['모바일'],
    '서울',
    2,
    false,
    'Active',
    '#',
    null,
    null,
    null,
    '/logos/teams/펙시.jpg',
    null,
    2025,
    false,
    false,
    false
  ),
  (
    '담아',
    'dama',
    '1인가구·여성을 위한 호신용품 패키징 서비스',
    $desc$담아는 1인 가구와 여성을 대상으로 호신용품을 선별하여 패키지 형태로 제공하는 서비스이다. 일상에서 휴대하기 편한 디자인의 호신용품을 큐레이션하고, 안전 관련 정보와 대처법도 함께 안내한다. SPEC 2기 프로젝트로, 개인 안전에 대한 사회적 관심이 높아지는 흐름 속에서 실용적인 솔루션을 제공하고자 한다.$desc$,
    '2기',
    array['안전', '라이프스타일'],
    '서울',
    3,
    false,
    'Active',
    '#',
    null,
    null,
    null,
    '/logos/teams/담아.png',
    null,
    2025,
    false,
    false,
    false
  ),
  (
    '사르르',
    'sarr',
    '노인을 위한 병원 예약 간편화 서비스',
    $desc$사르르는 디지털 예약 시스템에 어려움을 느끼는 어르신들이 병원 예약을 쉽게 할 수 있도록 돕는 서비스이다. 복잡한 단계를 최소화하고 큰 글씨와 음성 안내를 적용하여, 보호자 도움 없이도 진료 예약을 완료할 수 있게 했다. SPEC 3기 프로젝트로, 고령 사용자의 의료 접근성 향상에 집중하고 있다.$desc$,
    '3기',
    array['시니어케어', '헬스케어'],
    '서울',
    4,
    false,
    'Active',
    '#',
    null,
    null,
    null,
    '/logos/teams/사르르.png',
    null,
    2025,
    false,
    false,
    false
  ),
  (
    '유스',
    'youth',
    '개인 맞춤형 화장품/미용용품 솔루션',
    $desc$유스는 '스킨메이트'라는 서비스명으로, 개인의 피부 타입과 고민을 분석하여 맞춤형 화장품과 미용용품을 추천하는 솔루션이다. 피부 진단 결과를 바탕으로 성분과 제품을 매칭해주며, 사용 후기 데이터를 활용하여 추천 정확도를 높여간다. SPEC 3기 프로젝트로, 화장품 선택에서 발생하는 시행착오를 줄이고자 한다.$desc$,
    '3기',
    array['뷰티', '커머스'],
    '서울',
    3,
    false,
    'Active',
    '#',
    null,
    null,
    null,
    '/logos/teams/유스.png',
    null,
    2025,
    false,
    false,
    false
  ),
  (
    '아름',
    'areum',
    '공유 옷장 서비스',
    $desc$아름은 개인 간 옷을 빌리고 빌려주는 공유 옷장 서비스이다. 특별한 행사나 계절이 바뀔 때 새 옷을 사는 대신 이웃의 옷장에서 원하는 옷을 빌릴 수 있어, 패션 소비를 줄이고 지속가능한 의류 문화를 만든다. SPEC 3기 프로젝트로, MZ세대의 합리적 소비 트렌드와 환경 의식에 부합하는 서비스를 지향한다.$desc$,
    '3기',
    array['패션', '공유경제'],
    '서울',
    3,
    false,
    'Active',
    '#',
    null,
    null,
    null,
    '/logos/teams/아름.jpg',
    null,
    2025,
    false,
    false,
    false
  )
on conflict (slug) do update
set
  name = excluded.name,
  one_liner = excluded.one_liner,
  description = excluded.description,
  batch = excluded.batch,
  industries = excluded.industries,
  region = excluded.region,
  team_size = excluded.team_size,
  is_hiring = excluded.is_hiring,
  status = excluded.status,
  website = excluded.website,
  linkedin_url = excluded.linkedin_url,
  twitter_url = excluded.twitter_url,
  github_url = excluded.github_url,
  logo_url = excluded.logo_url,
  category = excluded.category,
  founded_year = excluded.founded_year,
  is_top_company = excluded.is_top_company,
  is_nonprofit = excluded.is_nonprofit,
  is_women_founded = excluded.is_women_founded,
  updated_at = now();

insert into public.members (
  name,
  slug,
  major,
  runner_batch,
  preneur_batch,
  batch_tags,
  member_type,
  role,
  parts,
  photo_url,
  bio
)
values
  ('석채은', 'seok-chaeeun', '기계공학과', '1기', null, array['1기 러너'], '러너', null, '{}', null, null),
  ('윤채빈', 'yun-chaebin', '경영학과', '1기', null, array['1기 러너'], '러너', null, '{}', null, null),
  ('임시우', 'lim-siwoo', '글로벌경제학과', '1기', null, array['1기 러너'], '러너', null, '{}', null, null),
  ('장진우', 'jang-jinwoo', '소프트웨어학과', '1기', null, array['1기 러너'], '러너', null, '{}', null, null),
  ('황정인', 'hwang-jungin', '글로벌바이오메디컬공학과', '1기', null, array['1기 러너'], '러너', null, '{}', null, null),
  (
    '이송목',
    'lee-songmok',
    '소프트웨어학과',
    '1기',
    '4기',
    array['1기 회장', '2기 회장', '3기 프러너 회장', '4기 프러너'],
    '프러너',
    'Community Lead',
    array['Community'],
    null,
    $bio$SPEC 4기 Community Lead.
멤버 간 네트워킹과 커뮤니티 활성화를 담당합니다.$bio$
  ),
  ('임은빈', 'lim-eunbin', '경제학과', '1기', '3기', array['1기 러너', '2기 러너', '3기 프러너'], '러너', null, '{}', null, null),
  ('장지민', 'jang-jimin', '프랑스어문학과', '1기', null, array['1기 러너', '2기 러너'], '러너', null, '{}', null, null),
  (
    '전도현',
    'jeon-dohyun',
    '물리학과',
    '1기',
    '4기',
    array['1기 러너', '2기 부회장', '3기 회장', '4기 회장'],
    '프러너',
    'Managing Lead | Operations · Engineering · Partnerships',
    array['Operations', 'Engineering', 'Partnerships'],
    null,
    $bio$SPEC 4기 Managing Lead.
Operations, Engineering, Partnerships 팀에서 활동하며 학회 전반의 운영과 전략을 총괄합니다.$bio$
  ),
  ('강하빈', 'kang-habin', '컴퓨터교육과', '2기', null, array['2기 러너'], '러너', null, '{}', null, null),
  ('곽재민', 'kwak-jaemin', '전자전기공학부', '2기', null, array['2기 러너'], '러너', null, '{}', null, null),
  ('김동우', 'kim-dongwoo', '아동청소년학과', '2기', null, array['2기 러너'], '러너', null, '{}', null, null),
  ('김주현', 'kim-juhyun', '소프트웨어학과', '2기', null, array['2기 러너'], '러너', null, '{}', null, null),
  (
    '서원준',
    'seo-wonjun',
    '시스템경영학과',
    '2기',
    '4기',
    array['2기 러너', '4기 프러너'],
    '프러너',
    'Design Lead | Engineering',
    array['Design', 'Engineering'],
    null,
    $bio$SPEC 4기 Design Lead.
Engineering 팀에서도 활동하며 브랜드 디자인과 개발을 병행합니다.$bio$
  ),
  (
    '신지은',
    'shin-jieun',
    '영어영문학과',
    '2기',
    '4기',
    array['2기 러너', '3기 러너', '3기 프러너', '4기 프러너'],
    '프러너',
    'Design | Contents',
    array['Design', 'Contents'],
    null,
    $bio$SPEC 4기 Preneur.
Design과 Contents 팀에서 활동하며 시각 디자인과 콘텐츠 제작을 담당합니다.$bio$
  ),
  ('이유정', 'lee-yujeong', '스포츠과학과', '2기', null, array['2기 러너'], '러너', null, '{}', null, null),
  ('전선희', 'jeon-sunhee', '컴퓨터교육과', '2기', null, array['2기 러너'], '러너', null, '{}', null, null),
  ('한소윤', 'han-soyun', '글로벌경영학과', '2기', null, array['2기 러너'], '러너', null, '{}', null, null),
  (
    '한지상',
    'han-jisang',
    '전자전기공학부',
    '2기',
    '4기',
    array['2기 러너', '3기 프러너', '4기 부회장', '4기 프러너'],
    '프러너',
    'Managing Lead | Engineering · Contents',
    array['Engineering', 'Contents'],
    null,
    $bio$SPEC 4기 Managing Lead.
Engineering과 Contents 팀에서 활동하며 기술 및 콘텐츠 방향을 이끕니다.$bio$
  ),
  ('홍경의', 'hong-gyeongui', '컴퓨터교육과', '2기', null, array['2기 러너'], '러너', null, '{}', null, null),
  (
    '권민재',
    'kwon-minjae',
    '시스템경영학과',
    '3기',
    '4기',
    array['3기 러너', '4기 프러너'],
    '프러너',
    'Contents Lead | Operations · Engineering · Partnerships',
    array['Contents', 'Operations', 'Engineering', 'Partnerships'],
    null,
    $bio$SPEC 4기 Contents Lead.
Operations, Engineering, Partnerships 팀에서도 활동하며 다방면에서 기여합니다.$bio$
  ),
  (
    '김동인',
    'kim-dongin',
    '미디어커뮤니케이션학과',
    '3기',
    '4기',
    array['3기 러너', '4기 프러너'],
    '프러너',
    'Partnerships Lead | Operations',
    array['Partnerships', 'Operations'],
    null,
    $bio$SPEC 4기 Partnerships Lead.
Operations 팀에서도 활동하며 대외 협력과 운영을 담당합니다.$bio$
  ),
  ('김혜민', 'kim-hyemin', '경제학과', '3기', '4기', array['3기 러너', '4기 프러너'], '프러너', null, '{}', null, null),
  (
    '류영상',
    'ryu-yeongsang',
    '자유전공계열',
    '3기',
    '4기',
    array['3기 러너', '3기 프러너', '4기 프러너'],
    '프러너',
    'Engineering Lead | Design',
    array['Engineering', 'Design'],
    null,
    $bio$SPEC 4기 Engineering Lead.
Design 팀에서도 활동하며 기술 개발과 디자인을 병행합니다.$bio$
  ),
  (
    '이연서',
    'lee-yeonseo',
    '에너지학과',
    '3기',
    '4기',
    array['3기 러너', '4기 프러너'],
    '프러너',
    'Operations',
    array['Operations'],
    null,
    $bio$SPEC 4기 Preneur.
Operations 팀에서 프로그램 운영을 지원합니다.$bio$
  ),
  ('이유민', 'lee-yumin', '소프트웨어학과', '3기', null, array['3기 러너'], '러너', null, '{}', null, null),
  ('이혜원', 'lee-hyewon', '공학계열', '3기', null, array['3기 러너'], '러너', null, '{}', null, null),
  (
    '임영빈',
    'lim-yeongbin',
    '러시아어문학과',
    '3기',
    '4기',
    array['3기 러너', '4기 프러너'],
    '프러너',
    'Operations | Engineering | Partnerships',
    array['Operations', 'Engineering', 'Partnerships'],
    null,
    $bio$SPEC 4기 Preneur.
Operations, Engineering, Partnerships 세 팀에서 활동합니다.$bio$
  ),
  (
    '최윤정',
    'choi-yunjeong',
    '융합생명공학과',
    '3기',
    '4기',
    array['3기 러너', '4기 프러너'],
    '프러너',
    'Operations Lead',
    array['Operations'],
    null,
    $bio$SPEC 4기 Operations Lead.
프로그램 전체 운영과 데모데이 기획을 담당합니다.$bio$
  )
on conflict (slug) do update
set
  name = excluded.name,
  major = excluded.major,
  runner_batch = excluded.runner_batch,
  preneur_batch = excluded.preneur_batch,
  batch_tags = excluded.batch_tags,
  member_type = excluded.member_type,
  role = excluded.role,
  parts = excluded.parts,
  photo_url = excluded.photo_url,
  bio = excluded.bio,
  updated_at = now();

with relation_seed(member_slug, project_slug, role) as (
  values
    ('seok-chaeeun', 'on-the-record', '대표'),
    ('yun-chaebin', 'linkit', '대표'),
    ('lim-siwoo', 'on-the-record', '기획'),
    ('jang-jinwoo', 'on-the-record', '개발'),
    ('hwang-jungmin', 'on-the-record', '디자인'),
    ('lee-songmok', 'on-the-record', '마케팅'),
    ('lim-eunbin', 'linkit', null),
    ('lim-eunbin', 'k-hi', null),
    ('jang-jimin', 'linkit', '기획'),
    ('jeon-dohyun', 'linkit', '개발'),
    ('kang-habin', 'k-hi', '대표'),
    ('kwak-jaemin', 'dama', '대표'),
    ('kim-dongwoo', 'byorbit', '대표'),
    ('kim-juhyun', 'k-hi', '개발'),
    ('seo-wonjun', 'faxi', '대표'),
    ('shin-jieun', 'byorbit', '기획'),
    ('shin-jieun', 'areum', '디자인'),
    ('lee-yujeong', 'dama', '기획'),
    ('jeon-sunhee', 'dama', '디자인'),
    ('han-soyun', 'k-hi', '기획'),
    ('han-jisang', 'faxi', '개발'),
    ('hong-gyeongui', 'k-hi', '디자인'),
    ('kwon-minjae', 'youth', '대표'),
    ('kim-dongin', 'areum', '대표'),
    ('kim-hyemin', 'sarr', '대표'),
    ('ryu-yeongsang', 'sarr', '개발'),
    ('lee-yeonseo', 'youth', '기획'),
    ('lee-yumin', 'sarr', '기획'),
    ('lee-hyewon', 'sarr', '디자인'),
    ('lim-yeongbin', 'areum', '기획'),
    ('choi-yunjeong', 'youth', '마케팅')
)
insert into public.member_projects (member_id, project_id, role)
select
  m.id,
  p.id,
  r.role
from relation_seed r
join public.members m on m.slug = r.member_slug
join public.projects p on p.slug = r.project_slug
on conflict (member_id, project_id) do update
set role = excluded.role;
