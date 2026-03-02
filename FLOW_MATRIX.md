# Complete User-Facing Flow Matrix for SPEC Web

**Repository**: `/Users/cosmos/Documents/spec-web/yc-clone`  
**Framework**: Next.js 15 (App Router)  
**Date Generated**: March 2, 2026

---

## 1. LANDING & HOME FLOWS

### 1.1 Landing Page (Public)
| Element | Details |
|---------|---------|
| **Route Path** | `/` |
| **File Path** | `./app/page.tsx` |
| **Layout** | `./app/layout.tsx` |
| **Entry Point** | Direct navigation or home link |
| **User Type** | All (unauthenticated & authenticated) |
| **Expected Outcome** | View hero, philosophy, partners, curriculum, manifesto, alumni grid, CTA |
| **Key Components** | ScrollBackground, Hero, Philosophy, Manifesto, Partners, TwoTracks, CurriculumRoadmap, AlumniGrid, CTA |
| **Navigation Exits** | `/apply`, `/about`, `/curriculum`, `/people`, `/companies`, `/founders`, `/blog`, `/partners`, `/subscribe`, `/cofounder-matching`, `/login`, `/profile` (if auth), `/dashboard/applications` (if member), `/admin` (if admin) |
| **Auth Required** | No |

---

## 2. AUTHENTICATION FLOWS

### 2.1 Login Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/login` |
| **File Path** | `./app/login/page.tsx` |
| **Component** | `./app/login/LoginForm` |
| **Entry Point** | Navbar "로그인" link, `/login?redirect=/apply` (from /apply), or direct |
| **User Type** | Unauthenticated |
| **Expected Outcome** | Successfully authenticate user and redirect to dashboard or specified route |
| **Query Parameters** | `redirect` (optional), `registered` (optional) |
| **Auth Callback** | `./app/auth/callback/route.ts` |
| **Success Path** | Redirect to `searchParams.redirect` or `/dashboard/applications` |
| **Auth Required** | No |

### 2.2 Signup Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/signup` |
| **File Path** | `./app/signup/page.tsx` |
| **Entry Point** | Navbar auth dropdown or direct navigation |
| **User Type** | Unauthenticated |
| **Expected Outcome** | Create new account |
| **Auth Required** | No |

### 2.3 Forgot Password Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/forgot-password` |
| **File Path** | `./app/forgot-password/page.tsx` |
| **Entry Point** | Login form or direct navigation |
| **User Type** | Unauthenticated |
| **Expected Outcome** | Reset password via email |
| **Auth Required** | No |

### 2.4 Email Verification Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/verify` |
| **File Path** | `./app/verify/page.tsx` |
| **Layout** | `./app/verify/layout.tsx` |
| **Entry Point** | Auto-redirect from auth flow or email link |
| **User Type** | User with pending email verification |
| **Expected Outcome** | Verify email address to complete signup |
| **Auth Required** | Session/token |

---

## 3. APPLICATION FLOWS

### 3.1 Apply Landing Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/apply` |
| **File Path** | `./app/apply/page.tsx` |
| **Entry Point** | Navbar orange banner or "Apply" button |
| **User Type** | Authenticated (redirects to `/login?redirect=/apply` if not) |
| **Expected Outcome** | View application status or start new application |
| **Key Components** | ApplicationStatusCard |
| **Status Branches** | If already applied → Show status + links to `/apply/status` and `/apply/submitted`; Else → Show "Apply" button and "Check Status" link |
| **Navigation Exits** | `/apply/form` (new), `/apply/status` (existing), `/apply/submitted` (existing) |
| **Auth Required** | Yes (member role) |

