# Flow Analysis Summary - SPEC Web

**Analysis Date**: March 2, 2026  
**Analyzer**: Explore Agent  
**Repository**: `/Users/cosmos/Documents/spec-web/yc-clone`

---

## Executive Summary

Complete enumeration of all user-facing flows in SPEC Web application has been performed. The application is a Next.js 15 (App Router) based platform for managing a startup accelerator program.

### Key Statistics
- **Total Unique Routes**: 52 page routes + 3 API routes = **55 endpoints**
- **Primary Flow Domains**: 11 (Landing, Auth, Apply, Blog, Jobs, People, Library, Admin, Dashboard, Profile, Informational)
- **Authentication Levels**: 3 (Public, Authenticated Member, Admin-only)
- **Test Coverage Scenarios**: ~57 major test flows

---

## Core Application Structure

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (OAuth)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

### Root Layout
- **File**: `./app/layout.tsx`
- **Components**: Navbar, Footer
- **Key Features**: Global navigation, responsive design

---

## Flow Categories (11 Domains)

### 1. LANDING (1 flow)
- **Entry**: `/` (public)
- **Purpose**: Hero landing page with program overview
- **Key Sections**: Philosophy, Partners, Curriculum, Manifesto, Alumni, CTA
- **Navigation Hub**: Links to all major sections

### 2. AUTHENTICATION (4 flows)
- **Login** (`/login`) - Email/password authentication
- **Signup** (`/signup`) - New account creation
- **Forgot Password** (`/forgot-password`) - Password reset
- **Email Verification** (`/verify`) - Email confirmation
- **Guard**: `requireRole()` utility for access control
- **Session Management**: Supabase Auth integration

### 3. APPLICATION (5 flows)
- **Apply Landing** (`/apply`) - Entry point with status check
- **Application Form** (`/apply/form`) - 4-step multi-step form
  - Step 0: Basic info (name, student ID, email, phone, major, grade)
  - Step 1: Questions 1-3 (50+ char minimum)
  - Step 2: Questions 4-5 + optional field
  - Step 3: Consent & terms
- **Status Tracking** (`/apply/status`) - Application status viewer
- **Submission Confirmation** (`/apply/submitted`) - Success page
- **File Upload** (`/apply/dropbox`) - Supplementary files (optional)
- **Database**: `applications` table in Supabase
- **Validation**: Extensive client & server-side validation

### 4. BLOG (5 flows)
- **Blog List** (`/blog`) - Posts with tag filtering
- **Blog Detail** (`/blog/[slug]`) - Full post view
- **Tag Filter** (`/blog/tag/[tag]`) - Posts by tag
- **Create Post** (`/blog/write`) - Admin editor
- **Edit Post** (`/blog/edit/[slug]`) - Admin editor
- **Components**: PostEditorForm, BlogPageClient
- **Features**: Rich text editor, image upload, tagging
- **API**: `POST /api/upload/blog-image` for image uploads

### 5. JOBS (3 flows)
- **Jobs List** (`/jobs`) - Active job postings
- **By Location** (`/jobs/location/[city]`) - Location filter
- **By Role** (`/jobs/role/[role]`) - Role filter
- **Database**: `jobs` table (active = true only)
- **Sorting**: By posted date (newest first)

### 6. PEOPLE/TEAM (2 flows)
- **Directory** (`/people`) - Team members by role
- **Profile** (`/people/[slug]`) - Individual member profile
- **Database**: `members` table from Supabase
- **Organization**: Lead, Engineering, Design, Partnerships, Contents teams

### 7. LIBRARY/RESOURCES (3 flows)
- **Library Home** (`/library`) - Categorized resources
- **Resource Detail** (`/library/[slug]`) - Full resource
- **Search** (`/library/search`) - Resource search
- **Data**: Hardcoded `libraryItems` from library-data.ts
- **Features**: Category filtering, search, time-ago helpers

### 8. ADMIN PANEL (7 flows)
- **Dashboard** (`/admin`) - Admin home
- **Users** (`/admin/users`) - User management
- **Applications** (`/admin/applications`) - Application review
- **Blog Posts** (`/admin/posts`) - Post management
- **New Post** (`/admin/posts/new`) - Create post
- **Jobs** (`/admin/jobs`) - Job management
- **Library** (`/admin/library`) - Resource management
- **Launches** (`/admin/launches`) - Batch/launch management
- **Guard**: `requireRole("admin")`
- **Sidebar**: AdminSidebar component with nav

