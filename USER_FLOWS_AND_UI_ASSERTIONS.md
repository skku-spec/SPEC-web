# Comprehensive User Flows & UI Assertions for SPEC Web
## Auth, Apply, Dashboard, Admin Areas

**Document Purpose:** Exhaustive enumeration of actionable user flows with concrete UI assertions for Playwright tests.  
**Scope:** Login, Signup, Application (Apply), Status Check, Dashboard, and Admin areas.  
**Last Updated:** 2026-03-02

---

## TABLE OF CONTENTS
1. [Authentication Flows](#authentication-flows)
2. [Application Flows](#application-flows)
3. [Dashboard Flows](#dashboard-flows)
4. [Admin Flows](#admin-flows)
5. [Error Handling Flows](#error-handling-flows)
6. [UI Component Assertions](#ui-component-assertions)

---

## AUTHENTICATION FLOWS

### FLOW 1: User Login (Valid Credentials)
**Route:** `/login`  
**Precondition:** User has registered account; not currently logged in  
**File Path:** `/app/login/page.tsx`, `/app/login/LoginForm.tsx`

#### Actions:
1. Navigate to `/login`
2. Enter valid email/username in "Username or email" field
3. Enter valid password in "Password" field
4. Click "Log In" button

#### Expected Visible Texts/UI Assertions:
- **Page Title:** "Log in | SPEC"
- **Heading:** "Log in to access the SPEC Application" (line 23, `page.tsx`)
- **Logo visible:** `<img src="/logo.png" alt="SPEC">`
- **Input labels:**
  - "Username or email" (line 40, `LoginForm.tsx`)
  - "Password" (line 54, `LoginForm.tsx`)
- **Links visible:**
  - "Forgot your username" → `/forgot-password`
  - "Forgot your password" → `/forgot-password`
  - "Don't have an account?" → `/signup` (line 88-90, `LoginForm.tsx`)
- **Button text:** "Log In" or "Logging in..." when pending (line 83, `LoginForm.tsx`)
- **Success behavior:** Redirect to home (or redirect param if provided) and user session established
- **Button states:**
  - Enabled when form valid
  - Disabled when `isPending === true`
  - Opacity 85% on hover (line 81, `LoginForm.tsx`)

**File Locations for Labels:**
- Component: `/app/login/LoginForm.tsx` (lines 40-75)
- Page wrapper: `/app/login/page.tsx` (lines 5-30)

---

### FLOW 2: User Login (Invalid Credentials)
**Route:** `/login`  
**Precondition:** User credentials are incorrect or user doesn't exist  
**File Path:** `/app/login/LoginForm.tsx`

#### Actions:
1. Navigate to `/login`
2. Enter invalid email/username
3. Enter incorrect password
4. Click "Log In" button

#### Expected Visible Texts/UI Assertions:
- **Error message displayed:** Rounded bg-[#fdecec] with red text color: `text-[#b42318]`
- **Error styling:** `px-3 py-2 text-sm` (line 37, `LoginForm.tsx`)
- **Error message content:** Matches error returned from `signIn()` action
- **Button remains functional** to allow retry
- **No redirect occurs**

**Error Message Location:** Line 37, `/app/login/LoginForm.tsx`

---

### FLOW 3: User Signup (Valid Data)
**Route:** `/signup`  
**Precondition:** Not logged in; no account exists with given email/username  
**File Path:** `/app/signup/page.tsx`, `/app/signup/SignUpForm.tsx`

#### Actions:
1. Navigate to `/signup`
2. Fill in all required fields:
   - First Name
   - Last Name
   - Email (valid format)
   - Username
   - Password (≥6 characters)
   - LinkedIn URL (optional)
3. Click "Sign Up" button

#### Expected Visible Texts/UI Assertions:
- **Page Title:** "Sign up | SPEC"
- **Heading:** "Sign up to access the SPEC Application" (line 17, `SignUpForm.tsx`)
- **Input labels:**
  - "First Name" (line 90, `SignUpForm.tsx`)
  - "Last Name" (line 96, `SignUpForm.tsx`)
  - "Email" (line 104, `SignUpForm.tsx`)
  - "Username" (line 111, `SignUpForm.tsx`)
  - "Password" (line 118, `SignUpForm.tsx`)
  - "Your LinkedIn Profile URL (Optional)" (line 125-126, `SignUpForm.tsx`)
- **Button text:** "Sign Up" or "Signing up..." when pending (line 145, `SignUpForm.tsx`)
- **Link text:** "Already have an account? Log in." (line 149-151, `SignUpForm.tsx`)
- **Success behavior:** Redirect to `/login?registered=true`
- **Input styling:** Border-bottom only, focus state: `focus:border-[#FF6C0F] focus:ring-[#FF6C0F]`

**File Locations for Labels:**
- Component: `/app/signup/SignUpForm.tsx` (lines 88-154)

---

### FLOW 4: Signup Validation Errors
**Route:** `/signup`  
**Precondition:** Form data is invalid  
**File Path:** `/app/signup/SignUpForm.tsx`

#### Actions:
1. Navigate to `/signup`
2. Attempt various invalid inputs:
   - Leave required fields empty
   - Password < 6 characters
   - Invalid email format
   - Invalid LinkedIn URL format

#### Expected Visible Texts/UI Assertions:
- **Missing fields error:** "Please fill out all fields." (line 35, `SignUpForm.tsx`)
- **Short password error:** "Password must be at least 6 characters." (line 40, `SignUpForm.tsx`)
- **Invalid LinkedIn error:** "Please enter a valid LinkedIn profile URL." (lines 53, 57, `SignUpForm.tsx`)
- **Error styling:** `bg-[#fdecec] px-3 py-2 text-sm text-[#b42318]` (line 85, `SignUpForm.tsx`)
- **Button disabled until valid**
- **No submission occurs**

---

### FLOW 5: Account Registration Confirmation
**Route:** `/login?registered=true`  
**Precondition:** User just signed up successfully  
**File Path:** `/app/login/LoginForm.tsx`

#### Actions:
1. After successful signup, user is redirected to `/login?registered=true`

#### Expected Visible Texts/UI Assertions:
- **Success alert visible:** `bg-[#fff4e9] px-3 py-2 text-sm text-[#b64a00]` (line 34, `LoginForm.tsx`)
- **Alert text:** "Account created! Please log in."
- **Login form still visible**
- **User can now log in with new credentials**

**Alert Location:** Line 34, `/app/login/LoginForm.tsx`

---

## APPLICATION FLOWS

### FLOW 6: View Apply Landing Page (Not Logged In)
**Route:** `/apply`  
**Precondition:** User is not authenticated  
**File Path:** `/app/apply/page.tsx`

#### Actions:
1. Navigate to `/apply` without being logged in

#### Expected Visible Texts/UI Assertions:
- **Middleware redirect:** Redirects to `/login?redirect=/apply` (line 19, `page.tsx`)
- **Browser should show login page with redirect param**

---

### FLOW 7: View Apply Landing Page (Logged In, No Application)
**Route:** `/apply`  
**Precondition:** User is authenticated; has no existing application  
**File Path:** `/app/apply/page.tsx`

#### Actions:
1. Login successfully
2. Navigate to `/apply`

#### Expected Visible Texts/UI Assertions:
- **Page title:** "지원하기 | SPEC — 성균관대 창업학회"
- **Main heading:** "Apply to SPEC" (line 40, `page.tsx`)
- **Hero section visible:** Contains 4 paragraph blocks (lines 43-71)
  - "왜 창업인가..."
  - "남이 설계한 길..."
  - "SPEC은 성균관대학교..."
  - "현재 SPEC 4기 러너..."
- **CTA buttons visible:**
  - "Apply" button (primary) → `/apply/form`
  - "지원 현황 확인" button (secondary) → `/apply/status`
- **Button styling:**
  - Apply: `ApplyButton` component with href="/apply/form"
  - Status check: border, rounded-full, hover effect
- **"지원 안내" section heading** (line 114, `page.tsx`)
- **"모집 일정" section** with timeline (lines 136-223)
  - Timeline items showing recruitment schedule
  - Status badges: "completed", "active", "upcoming"
  - Visual connectors (dots and lines)
- **"30주 동안 일어나는 일" section** (line 232, `page.tsx`)
- **Contact info footer:** Name, phone, Instagram handle

**File Path for Content:** `/app/apply/page.tsx` (full page)

---

### FLOW 8: View Apply Landing Page (Already Submitted Application)
**Route:** `/apply`  
**Precondition:** User is logged in; already submitted one application  
**File Path:** `/app/apply/page.tsx`

#### Actions:
1. Login with account that has existing application
2. Navigate to `/apply`

#### Expected Visible Texts/UI Assertions:
- **"Apply to SPEC" heading still visible**
- **ApplicationStatusCard component rendered** (line 76, `page.tsx`)
  - Shows applicant name, batch, submission date, status
- **Instead of Apply button, shows two links:**
  - "지원 현황 상세" → `/apply/status` (line 82, `page.tsx`)
  - "제출한 지원서 다시 보기" → `/apply/submitted` (line 88, `page.tsx`)
- **Buttons styled:** Border, hover effect to white background

**File Path:** `/app/apply/page.tsx` (lines 73-105)

---

### FLOW 9: Start Application Form (Step 0: Basic Info)
**Route:** `/apply/form`  
**Precondition:** User is authenticated; accessing form first time or reloading  
**File Path:** `/app/apply/form/page.tsx`

#### Actions:
1. Click "Apply" button from `/apply` page
2. Navigate to `/apply/form`
3. Page loads at Step 0

#### Expected Visible Texts/UI Assertions:
- **Progress indicator visible:** 4 steps shown (lines 194-216)
  - Step 0: Highlighted circle with "1"
  - Steps 1-3: Inactive circles
  - Lines connecting steps
  - Labels below: "기본 정보", "지원 질문 (1)", "지원 질문 (2)", "동의 확인"
- **Step header:**
  - Text: "Step 1 of 4" (orange) (line 224)
  - Heading: "기본 정보" (line 226)
  - Subtext: "이름, 학번, 연락처 등 기본 정보를 입력해주세요." (line 228)
- **Form fields visible** (lines 231-331):
  - 이름 * (Name)
  - 학번 * (Student ID)
  - 이메일 * (Email)
  - 연락처 * (Phone)
  - 전공 * (Major)
  - 학년 * (Grade - CustomSelect)
  - 현재 상태 * (Enrollment Status - CustomSelect)
  - 지원 차수 * (Batch - fixed to "SPEC 4기 러너")
- **Button states:**
  - "이전으로" (Previous) - disabled, border
  - "다음 단계로 →" (Next) - primary button
- **Input styling:** Border, focus state with orange ring
- **All required fields marked with * (asterisk)**

**File Path for Form:** `/app/apply/form/page.tsx` (lines 220-358)

---

### FLOW 10: Step 0 Form Validation
**Route:** `/apply/form` (Step 0)  
**Precondition:** User is on form Step 0  
**File Path:** `/app/apply/form/page.tsx`

#### Actions:
1. Leave required fields empty or invalid
2. Click "다음 단계로 →" button

#### Expected Visible Texts/UI Assertions:
- **Validation errors (line 56-98, `page.tsx` validateStep):**
  - All fields empty: "기본 정보의 모든 필수 항목을 입력해주세요."
  - Invalid student ID (< 8 digits): "올바른 학번을 입력해주세요."
- **Error message styling:** Red background `bg-red-50`, red text `text-red-600`, border `border-red-100`
- **Error animation:** `animate-shake` class
- **Form does not advance** to next step
- **Focus remains on form**

**Validation Logic:** Lines 56-99, `/app/apply/form/page.tsx`

---

### FLOW 11: Complete Step 1 (Q1-Q3 Questions)
**Route:** `/apply/form` (Step 1)  
**Precondition:** User passed Step 0 validation  
**File Path:** `/app/apply/form/page.tsx`

#### Actions:
1. Enter data in Step 0 and click "다음 단계로 →"
2. Form advances to Step 1
3. Answer three essay questions (Q1, Q2, Q3)
4. Click "다음 단계로 →"

#### Expected Visible Texts/UI Assertions:
- **Step header:** "Step 2 of 4" (orange)
- **Heading:** "지원 질문 (1/2)"
- **Subtext:** "각 질문에 솔직하고 구체적으로 답변해주세요."
- **Q1 Label:** "Q1. 왜 창업인가요? *" (line 374, `page.tsx`)
  - Hint: "창업에 관심을 가지게 된 계기와 이유를 자유롭게 작성해주세요. (최소 50자, 현재 {introduction.length}자)"
  - Placeholder: "창업에 관심을 가지게 된 배경..."
  - Field: `<textarea>` 6 rows, max 5000 chars
- **Q2 Label:** "Q2. 지금까지 직접 해본 것들을 알려주세요. *" (line 391)
  - Hint: "창업, 프로젝트, 팀 활동 등..." (최소 50자)
- **Q3 Label:** "Q3. SPEC에서의 30주가 끝난 후, 어떤 모습이고 싶나요? *" (line 408)
  - Hint: "SPEC 활동을 통해 달성하고 싶은 목표..." (최소 50자)
- **Character counter shown for each field:** "(현재 {length}자)"
- **Validation errors if < 50 characters:** `Q1 답변은 최소 50자 이상 작성해야 합니다. (현재 {length}자)`

**File Path:** `/app/apply/form/page.tsx` (lines 360-447)

---

### FLOW 12: Complete Step 2 (Q4-Q6 Questions)
**Route:** `/apply/form` (Step 2)  
**Precondition:** User passed Step 1 validation  
**File Path:** `/app/apply/form/page.tsx`

#### Actions:
1. Answer Q1-Q3 with ≥50 chars each and advance to Step 2
2. Answer Q4 (≥10 chars), Q5 (≥50 chars), Q6 (optional)
3. Click "다음 단계로 →"

#### Expected Visible Texts/UI Assertions:
- **Step header:** "Step 3 of 4"
- **Heading:** "지원 질문 (2/2)"
- **Subtext:** "활동 참여와 팀워크에 대해 답변해주세요."
- **Q4 Label:** "Q4. SPEC은 매주 금요일 정기 활동을 진행합니다. 참여 가능 여부와 각오를 알려주세요. *" (line 464)
  - Hint: "최소 10자" (line 466)
  - Field: `<textarea>` 4 rows, max 5000 chars
- **Q5 Label:** "Q5. 팀에서 본인은 어떤 사람인가요? *" (line 481)
  - Hint: "팀 내에서의 역할과 협업 스타일..." (최소 50자)
- **Q6 Label:** "Q6. 마지막으로 하고 싶은 말이 있다면 자유롭게 작성해주세요. (선택)" (line 498)
  - Hint: "선택 사항입니다."
  - Placeholder: "포트폴리오 링크, 추가 어필 사항..."
- **Character counters shown**
- **Validation errors matched to char counts**

**File Path:** `/app/apply/form/page.tsx` (lines 449-537)

---

### FLOW 13: Step 3 - Consent & Final Submission
**Route:** `/apply/form` (Step 3)  
**Precondition:** User passed Steps 0-2 validation  
**File Path:** `/app/apply/form/page.tsx`

#### Actions:
1. Answer all questions through Step 2 and advance to Step 3
2. Read consent information
3. Check consent checkbox
4. Click "최종 제출하기 →" button

#### Expected Visible Texts/UI Assertions:
- **Step header:** "Step 4 of 4"
- **Heading:** "개인정보 수집 및 동의" (line 562, `page.tsx`)
- **Subtext:** "지원 완료를 위해 동의가 필요합니다."
- **Consent section** (lines 567-591):
  - Heading: "개인정보 수집 및 이용 안내"
  - List items:
    - "수집 항목: 성명, 학번, 이메일, 연락처, 전공, 학년, 재학 상태..."
    - "수집 목적: SPEC 4기 회원 선발 및 활동 관리"
    - "보유 기간: 선발 종료 후 1년 간 보관 후 파기"
  - Warning: "* 귀하는 동의를 거부할 권리가 있으나..."
- **Checkbox label:** "개인정보 수집 및 이용에 동의합니다. (필수)"
- **Submit button:**
  - Text: "최종 제출하기 →"
  - When pending: "제출 처리 중..."
  - Disabled if checkbox not checked: `disabled:opacity-30`
  - Color: Orange `bg-[#FF6C0F]`
- **Submit button disabled until checkbox checked**

**File Path:** `/app/apply/form/page.tsx` (lines 555-618)

---

### FLOW 14: Application Successfully Submitted
**Route:** `/apply/form` (after successful submission)  
**Precondition:** User completed all form steps and submitted  
**File Path:** `/app/apply/form/page.tsx`

#### Actions:
1. Check consent checkbox
2. Click "최종 제출하기 →"
3. Application is successfully saved to database

#### Expected Visible Texts/UI Assertions:
- **Success page rendered** (lines 132-187, `page.tsx`)
- **Success emoji:** ✨ in rounded box with orange border
- **Main heading:** "지원이 완료되었습니다!" (line 143)
- **Subtitle:** "성균관대학교 실전창업동아리 SPEC 4기에 소중한 시간을 내어 지원해주셔서 진심으로 감사합니다."
- **Info box** with recruitment schedule:
  - Heading: "모집 절차" with orange dot
  - Timeline items:
    - "1차 서류 접수: 3/1(일) ~ 3/12(목)"
    - "서류 결과 발표: 3/15(일)"
    - "2차 온라인 면접: 3/16(월) ~ 3/22(일)"
    - "최종 결과 발표: 3/23(월)"
    - "OT (필참): 3/27(금)"
  - Contact info:
    - "안내 채널: 지원서에 기재하신 개별 이메일"
    - "문의: 전도현 (회장) 010-9445-0964"
    - "spec.skku@gmail.com"
- **Home button:** "홈으로 이동하기 →" (black background)
- **Animation:** `animate-in fade-in zoom-in duration-700`

**File Path:** `/app/apply/form/page.tsx` (lines 132-187)

---

### FLOW 15: Check Application Status (Logged In)
**Route:** `/apply/status`  
**Precondition:** User is logged in and has submitted application  
**File Path:** `/app/apply/status/page.tsx`, `/app/apply/status/ApplicationStatusCard.tsx`

#### Actions:
1. Navigate to `/apply/status` while logged in
2. User's submitted application is fetched and linked automatically

#### Expected Visible Texts/UI Assertions:
- **Page title:** "지원 현황 확인"
- **Subtitle message:** "로그인 계정에 연결된 지원서 현황입니다."
- **ApplicationStatusCard component shows:**
  - Section heading: "지원 현황" (line 40, `ApplicationStatusCard.tsx`)
  - **Status fields:**
    - "지원자" → Shows applicant name
    - "지원 차수" → Shows batch (e.g., "4기")
    - "접수일" → Shows formatted date
    - "현재 상태" → Shows status badge with color coding
    - "결과 발표" → "3월 23일 (월)" (fixed date from RESULT_ANNOUNCEMENT_DATE)
  - **Status badge colors** (lines 8-13, `ApplicationStatusCard.tsx`):
    - pending: `bg-[#FFF0E5] text-[#FF6C0F]` → "접수완료"
    - under_review: `bg-[#E8F0FE] text-[#2563EB]` → "심사중"
    - accepted: `bg-[#E6F9E6] text-[#2f9e44]` → "합격"
    - rejected: `bg-[#FEE2E2] text-[#b42318]` → "불합격"
  - **Conditional messages:**
    - If accepted: `bg-[#E6F9E6] text-[#2f9e44]` - "축하합니다! 합격하셨습니다. 추후 안내 메일을 확인해주세요."
    - If rejected: `bg-[#FEE2E2] text-[#b42318]` - "아쉽게도 이번에는 함께하지 못하게 되었습니다. 다음 기회에 다시 지원해주세요."
- **Link:** "제출한 지원서 다시 보기" → `/apply/submitted`
- **Back link:** "← 지원 페이지로 돌아가기" → `/apply`

**File Paths:**
- Page: `/app/apply/status/page.tsx`
- Card Component: `/app/apply/status/ApplicationStatusCard.tsx` (lines 1-105)

---

### FLOW 16: Check Application Status (Not Logged In)
**Route:** `/apply/status`  
**Precondition:** User is not logged in  
**File Path:** `/app/apply/status/page.tsx`, `/app/apply/status/StatusCheckForm.tsx`

#### Actions:
1. Navigate to `/apply/status` without logging in
2. See status check form
3. Enter email and student ID
4. Click "조회하기"

#### Expected Visible Texts/UI Assertions:
- **Page title:** "지원 현황 확인"
- **Subtitle message:** "지원서 제출 시 입력한 이메일과 학번으로 현재 지원 상태를 확인할 수 있습니다."
- **StatusCheckForm visible** (lines 28-83, `StatusCheckForm.tsx`):
  - Label: "이메일"
  - Input placeholder: "지원 시 입력한 이메일"
  - Input type: email
  - Label: "학번"
  - Input placeholder: "8~10자리 숫자"
  - Input type: numeric
  - Button: "조회하기" or "조회 중..." when loading
  - Button disabled if email or studentId empty
- **Success:** Shows ApplicationStatusCard with application data
- **Error:** Shows red error message box with returned error text

**File Path:** `/app/apply/status/StatusCheckForm.tsx`

---

## DASHBOARD FLOWS

### FLOW 17: View Dashboard (User Redirect)
**Route:** `/dashboard`  
**Precondition:** User is authenticated  
**File Path:** `/app/dashboard/page.tsx`

#### Actions:
1. Navigate to `/dashboard`

#### Expected Visible Texts/UI Assertions:
- **Redirect occurs:** `/dashboard` → `/dashboard/applications` (line 4)
- **No content rendered** on `/dashboard` itself; middleware handles redirect

---

### FLOW 18: View Applications Dashboard
**Route:** `/dashboard/applications`  
**Precondition:** User is authenticated  
**File Path:** `/app/dashboard/applications/page.tsx`

#### Actions:
1. Navigate to `/dashboard/applications`
2. View list of all applications (user has access to)

#### Expected Visible Texts/UI Assertions:
- **Page heading:** "지원서 목록" (line 44, `page.tsx`)
- **Count indicator:** "총 {count}개" (line 48)
- **Desktop table** (hidden on mobile, visible on lg breakpoint):
  - Table headers (line 56-63):
    - "지원자"
    - "전공"
    - "지원 차수"
    - "지원일"
    - "상태"
    - "관리" (right-aligned)
  - **For each application row:**
    - Applicant name (bold) with email below in small gray text
    - Major (if available, else "-")
    - Batch with "기" suffix (e.g., "4기")
    - Formatted date
    - Status badge
      - pending: "접수 완료" with light orange background
    - Action links:
      - "열람하기" → `/dashboard/applications/{id}`
      - If user is admin: "Delete" button
- **Mobile cards** (visible on mobile, hidden on lg):
  - Card layout with name, email, status badge
  - Info row with major, batch, date
  - Action buttons below

**File Path:** `/app/dashboard/applications/page.tsx` (full page)

---

### FLOW 19: View Individual Application
**Route:** `/dashboard/applications/[id]`  
**Precondition:** User is authenticated and application exists  
**File Path:** `/app/dashboard/applications/[id]/page.tsx`

#### Actions:
1. Click "열람하기" button on applications list
2. Navigate to application detail page

#### Expected Visible Texts/UI Assertions:
- **Application details displayed:**
  - All form fields shown in read-only format
  - Name, student ID, email, phone, major, grade, enrollment status
  - All Q1-Q6 answers displayed
  - Submission date

---

## ADMIN FLOWS

### FLOW 20: Access Admin Dashboard (Authorized)
**Route:** `/admin`  
**Precondition:** User is authenticated and has "admin" role  
**File Path:** `/app/admin/page.tsx`, `/app/admin/layout.tsx`, `/app/admin/AdminSidebar.tsx`

#### Actions:
1. Navigate to `/admin`
2. Middleware verifies admin role via `requireRole("admin")`

#### Expected Visible Texts/UI Assertions:
- **Admin layout rendered** (line 17, `layout.tsx`):
  - Sidebar visible on desktop (lg breakpoint, line 20)
  - Mobile header visible on mobile (line 28)
  - Main content area
- **AdminSidebar component** (lines 30-79, `/app/admin/AdminSidebar.tsx`):
  - Header: Logo "S" in dark box + "SPEC Admin Panel"
  - Nav items with icons:
    - 📊 "Dashboard" → `/admin`
    - 👥 "Users" → `/admin/users`
    - 📋 "Applications" → `/admin/applications`
    - 📝 "Posts" → `/admin/posts`
    - 💼 "Jobs" → `/admin/jobs`
    - 📚 "Library" → `/admin/library`
    - 🚀 "Launches" → `/admin/launches`
  - Active nav item styling: `bg-[#FFF0E5] font-semibold text-[#FF6C0F]`
  - Footer link: "Back to Site" → `/`
- **Admin Dashboard Page** (lines 29-42, `/app/admin/page.tsx`):
  - Heading: "Admin Dashboard" (line 31)
  - **Stat cards grid** (6 cards):
    1. "Total Users" → count from profiles table
    2. "Total Posts" → count from posts table
    3. "Published Posts" → count of published posts
    4. "Comments" → count from comments table
    5. "Jobs" → count from jobs table
    6. "Library Items" → count from library_items table
  - **Card styling:** `rounded-lg border border-[#ddd9cc] bg-white p-6`
  - **Card content:**
    - Number displayed in bold large text `text-3xl font-bold`
    - Label below in small gray text `text-sm text-[#6b6b5e]`

**File Paths:**
- Page: `/app/admin/page.tsx`
- Layout: `/app/admin/layout.tsx`
- Sidebar: `/app/admin/AdminSidebar.tsx`

---

### FLOW 21: Access Admin (Unauthorized)
**Route:** `/admin`  
**Precondition:** User is authenticated but NOT admin  
**File Path:** `/app/admin/layout.tsx`, `/middleware.ts`

#### Actions:
1. Navigate to `/admin` with non-admin user
2. Middleware checks role via `requireRole("admin")`

#### Expected Visible Texts/UI Assertions:
- **Redirect occurs:** User redirected to `/` (home page)
- **No admin content shown**
- **No error message displayed**

**Middleware Check:** Line 14, `/app/admin/layout.tsx`; Lines 144-146, `/middleware.ts`

---

### FLOW 22: Admin Views Applications
**Route:** `/admin/applications`  
**Precondition:** User is admin; authenticated  
**File Path:** `/app/admin/applications/page.tsx`, `/app/admin/applications/ApplicationsClient.tsx`

#### Actions:
1. Click "Applications" in admin sidebar
2. Navigate to `/admin/applications`

#### Expected Visible Texts/UI Assertions:
- **Page heading:** "Applications" (large font, line 77, `ApplicationsClient.tsx`)
- **Count indicator:** "총 {count}건"
- **Desktop table** (lg+ breakpoint, lines 80-102):
  - Table headers:
    - "지원자" (applicant name)
    - "학번" (student ID)
    - "전공" (major)
    - "지원 차수" (batch)
    - "지원일" (submission date)
    - "상태" (status)
    - "관리" (management, right-aligned)
  - **For each application row:**
    - Name and email below
    - Student ID
    - Major
    - Batch (with "기" suffix)
    - Formatted date
    - **Status dropdown:** CustomSelect with options:
      - pending: "접수완료" `bg-[#FFF0E5] text-[#FF6C0F]`
      - under_review: "심사중" `bg-[#E8F0FE] text-[#2563EB]`
      - accepted: "합격" `bg-[#E6F9E6] text-[#2f9e44]`
      - rejected: "불합격" `bg-[#FEE2E2] text-[#b42318]`
    - **Management buttons:**
      - View button
      - Delete button (red)
- **Mobile cards** (mobile breakpoint, hidden on lg):
  - Card layout with applicant info
  - Status selection capability
  - Responsive buttons

**File Paths:**
- Page: `/app/admin/applications/page.tsx`
- Client component: `/app/admin/applications/ApplicationsClient.tsx` (lines 74-215)

---

### FLOW 23: Admin Updates Application Status
**Route:** `/admin/applications`  
**Precondition:** Admin is viewing applications list  
**File Path:** `/app/admin/applications/ApplicationsClient.tsx`

#### Actions:
1. Click status dropdown/CustomSelect for an application
2. Select new status (pending, under_review, accepted, rejected)
3. Update is saved via `updateApplicationStatus()` action

#### Expected Visible Texts/UI Assertions:
- **Status options displayed in CustomSelect:**
  - pending: "접수완료"
  - under_review: "심사중"
  - accepted: "합격"
  - rejected: "불합격"
- **Visual feedback:** Button disabled during submission (`isPending`)
- **Success:** Page refreshes via `router.refresh()`
- **Error:** Alert shown with error message (line 65, `ApplicationsClient.tsx`)
- **Badge color updates** to reflect new status

**File Path:** `/app/admin/applications/ApplicationsClient.tsx` (lines 59-72)

---

### FLOW 24: Admin Deletes Application
**Route:** `/admin/applications` or `/dashboard/applications`  
**Precondition:** Admin or dashboard user viewing application list  
**File Path:** `/components/dashboard/DeleteApplicationButton.tsx`

#### Actions:
1. Click delete button on an application
2. Confirm deletion if prompt shown
3. Application is deleted from database

#### Expected Visible Texts/UI Assertions:
- **Delete button visible** on admin and dashboard pages
- **Styling:** Red background or warning color
- **Confirmation:** May show alert/confirmation dialog
- **On success:** Application removed from list, page refreshes

---

### FLOW 25: Admin Views Users
**Route:** `/admin/users`  
**Precondition:** Admin is authenticated  
**File Path:** `/app/admin/users/UsersClient.tsx`

#### Actions:
1. Click "Users" in admin sidebar
2. Navigate to `/admin/users`

#### Expected Visible Texts/UI Assertions:
- **Page displays user list**
- **Similar table structure to applications**
- **User fields shown:** Username, email, role, created date, etc.

---

### FLOW 26: Admin Views Posts
**Route:** `/admin/posts`  
**Precondition:** Admin is authenticated  
**File Path:** `/app/admin/posts/PostsClient.tsx`

#### Actions:
1. Click "Posts" in admin sidebar
2. Navigate to `/admin/posts`

#### Expected Visible Texts/UI Assertions:
- **Page displays all blog posts**
- **Columns:** Title, author, status (draft/published), date
- **Actions:** Edit, delete, publish/unpublish

---

## ERROR HANDLING FLOWS

### FLOW 27: Rate Limiting on Application Submission
**Route:** `/apply/form`  
**Precondition:** User submits form multiple times within short period  
**File Path:** `/lib/actions/applications.ts`, `/lib/rate-limit.ts`

#### Actions:
1. Submit application form
2. Attempt to submit again within 15 minutes
3. Exceed rate limit (max 3 requests per 15 minutes)

#### Expected Visible Texts/UI Assertions:
- **Error message:** "너무 많은 요청입니다. {retryMinutes}분 후에 다시 시도해주세요." (line 44, `applications.ts`)
- **Error styling:** Red background alert
- **Form not submitted**
- **User informed of retry time**

**File Paths:**
- Rate limit logic: `/lib/actions/applications.ts` (lines 36-45)
- Rate limit config: `/lib/actions/applications.ts` (lines 29-32)

---

### FLOW 28: Database Error on Application Fetch
**Route:** `/apply/status` or `/dashboard/applications`  
**Precondition:** Database query fails  
**File Path:** `/app/apply/status/page.tsx`, `/app/dashboard/applications/page.tsx`

#### Actions:
1. Navigate to status/dashboard pages
2. Database connection fails or returns error

#### Expected Visible Texts/UI Assertions:
- **Error message displayed** in red alert box
- **Content:** "지원서 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
- **Error color:** `bg-[#FEE2E2] text-[#b42318]` (red)
- **Page still loads but shows error instead of data**

---

### FLOW 29: Validation Error - Email Format
**Route:** `/apply/form` (Step 0) or `/signup`  
**Precondition:** Invalid email format entered  
**File Path:** `/lib/actions/applications.ts`

#### Actions:
1. Enter invalid email format (e.g., "notanemail")
2. Submit form

#### Expected Visible Texts/UI Assertions:
- **Error message:** "올바른 이메일 형식을 입력해주세요." (line 72, `applications.ts`)
- **Form does not submit**
- **User sees error alert**

---

### FLOW 30: Validation Error - Student ID Format
**Route:** `/apply/form` (Step 0)  
**Precondition:** Student ID < 8 digits or invalid format  
**File Path:** `/lib/actions/applications.ts`

#### Actions:
1. Enter student ID with < 8 digits
2. Submit form Step 0

#### Expected Visible Texts/UI Assertions:
- **Error message (frontend):** "올바른 학번을 입력해주세요." (line 64, `page.tsx`)
- **Error message (backend):** "학번은 8~10자리 숫자여야 합니다." (line 76, `applications.ts`)
- **Form validation prevents submission**
- **User sees client-side error immediately**

---

## UI COMPONENT ASSERTIONS

### Component 1: LoginForm
**File Path:** `/app/login/LoginForm.tsx`

| Element | Type | Label/Text | Location | Styling |
|---------|------|-----------|----------|---------|
| Email input | input | "Username or email" | line 40 | `text-sm font-medium text-[#666]` |
| Password input | input | "Password" | line 54 | `text-sm font-medium text-[#666]` |
| Submit button | button | "Log In" / "Logging in..." | line 83 | `bg-[#FF6C0F] text-white py-3` |
| Forgot username link | link | "username" | line 70 | `text-[#FF6C0F] hover:underline` |
| Forgot password link | link | "password?" | line 74 | `text-[#FF6C0F] hover:underline` |
| Signup link | link | "Create an account." | line 89 | `text-[#FF6C0F] hover:underline` |
| Error alert | div | Dynamic error text | line 37 | `bg-[#fdecec] text-[#b42318]` |
| Registered alert | div | "Account created! Please log in." | line 34 | `bg-[#fff4e9] text-[#b64a00]` |

---

### Component 2: SignUpForm
**File Path:** `/app/signup/SignUpForm.tsx`

| Element | Type | Label/Text | Location | Styling |
|---------|------|-----------|----------|---------|
| First name input | input | "First Name" | line 90 | `INPUT_CLASSNAME` (border-bottom) |
| Last name input | input | "Last Name" | line 96 | `INPUT_CLASSNAME` |
| Email input | input | "Email" | line 104 | `INPUT_CLASSNAME` |
| Username input | input | "Username" | line 111 | `INPUT_CLASSNAME` |
| Password input | input | "Password" | line 118 | `INPUT_CLASSNAME` |
| LinkedIn input | input | "Your LinkedIn Profile URL (Optional)" | line 125-126 | `INPUT_CLASSNAME` |
| Submit button | button | "Sign Up" / "Signing up..." | line 145 | `bg-[#FF6C0F] text-white py-3` |
| Login link | link | "Log in." | line 150 | `text-[#FF6C0F] hover:underline` |
| Error alert | div | Dynamic error text | line 85 | `bg-[#fdecec] text-[#b42318]` |

---

### Component 3: ApplicationStatusCard
**File Path:** `/app/apply/status/ApplicationStatusCard.tsx`

| Element | Type | Label/Text | Location | Status Value |
|---------|------|-----------|----------|---|
| Card heading | h2 | "지원 현황" | line 40 | - |
| Applicant label | span | "지원자" | line 45 | {name} |
| Batch label | span | "지원 차수" | line 54 | {batch}기 |
| Submission date label | span | "접수일" | line 63 | formatted date |
| Status label | span | "현재 상태" | line 72 | status badge |
| Result date label | span | "결과 발표" | line 83 | "3월 23일 (월)" |
| Accepted message | div | "축하합니다! 합격하셨습니다..." | lines 92-94 | `bg-[#E6F9E6] text-[#2f9e44]` |
| Rejected message | div | "아쉽게도 이번에는..." | lines 98-101 | `bg-[#FEE2E2] text-[#b42318]` |

**Status Badge Colors:**
- pending: `bg-[#FFF0E5] text-[#FF6C0F]` → "접수완료"
- under_review: `bg-[#E8F0FE] text-[#2563EB]` → "심사중"
- accepted: `bg-[#E6F9E6] text-[#2f9e44]` → "합격"
- rejected: `bg-[#FEE2E2] text-[#b42318]` → "불합격"

---

### Component 4: ApplyButton
**File Path:** `/components/ui/ApplyButton.tsx`

| Property | Value | Location |
|----------|-------|----------|
| Default text | "Apply" | `/app/apply/page.tsx` line 96 |
| href default | "/apply/form" | Used in apply page |
| Size | "xl" | Applied to button |
| Styling | Primary CTA button | `bg-[#16140f]` or `bg-[#FF6C0F]` |

---

### Component 5: CustomSelect
**File Path:** `/components/ui/CustomSelect.tsx`

| Usage | Location | Options |
|-------|----------|---------|
| Grade selection | `/app/apply/form/page.tsx` line 292 | "1학년", "2학년", "3학년", "4학년", "5학년 이상" |
| Enrollment status | `/app/apply/form/page.tsx` line 309 | "재학", "휴학", "졸업유예", "대학원생" |
| Batch | `/app/apply/form/page.tsx` line 325 | "SPEC 4기 러너" (fixed) |

---

### Component 6: AdminSidebar
**File Path:** `/app/admin/AdminSidebar.tsx`

| Item | Label | Icon | href | Location |
|------|-------|------|------|----------|
| Dashboard | "Dashboard" | 📊 | /admin | line 13 |
| Users | "Users" | 👥 | /admin/users | line 14 |
| Applications | "Applications" | 📋 | /admin/applications | line 15 |
| Posts | "Posts" | 📝 | /admin/posts | line 16 |
| Jobs | "Jobs" | 💼 | /admin/jobs | line 17 |
| Library | "Library" | 📚 | /admin/library | line 18 |
| Launches | "Launches" | 🚀 | /admin/launches | line 19 |

**Active styling:** `bg-[#FFF0E5] font-semibold text-[#FF6C0F]` (line 58)

---

### Component 7: DeleteApplicationButton
**File Path:** `/components/dashboard/DeleteApplicationButton.tsx`

| Property | Value |
|----------|-------|
| Trigger | Delete button on application row |
| Action | Calls `deleteApplication(id)` |
| Confirmation | May show alert before deletion |
| Styling | Warning/delete color (red) |
| Locations | `/dashboard/applications`, `/admin/applications` |

---

## APPLICATION FORM FIELD MAPPING

**All form field names and their locations:**

### Step 0: Basic Info
| Field | HTML name | Type | Required | Min length | Max length | File location |
|-------|-----------|------|----------|-----------|-----------|---|
| Name | name | text | ✓ | 2 | 50 | line 235 |
| Student ID | student_id | text | ✓ | 8 | 10 | line 246 |
| Email | email | email | ✓ | - | - | line 257 |
| Phone | phone | text | ✓ | - | 13 (formatted) | line 269 |
| Major | major | text | ✓ | 1 | 100 | line 281 |
| Grade | grade | select | ✓ | - | - | line 292 |
| Enrollment Status | enrollment_status | select | ✓ | - | - | line 309 |
| Batch | batch | select | ✓ | Fixed: "4" | - | line 325 |

### Step 1: Questions 1-3
| Field | HTML name | Type | Required | Min length | Max length | File location |
|-------|-----------|------|----------|-----------|-----------|---|
| Q1 Introduction | introduction | textarea | ✓ | 50 | 5000 | line 377 |
| Q2 Vision | vision | textarea | ✓ | 50 | 5000 | line 394 |
| Q3 Startup Idea | startup_idea | textarea | ✓ | 50 | 5000 | line 411 |

### Step 2: Questions 4-6
| Field | HTML name | Type | Required | Min length | Max length | File location |
|-------|-----------|------|----------|-----------|-----------|---|
| Q4 Friday Participation | portfolio_url | textarea | ✓ | 10 | 5000 | line 468 |
| Q5 Team Role | experience_extra | textarea | ✓ | 50 | 5000 | line 485 |
| Q6 Additional Comments | additional_comments | textarea | ✗ | - | 5000 | line 502 |

### Step 3: Consent
| Field | HTML id | Type | Required | File location |
|-------|---------|------|----------|---|
| Consent Checkbox | consent-checkbox | checkbox | ✓ | line 581 |

---

## AUTHENTICATION MIDDLEWARE PROTECTION

**Protected Routes (require authentication):**
- `/profile` and sub-routes
- `/blog/write` and sub-routes
- `/blog/edit` and sub-routes
- `/admin` and sub-routes

**Admin-only routes:**
- `/admin` and all sub-routes (`/admin/users`, `/admin/applications`, etc.)

**Writer routes (member or admin):**
- `/blog/write`
- `/blog/edit`

**Middleware enforcement:** `/middleware.ts` (lines 91-153)

---

## COLOR PALETTE FOR TESTING

**Primary brand colors:**
- Primary dark: `#16140f`
- Primary orange: `#FF6C0F`
- Background: `#f5f5ee` or `#fcfcf8`
- Text: `#4a4a40`, `#6b6b5e`, `#9a9a8c`
- Border: `#ddd9cc`, `#f0efe6`

**Status colors:**
- Pending: `bg-[#FFF0E5] text-[#FF6C0F]`
- Under review: `bg-[#E8F0FE] text-[#2563EB]`
- Accepted: `bg-[#E6F9E6] text-[#2f9e44]`
- Rejected: `bg-[#FEE2E2] text-[#b42318]`

**Error colors:**
- Error bg: `bg-[#fdecec]`, text: `text-[#b42318]`
- Success bg: `bg-[#fff4e9]`, text: `text-[#b64a00]`

---

## PLAYWRIGHT TEST SELECTORS REFERENCE

**Common selectors for Playwright tests:**

```typescript
// Login page
page.getByLabel('Username or email')
page.getByLabel('Password')
page.getByRole('button', { name: 'Log In' })
page.getByText('Don\'t have an account?')

// Signup page
page.getByLabel('First Name')
page.getByLabel('Last Name')
page.getByLabel('Email')
page.getByLabel('Username')
page.getByLabel('Password')
page.getByLabel('Your LinkedIn Profile URL')
page.getByRole('button', { name: 'Sign Up' })

// Apply form steps
page.getByText('Step 1 of 4')
page.getByText('기본 정보')
page.getByLabel('이름 *')
page.getByLabel('학번 *')
page.getByRole('button', { name: 'Apply' })
page.getByRole('button', { name: '다음 단계로 →' })

// Application status
page.getByText('지원 현황')
page.getByText(/접수완료|심사중|합격|불합격/)

// Admin sidebar
page.getByRole('link', { name: 'Dashboard' })
page.getByRole('link', { name: 'Applications' })
page.getByText('Admin Dashboard')

// Dashboard applications
page.getByText('지원서 목록')
page.getByRole('columnheader', { name: '지원자' })
page.getByRole('button', { name: '열람하기' })
```

---

## SUMMARY TABLE

| Area | Route | File | Key Elements |
|------|-------|------|---|
| **Auth** | `/login` | `app/login/*.tsx` | Email, Password, Links, Errors |
| **Auth** | `/signup` | `app/signup/*.tsx` | 6 input fields, validation |
| **Apply** | `/apply` | `app/apply/page.tsx` | Hero, CTA, Timeline, Info |
| **Apply** | `/apply/form` | `app/apply/form/page.tsx` | 4-step form, 14 fields, validation |
| **Apply** | `/apply/status` | `app/apply/status/*.tsx` | Status card, status check form |
| **Dashboard** | `/dashboard/applications` | `app/dashboard/applications/*.tsx` | Table/cards of applications |
| **Admin** | `/admin` | `app/admin/page.tsx` | Stat cards (6) |
| **Admin** | `/admin/applications` | `app/admin/applications/*.tsx` | Editable applications table |
| **Admin** | `/admin/layout.tsx` | Sidebar, nav, role protection | |

---

**END OF DOCUMENT**