### 3.2 Application Form Flow (Multi-Step)
| Element | Details |
|---------|---------|
| **Route Path** | `/apply/form` |
| **File Path** | `./app/apply/form/page.tsx` |
| **Layout** | `./app/apply/form/layout.tsx` |
| **Entry Point** | `/apply` → "Apply" button |
| **User Type** | Authenticated member |
| **Step 0** | **기본 정보** - Name, Student ID, Email, Phone, Major, Grade, Enrollment Status (required) |
| **Step 1** | **지원 질문 (1)** - Q1: Why startup? (50+ chars), Q2: What have you built? (50+ chars), Q3: 30 weeks after (50+ chars) |
| **Step 2** | **지원 질문 (2)** - Q4: Friday participation (10+ chars), Q5: Team role (50+ chars), Q6: Additional comments (optional) |
| **Step 3** | **동의 확인** - Accept terms and conditions |
| **Expected Outcome** | Submit application → Redirect to `/apply/submitted` with success message |
| **Validation Rules** | All required fields, minimum character counts per field, valid email/phone format |
| **Server Action** | `submitApplication()` from `@/lib/actions/applications` |
| **Auth Required** | Yes (member role) |

### 3.3 Application Status View Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/apply/status` |
| **File Path** | `./app/apply/status/page.tsx` |
| **Entry Point** | `/apply` → "지원 현황 확인" link or navbar |
| **User Type** | Authenticated |
| **Expected Outcome** | View application status (submitted, under review, accepted, rejected) |
| **Auth Required** | Yes |

### 3.4 Application Submitted Confirmation Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/apply/submitted` |
| **File Path** | `./app/apply/submitted/page.tsx` |
| **Entry Point** | Auto-redirect from `/apply/form` after successful submission |
| **User Type** | Authenticated |
| **Expected Outcome** | Display submission confirmation with next steps |
| **Navigation Exits** | `/apply/status`, back to home |
| **Auth Required** | Yes |

### 3.5 Dropbox Integration Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/apply/dropbox` |
| **File Path** | `./app/apply/dropbox/page.tsx` |
| **Entry Point** | Possible supplementary file upload |
| **User Type** | Authenticated |
| **Expected Outcome** | Upload files to application (optional) |
| **Auth Required** | Yes |

---

## 4. BLOG FLOWS

### 4.1 Blog List Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/blog` |
| **File Path** | `./app/blog/page.tsx` |
| **Layout** | `./app/blog/layout.tsx` |
| **Client Component** | `./app/blog/BlogPageClient.tsx` |
| **Entry Point** | Navbar `/blog` link |
| **User Type** | All |
| **Expected Outcome** | View list of blog posts with filtering by tags |
| **Data Source** | `getBlogPosts()`, `getBlogTags()` from `@/lib/api` |
| **Revalidation** | 60 seconds |
| **Navigation Exits** | `/blog/[slug]` (post detail), `/blog/tag/[tag]` (filtered), `/blog/write` (if admin), `/blog/edit/[slug]` (if admin) |
| **Auth Required** | No (but admin features hidden unless authenticated) |

### 4.2 Blog Post Detail Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/blog/[slug]` |
| **File Path** | `./app/blog/[slug]/page.tsx` |
| **Entry Point** | `/blog` → click post or direct URL |
| **User Type** | All |
| **Expected Outcome** | View full blog post content |
| **Dynamic Metadata** | `generateMetadata()` function for post title/description |
| **Navigation Exits** | Back to `/blog`, related posts (if available), `/blog/tag/[tag]` |
| **Auth Required** | No |

### 4.3 Blog Tag Filter Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/blog/tag/[tag]` |
| **File Path** | `./app/blog/tag/[tag]/page.tsx` |
| **Entry Point** | `/blog` → click tag |
| **User Type** | All |
| **Expected Outcome** | View filtered list of posts by tag |
| **Navigation Exits** | Individual posts, back to `/blog` |
| **Auth Required** | No |

### 4.4 Blog Write/Create Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/blog/write` |
| **File Path** | `./app/blog/write/page.tsx` |
| **Component** | `./app/blog/PostEditorForm.tsx` |
| **Entry Point** | `/blog` → "Write" button (admin only) |
| **User Type** | Admin |
| **Expected Outcome** | Create new blog post |
| **Image Upload** | `./app/api/upload/blog-image/route.ts` |
| **Success Path** | Redirect to `/blog/[slug]` of new post |
| **Auth Required** | Yes (admin role) |