### 9. DASHBOARD (2 flows)
- **Redirect** (`/dashboard`) - Auto-redirect to applications
- **Applications** (`/dashboard/applications`) - User's applications list
- **Application Detail** (`/dashboard/applications/[id]`) - Specific application
- **Guard**: `requireRole("member")`
- **Layout**: Desktop sidebar + mobile header

### 10. PROFILE (1 flow)
- **User Profile** (`/profile`) - Profile edit & settings
- **Features**: Avatar upload, bio edit
- **API**: `POST /api/profile/avatar` for avatar uploads
- **Guard**: Authenticated users only

### 11. INFORMATIONAL (14+ flows)
Static/semi-dynamic pages for program information:
- **About** (`/about`) - Program overview
- **Curriculum** (`/curriculum`) - 30-week roadmap
- **FAQ** (`/faq`) - Frequently asked questions
- **DemoDay** (`/demoday`) - Event info
  - **FAQ** (`/demoday/faq`) - DemoDay FAQs
  - **Tips** (`/demoday/tips`) - Pitch preparation
- **Launches** (`/launches`) - Batch history
- **Companies** (`/companies`) - Alumni companies directory
- **Company Detail** (`/companies/[slug]`) - Individual company
- **Founders** (`/founders`) - Founder profiles
- **Partners** (`/partners`) - Partner organizations
- **Press** (`/press`) - Media coverage
- **Legal** (`/legal`) - Terms & privacy
- **Contact** (`/contact`) - Contact form
- **Subscribe** (`/subscribe`) - Newsletter signup
- **Cofounder Matching** (`/cofounder-matching`) - Team matching
- **VCC** (`/vcc`) - Mini-MBA program info

---

## API Routes (3 endpoints)

### Authentication
- `POST /api/auth/callback` - OAuth callback handler
  - File: `./app/auth/callback/route.ts`
  - Purpose: Handle Supabase auth response

### File Uploads
- `POST /api/profile/avatar` - Avatar upload
  - File: `./app/api/profile/avatar/route.ts`
  - Auth: Authenticated users
  
- `POST /api/upload/blog-image` - Blog image upload
  - File: `./app/api/upload/blog-image/route.ts`
  - Auth: Admin only

---

## Navigation Architecture

### Primary Navigation (Navbar)
**Component**: `./components/Navbar.tsx`

**Main Navigation Links**:
- 소개 (Intro) → `/about`, `/curriculum`, `/apply`, `/people`, `/companies`, `/founders`
- Partners → `/partners`
- Blog → `/blog`
- 나 (Profile) → `/profile`, `/dashboard/applications` (if member), `/admin` (if admin), `/login` (if not auth)
- 추가 (Additional) → `/subscribe`, `/cofounder-matching`

**Mobile/Responsive**: Full menu toggle with smooth scroll behavior

### Secondary Navigation
- **Dashboard Sidebar** (`./app/dashboard/layout.tsx`): Applications link
- **Admin Sidebar** (`./app/admin/AdminSidebar.tsx`): All admin sections

### Footer Navigation
- Legal links, contact, social media

---

## Authentication & Authorization

### Role-Based Access Control
- **Public** (no auth): Landing, blog, jobs, people, library, info pages
- **Authenticated Member**: Apply flows, dashboard
- **Admin Only**: All `/admin/*` routes

### Auth Guard Patterns
```typescript
await requireRole("member")  // For member routes
await requireRole("admin")   // For admin routes
```

### Session Management
- Supabase Auth for user management
- Redirect to `/login?redirect=` for unauthorized access
- Profile data from Supabase `members` table

---

## Data Flow Architecture

### Databases/Tables
- **users** - Supabase auth users
- **members** - Team member profiles (from `users` extended)
- **applications** - Program applications
- **jobs** - Job postings
- **blog_posts** - Blog content (or hardcoded)
- **library** - Resource library (hardcoded in library-data.ts)