### 4.5 Blog Edit Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/blog/edit/[slug]` |
| **File Path** | `./app/blog/edit/[slug]/page.tsx` |
| **Component** | `./app/blog/PostEditorForm.tsx` |
| **Entry Point** | `/blog/[slug]` → "Edit" button (admin only) |
| **User Type** | Admin |
| **Expected Outcome** | Edit existing blog post |
| **Success Path** | Redirect to `/blog/[slug]` (updated post) |
| **Auth Required** | Yes (admin role) |

---

## 5. JOBS FLOWS

### 5.1 Jobs List Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/jobs` |
| **File Path** | `./app/jobs/page.tsx` |
| **Layout** | `./app/jobs/layout.tsx` |
| **Client Component** | `./app/jobs/JobsClient.tsx` |
| **Entry Point** | Navbar `/jobs` link (if visible) |
| **User Type** | All |
| **Expected Outcome** | View list of available job postings |
| **Data Source** | Supabase `jobs` table (active only, ordered by posted date) |
| **Navigation Exits** | `/jobs/location/[city]`, `/jobs/role/[role]` |
| **Auth Required** | No |

### 5.2 Jobs by Location Filter Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/jobs/location/[city]` |
| **File Path** | `./app/jobs/location/[city]/page.tsx` |
| **Entry Point** | `/jobs` → click location filter |
| **User Type** | All |
| **Expected Outcome** | View jobs filtered by city |
| **Navigation Exits** | Individual job detail, back to `/jobs` |
| **Auth Required** | No |

### 5.3 Jobs by Role Filter Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/jobs/role/[role]` |
| **File Path** | `./app/jobs/role/[role]/page.tsx` |
| **Entry Point** | `/jobs` → click role filter |
| **User Type** | All |
| **Expected Outcome** | View jobs filtered by role |
| **Navigation Exits** | Individual job detail, back to `/jobs` |
| **Auth Required** | No |

---

## 6. PEOPLE/TEAM FLOWS

### 6.1 People Directory Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/people` |
| **File Path** | `./app/people/page.tsx` |
| **Data Source** | Supabase `members` table |
| **Entry Point** | Navbar → 소개 dropdown → People |
| **User Type** | All |
| **Expected Outcome** | View team members organized by role (Lead, Engineering, Design, Partnerships, Contents) |
| **Components** | PageHeader, team member cards with links to individual profiles |
| **Navigation Exits** | `/people/[slug]` (member detail) |
| **Auth Required** | No |

### 6.2 Member Profile Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/people/[slug]` |
| **File Path** | `./app/people/[slug]/page.tsx` |
| **Entry Point** | `/people` → click member card |
| **User Type** | All |
| **Expected Outcome** | View detailed member profile (name, title, bio, social links, etc.) |
| **Dynamic Metadata** | `generateMetadata()` for member name/bio |
| **Navigation Exits** | Back to `/people`, social links (external) |
| **Auth Required** | No |

---

## 7. LIBRARY/RESOURCES FLOWS

### 7.1 Library Main Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/library` |
| **File Path** | `./app/library/page.tsx` |
| **Layout** | `./app/library/layout.tsx` |
| **Data Source** | `libraryItems` from `./library-data.ts` |
| **Entry Point** | Navbar (commented out currently) or direct |
| **User Type** | All |
| **Expected Outcome** | Browse categorized learning resources with search |
| **Categories** | Various (defined in library-data.ts) |
| **Features** | Search, filtering by category, time-ago helper |
| **Navigation Exits** | `/library/[slug]` (resource detail), `/library/search` |
| **Auth Required** | No |

### 7.2 Library Resource Detail Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/library/[slug]` |
| **File Path** | `./app/library/[slug]/page.tsx` |
| **Entry Point** | `/library` → click resource card |
| **User Type** | All |
| **Expected Outcome** | View detailed resource content |
| **Dynamic Metadata** | `generateMetadata()` for resource title/description |
| **Navigation Exits** | Back to `/library`, related resources |
| **Auth Required** | No |

### 7.3 Library Search Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/library/search` |
| **File Path** | `./app/library/search/page.tsx` |
| **Layout** | `./app/library/search/layout.tsx` |
| **Entry Point** | `/library` → search input |
| **User Type** | All |
| **Expected Outcome** | View search results for library resources |
| **Search Parameters** | Query string (q, category, etc.) |
| **Navigation Exits** | `/library/[slug]` (result detail), back to `/library` |
| **Auth Required** | No |

---

## 8. ADMIN FLOWS

### 8.1 Admin Dashboard Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/admin` |
| **File Path** | `./app/admin/page.tsx` |
| **Layout** | `./app/admin/layout.tsx` |
| **Sidebar** | `./app/admin/AdminSidebar.tsx` |
| **Entry Point** | Navbar dropdown → Admin (if authenticated as admin) |
| **User Type** | Admin only |
| **Expected Outcome** | View admin dashboard with navigation to all admin functions |
| **Auth Guard** | `requireRole("admin")` |
| **Navigation Exits** | `/admin/users`, `/admin/applications`, `/admin/posts`, `/admin/jobs`, `/admin/library`, `/admin/launches` |
| **Auth Required** | Yes (admin role) |

### 8.2 Users Management Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/admin/users` |
| **File Path** | `./app/admin/users/page.tsx` |
| **Entry Point** | `/admin` → Users nav |
| **User Type** | Admin |
| **Expected Outcome** | View and manage user accounts |
| **Features** | List all users, edit roles, deactivate/activate |
| **Auth Required** | Yes (admin role) |

### 8.3 Applications Management Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/admin/applications` |
| **File Path** | `./app/admin/applications/page.tsx` |
| **Entry Point** | `/admin` → Applications nav |
| **User Type** | Admin |
| **Expected Outcome** | View and manage all applications, review status, make decisions |
| **Auth Required** | Yes (admin role) |

### 8.4 Blog Posts Management Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/admin/posts` |
| **File Path** | `./app/admin/posts/page.tsx` |
| **Entry Point** | `/admin` → Posts nav |
| **User Type** | Admin |
| **Expected Outcome** | View and manage blog posts |
| **Create New** | `/admin/posts/new` → Submit to `/blog/write` |
| **Navigation Exits** | `/admin/posts/new` (new post), post edit links |
| **Auth Required** | Yes (admin role) |

### 8.5 Create New Post Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/admin/posts/new` |
| **File Path** | `./app/admin/posts/new/page.tsx` |
| **Entry Point** | `/admin/posts` → "New Post" button |
| **User Type** | Admin |
| **Expected Outcome** | Redirects to or displays form for creating new blog post |
| **Success Path** | Redirect to `/blog/[slug]` of new post |
| **Auth Required** | Yes (admin role) |

### 8.6 Jobs Management Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/admin/jobs` |
| **File Path** | `./app/admin/jobs/page.tsx` |
| **Entry Point** | `/admin` → Jobs nav |
| **User Type** | Admin |
| **Expected Outcome** | Create, edit, delete job postings |
| **Data Source** | Supabase `jobs` table |
| **Auth Required** | Yes (admin role) |

### 8.7 Library Management Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/admin/library` |
| **File Path** | `./app/admin/library/page.tsx` |
| **Entry Point** | `/admin` → Library nav |
| **User Type** | Admin |
| **Expected Outcome** | Manage library resources |
| **Auth Required** | Yes (admin role) |

### 8.8 Launches Management Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/admin/launches` |
| **File Path** | `./app/admin/launches/page.tsx` |
| **Entry Point** | `/admin` → Launches nav |
| **User Type** | Admin |
| **Expected Outcome** | View and manage past launches/batches |
| **Auth Required** | Yes (admin role) |

---

## 9. DASHBOARD FLOWS

### 9.1 Dashboard Redirect Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/dashboard` |
| **File Path** | `./app/dashboard/page.tsx` |
| **Expected Outcome** | Redirect to `/dashboard/applications` |
| **Auth Required** | Yes (member role) |