### Data Sources
- **Supabase**: users, members, applications, jobs
- **Hardcoded**: Blog posts (partial), Library items, Team descriptions
- **External**: Blog images, Avatar images (stored in Supabase Storage)

---

## Key Features & Implementation Details

### Application Form
- **Multi-step form** with progress indicator
- **Client-side** form management with React hooks
- **Validation**: Required fields, minimum character counts
- **Submission**: Server action `submitApplication()`
- **Persistence**: Database write via Supabase

### Blog System
- **WYSIWYG Editor**: PostEditorForm component
- **Image Upload**: API route for image storage
- **Metadata**: Dynamic og:image, title, description
- **Revalidation**: 60-second ISR on blog list

### Admin Features
- **Multi-section Dashboard**: Users, Apps, Posts, Jobs, Library, Launches
- **CRUD Operations**: Create, read, update, delete for each resource
- **Sidebar Navigation**: Active route highlighting
- **Mobile Responsive**: Collapsible mobile header nav

---

## Critical User Journeys

### Journey 1: New User → Application
1. `/` (landing) → Click "Apply" banner
2. `/login` → Create account or login
3. `/apply` → Review program info
4. `/apply/form` → Complete 4-step form
5. `/apply/submitted` → Confirmation
6. `/apply/status` → Check status (ongoing)

### Journey 2: Existing User → Dashboard
1. `/login` → Authenticate
2. `/dashboard/applications` → View applications
3. `/dashboard/applications/[id]` → View specific app
4. `/profile` → Edit profile (optional)

### Journey 3: Admin → Content Management
1. `/login` → Authenticate as admin
2. `/admin` → Admin dashboard
3. `/admin/applications` → Review applications
4. `/admin/posts` → Manage blog
5. `/admin/jobs` → Manage jobs
... (other admin sections)

### Journey 4: Public → Learn → Engage
1. `/` → Landing
2. `/about` → Learn about program
3. `/curriculum` → View program structure
4. `/people` → Meet the team
5. `/blog` → Read content
6. `/apply` → Apply (with auth redirect)

---

## Testing Coverage Strategy

### Unit Tests (34 test suites)
- Component logic tests
- Form validation tests
- API handler tests
- Utility function tests

### E2E Tests (13 test suites)
- Complete user flows
- Cross-browser testing
- Mobile responsiveness
- Error scenarios

### Test Domains
1. ✅ Landing
2. ✅ Authentication (login, signup, password reset, email verify)
3. ✅ Application (form, validation, submission, status)
4. ✅ Blog (list, detail, tags, admin edit/create)
5. ✅ Jobs (list, filters)
6. ✅ People (directory, profiles)
7. ✅ Library (list, detail, search)
8. ✅ Admin (all 7 sections)
9. ✅ Dashboard (list, detail)
10. ✅ Profile (edit, avatar upload)
11. ✅ Informational pages (14+ pages)

---

## File Organization Summary

```
./app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout (Navbar, Footer)
├── about/
├── admin/                      # Admin panel
│   ├── layout.tsx
│   ├── AdminSidebar.tsx
│   ├── page.tsx
│   ├── users/
│   ├── applications/
│   ├── posts/
│   ├── jobs/
│   ├── library/
│   └── launches/
├── apply/                      # Application flows
│   ├── page.tsx
│   ├── form/
│   ├── status/
│   ├── submitted/
│   └── dropbox/
├── auth/
│   └── callback/route.ts       # OAuth handler
├── blog/                       # Blog system
│   ├── page.tsx
│   ├── [slug]/
│   ├── tag/
│   ├── write/
│   └── edit/
├── dashboard/                  # User dashboard
│   ├── layout.tsx
│   ├── page.tsx
│   └── applications/
├── jobs/
│   ├── page.tsx
│   ├── location/
│   └── role/
├── people/
├── library/
├── api/                        # API routes
│   ├── auth/callback
│   ├── profile/avatar
│   └── upload/blog-image
└── [informational routes]

./components/
├── Navbar.tsx                  # Main navigation
├── Footer.tsx
├── ApplyButton.tsx
└── [other components]
```

---

## Key Implementation Patterns

### Server Components + Client Components
- Page routes are server components by default
- Forms and interactive elements use "use client"
- Data fetching on server side where possible