### 9.2 User Applications Dashboard Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/dashboard/applications` |
| **File Path** | `./app/dashboard/applications/page.tsx` |
| **Layout** | `./app/dashboard/layout.tsx` |
| **Entry Point** | Navbar (if authenticated) → Dashboard, or `/dashboard` redirect |
| **User Type** | Authenticated member |
| **Expected Outcome** | View user's own applications and submissions |
| **Sidebar Navigation** | Mobile and desktop sidebars with links to other dashboard sections |
| **Navigation Exits** | `/dashboard/applications/[id]` (application detail) |
| **Auth Required** | Yes (member role) |

### 9.3 Application Detail Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/dashboard/applications/[id]` |
| **File Path** | `./app/dashboard/applications/[id]/page.tsx` |
| **Entry Point** | `/dashboard/applications` → click application |
| **User Type** | Authenticated member (owner only) |
| **Expected Outcome** | View detailed application with feedback and status |
| **Auth Required** | Yes (member role) |

---

## 10. PROFILE FLOWS

### 10.1 User Profile Page Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/profile` |
| **File Path** | `./app/profile/page.tsx` |
| **Entry Point** | Navbar → 나 dropdown → 프로필 (if authenticated) |
| **User Type** | Authenticated |
| **Expected Outcome** | View and edit user profile information |
| **API Endpoints** | POST `/api/profile/avatar` (avatar upload) |
| **Auth Required** | Yes |

---

## 11. INFORMATIONAL FLOWS

### 11.1 About Page Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/about` |
| **File Path** | `./app/about/page.tsx` |
| **Entry Point** | Navbar → 소개 dropdown → About |
| **User Type** | All |
| **Expected Outcome** | Learn about SPEC organization |
| **Auth Required** | No |

### 11.2 Curriculum/Learning Path Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/curriculum` |
| **File Path** | `./app/curriculum/page.tsx` |
| **Layout** | `./app/curriculum/layout.tsx` |
| **Entry Point** | Navbar → 소개 dropdown → 커리큘럼, or `/apply` page link |
| **User Type** | All |
| **Expected Outcome** | View 30-week curriculum roadmap and learning structure |
| **Auth Required** | No |

### 11.3 FAQ Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/faq` |
| **File Path** | `./app/faq/page.tsx` |
| **Layout** | `./app/faq/layout.tsx` |
| **Entry Point** | Navbar or application flow |
| **User Type** | All |
| **Expected Outcome** | View frequently asked questions and answers |
| **Auth Required** | No |

### 11.4 DemoDay Main Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/demoday` |
| **File Path** | `./app/demoday/page.tsx` |
| **Entry Point** | Navbar or direct link |
| **User Type** | All |
| **Expected Outcome** | View DemoDay event information and schedule |
| **Navigation Exits** | `/demoday/faq`, `/demoday/tips` |
| **Auth Required** | No |

### 11.5 DemoDay FAQ Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/demoday/faq` |
| **File Path** | `./app/demoday/faq/page.tsx` |
| **Entry Point** | `/demoday` → FAQ link |
| **User Type** | All |
| **Expected Outcome** | View DemoDay-specific FAQs |
| **Auth Required** | No |

### 11.6 DemoDay Tips Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/demoday/tips` |
| **File Path** | `./app/demoday/tips/page.tsx` |
| **Entry Point** | `/demoday` → Tips link |
| **User Type** | All |
| **Expected Outcome** | View preparation tips for DemoDay pitch |
| **Auth Required** | No |

### 11.7 Launches/Batches Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/launches` |
| **File Path** | `./app/launches/page.tsx` |
| **Layout** | `./app/launches/layout.tsx` |
| **Entry Point** | Navbar or direct link |
| **User Type** | All |
| **Expected Outcome** | View past and current batch/launch information |
| **Auth Required** | No |

### 11.8 Companies/Directory Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/companies` |
| **File Path** | `./app/companies/page.tsx` |
| **Layout** | `./app/companies/layout.tsx` |
| **Entry Point** | Navbar → 소개 dropdown → Companies |
| **User Type** | All |
| **Expected Outcome** | View list of companies (alumni startups or partner companies) |
| **Navigation Exits** | `/companies/[slug]` (company detail) |
| **Auth Required** | No |