### Authentication Pattern
```typescript
await getCurrentUser()  // Get current user
await requireRole("member")  // Guard routes
```

### Form Handling
```typescript
"use client"
const [isPending, startTransition] = useTransition()
startTransition(async () => {
  await submitApplication(formData)
})
```

### Data Fetching
- Server-side: Supabase queries
- Client-side: useQuery hooks or direct fetches
- ISR: Revalidation on blog list

---

## Outstanding Questions/Notes

1. **Blog Posts Storage**: Partially hardcoded vs database - confirm data source
2. **Library Items**: Currently hardcoded in library-data.ts - should this be database?
3. **Pagination**: Not explicitly implemented in all list views - should be added?
4. **Search**: Blog/Jobs/People search not fully visible - implement?
5. **Comments**: Blog comments system - implemented or TBD?
6. **Notifications**: Application status notifications - how delivered?

---

## Recommendations

### For Testing
1. **Priority Test Coverage**: Auth → Apply → Blog (critical paths)
2. **Test Framework**: Playwright for E2E, Vitest for unit
3. **Coverage Goal**: 80% unit, 100% critical flows
4. **Mock Data**: Create test users, applications, blog posts

### For Development
1. **Database Consolidation**: Move hardcoded data to Supabase
2. **Search Implementation**: Add search to blog, jobs, library
3. **Pagination**: Implement on all list views
4. **Error Boundaries**: Add per-section error handling
5. **Loading States**: Consistent loading indicators

### For DevOps
1. **CI/CD**: Already set up (GitHub Actions)
2. **Preview Deployments**: Vercel integration working
3. **Database Migrations**: Document Supabase schema
4. **Environment Variables**: .env.local template needed

---

## Generated Deliverables

### 1. FLOW_MATRIX.md (782 lines)
Complete structured flow matrix with:
- All 52 routes documented
- Entry points and exit points
- Authentication requirements
- Expected outcomes
- File paths and components

### 2. FLOW_QUICK_REFERENCE.csv (56 lines)
Quick lookup table with key fields:
- Route path
- File path
- Auth requirement
- Entry point
- Expected outcome

### 3. TEST_COVERAGE_MATRIX.md (752 lines)
Comprehensive test coverage guide with:
- ~57 major test flows
- Test scenarios per domain
- Checklist format
- 4 test categories (unit, E2E, critical, advanced)
- Estimated test count: 34 unit + 13 E2E

### 4. FLOW_ANALYSIS_SUMMARY.md (this document)
Executive summary with:
- Architecture overview
- Key statistics
- Flow categories
- Critical journeys
- File organization
- Recommendations

---

## How to Use These Documents

### For QA/Testing Teams
1. Start with `FLOW_QUICK_REFERENCE.csv` for quick route mapping
2. Use `TEST_COVERAGE_MATRIX.md` to create test cases
3. Reference `FLOW_MATRIX.md` for detailed flow specifications
4. Create test suites following the domains outlined

### For Developers
1. Review `FLOW_MATRIX.md` for architectural understanding
2. Use file paths and route mappings for navigation
3. Check `FLOW_ANALYSIS_SUMMARY.md` for implementation patterns
4. Reference for new feature integration

### For Project Managers
1. Use statistics in this summary for scope/effort estimation
2. Reference critical journeys for priority sequencing
3. Use test coverage matrix for QA planning
4. Track testing progress against domain checkpoints

---

## Analysis Completion Checklist

- [x] All page routes enumerated (52 routes)
- [x] All API routes identified (3 routes)
- [x] Entry points for each flow documented
- [x] Exit points and navigation paths mapped
- [x] Authentication/authorization requirements specified
- [x] File paths and component references included
- [x] Expected outcomes for each flow defined
- [x] Test coverage scenarios created (~57 flows)
- [x] Critical user journeys identified (4 main)
- [x] No file edits performed (read-only analysis)

---

**Analysis Complete** ✅

All user-facing flows have been comprehensively enumerated and documented for automated testing purposes. The three supporting documents provide detailed specifications, quick reference, and test coverage guidance.

**Next Steps**: Use these documents to create automated test suites across all identified flows and domains.