### 11.9 Company Detail Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/companies/[slug]` |
| **File Path** | `./app/companies/[slug]/page.tsx` |
| **Entry Point** | `/companies` → click company |
| **User Type** | All |
| **Expected Outcome** | View detailed company information |
| **Dynamic Metadata** | `generateMetadata()` for company name/description |
| **Auth Required** | No |

### 11.10 Founders Directory Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/founders` |
| **File Path** | `./app/founders/page.tsx` |
| **Layout** | `./app/founders/layout.tsx` |
| **Entry Point** | Navbar → 소개 dropdown → Founders |
| **User Type** | All |
| **Expected Outcome** | View founder profiles and stories |
| **Auth Required** | No |

### 11.11 Partners Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/partners` |
| **File Path** | `./app/partners/page.tsx` |
| **Entry Point** | Navbar → Partners link |
| **User Type** | All |
| **Expected Outcome** | View partner organizations and collaborators |
| **Auth Required** | No |

### 11.12 Press/Media Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/press` |
| **File Path** | `./app/press/page.tsx` |
| **Entry Point** | Footer or direct link |
| **User Type** | All |
| **Expected Outcome** | View press coverage and media mentions |
| **Auth Required** | No |

### 11.13 Legal/Terms Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/legal` |
| **File Path** | `./app/legal/page.tsx` |
| **Entry Point** | Footer or signup |
| **User Type** | All |
| **Expected Outcome** | View terms of service, privacy policy, etc. |
| **Auth Required** | No |

### 11.14 Contact Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/contact` |
| **File Path** | `./app/contact/page.tsx` |
| **Entry Point** | Footer or direct link |
| **User Type** | All |
| **Expected Outcome** | Contact form or information |
| **Auth Required** | No |

### 11.15 Subscribe Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/subscribe` |
| **File Path** | `./app/subscribe/page.tsx` |
| **Entry Point** | Navbar → 추가 dropdown → Subscribe |
| **User Type** | All |
| **Expected Outcome** | Subscribe to newsletter or updates |
| **Auth Required** | No (optional - may use email) |

### 11.16 CoFounder Matching Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/cofounder-matching` |
| **File Path** | `./app/cofounder-matching/page.tsx` |
| **Layout** | `./app/cofounder-matching/layout.tsx` |
| **Entry Point** | Navbar → 추가 dropdown → Cofounder Matching |
| **User Type** | All (or members only) |
| **Expected Outcome** | Find potential cofounders within SPEC community |
| **Auth Required** | No (optional feature) |

### 11.17 VCC (Virtual Classroom) Flow
| Element | Details |
|---------|---------|
| **Route Path** | `/vcc` |
| **File Path** | `./app/vcc/page.tsx` |
| **Entry Point** | Navbar or direct link |
| **User Type** | All |
| **Expected Outcome** | View VCC mini-MBA information and sessions |
| **Auth Required** | No |

---

## 12. API ROUTES

### 12.1 Auth Callback Route
| Element | Details |
|---------|---------|
| **Route Path** | `/api/auth/callback` |
| **File Path** | `./app/auth/callback/route.ts` |
| **Method** | GET/POST |
| **Purpose** | Handle OAuth authentication callback from Supabase |
| **Query Parameters** | `code` (auth code), `state` (session state) |
| **Expected Outcome** | Create session and redirect to authenticated state |

### 12.2 Avatar Upload Route
| Element | Details |
|---------|---------|
| **Route Path** | `/api/profile/avatar` |
| **File Path** | `./app/api/profile/avatar/route.ts` |
| **Method** | POST |
| **Purpose** | Upload user avatar image |
| **Payload** | Form data with image file |
| **Expected Outcome** | Upload to Supabase Storage and update user profile |
| **Auth Required** | Yes |

### 12.3 Blog Image Upload Route
| Element | Details |
|---------|---------|
| **Route Path** | `/api/upload/blog-image` |
| **File Path** | `./app/api/upload/blog-image/route.ts` |
| **Method** | POST |
| **Purpose** | Upload image for blog post editor |
| **Payload** | Form data with image file |
| **Expected Outcome** | Upload to Supabase Storage and return image URL |
| **Auth Required** | Yes (admin role) |

---

## FLOW DEPENDENCY MATRIX

```
Public Flows (No Auth Required):
├── Landing (/)
├── About (/about)
├── Curriculum (/curriculum)
├── People (/people) → People Detail (/people/[slug])
├── Companies (/companies) → Company Detail (/companies/[slug])
├── Founders (/founders)
├── Blog (/blog) → Post Detail (/blog/[slug])
│   └── Tag Filter (/blog/tag/[tag])
├── Jobs (/jobs)
│   ├── By Location (/jobs/location/[city])
│   └── By Role (/jobs/role/[role])
├── Library (/library) → Resource Detail (/library/[slug])
│   └── Search (/library/search)
├── DemoDay (/demoday)
│   ├── FAQ (/demoday/faq)
│   └── Tips (/demoday/tips)
├── Launches (/launches)
├── Partners (/partners)
├── Press (/press)
├── Contact (/contact)
├── Subscribe (/subscribe)
├── CoFounder Matching (/cofounder-matching)
├── VCC (/vcc)
├── Legal (/legal)
├── FAQs (/faq)
└── Auth Required (but unauthenticated → login):
    ├── Login (/login)
    ├── Signup (/signup)
    └── Forgot Password (/forgot-password)
    └── Verify Email (/verify)

Authenticated Member Flows:
├── Apply Landing (/apply)
├── Application Form (/apply/form) [multi-step]
├── Application Status (/apply/status)
├── Application Submitted (/apply/submitted)
├── Dashboard (/dashboard → /dashboard/applications)
│   └── Application Detail (/dashboard/applications/[id])
├── Profile (/profile)
└── Blog Write (/blog/write) [if admin]

Admin-Only Flows:
├── Admin Dashboard (/admin)
├── Users Management (/admin/users)
├── Applications Management (/admin/applications)
├── Blog Posts Management (/admin/posts)
│   └── New Post (/admin/posts/new)
├── Jobs Management (/admin/jobs)
├── Library Management (/admin/library)
└── Launches Management (/admin/launches)
```

---

## KEY ENTRY POINTS SUMMARY

| Entry Point | Route | Protected | Purpose |
|------------|-------|-----------|---------|
| Home | `/` | No | Landing page |
| Apply Banner | `/apply` | Yes (redirect if needed) | Application entry |
| Navbar 소개 | Multiple | No | Educational content |
| Navbar 추가 | Multiple | No | Additional features |
| Navbar Auth | `/login`, `/signup` | No | Authentication |
| User Dropdown | `/profile`, `/dashboard`, `/admin` | Yes | User-specific areas |
| Footer | Various | No | Legal, contact, etc. |

---

## ROUTING GUARDS & AUTH REQUIREMENTS

### Role-Based Access Control (RBAC)
- **Public**: No authentication required
- **Authenticated**: Must have user session (any role)
- **Member**: Must have "member" role (via `requireRole("member")`)
- **Admin**: Must have "admin" role (via `requireRole("admin")`)

### Redirect Rules
- `/apply` without auth → `/login?redirect=/apply`
- `/dashboard/*` without auth → `/login?redirect=/dashboard/applications`
- `/admin/*` without admin role → Redirected or access denied

---

## SEARCH PATTERNS FOR TEST COVERAGE

**Test Coverage Domains:**
1. ✅ Landing (public)
2. ✅ Auth (login, signup, verify, password reset)
3. ✅ Apply (form steps, validation, submission, status)
4. ✅ Blog (list, detail, tags, write, edit)
5. ✅ Jobs (list, filters by location/role)
6. ✅ People (directory, profiles)
7. ✅ Library (resources, search)
8. ✅ Admin (dashboard, users, applications, posts, jobs, library, launches)
9. ✅ Dashboard (applications list, detail)
10. ✅ Profile (user profile, avatar upload)

