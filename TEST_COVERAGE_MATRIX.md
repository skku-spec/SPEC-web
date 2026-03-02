# Test Coverage Matrix for SPEC Web

**Purpose**: Guide for comprehensive automated test coverage across all user-facing flows.  
**Generated**: March 2, 2026  
**Total Flows Identified**: 56 primary routes + 3 API endpoints

---

## 1. LANDING FLOWS (1 flow)

### Landing Page Tests
- [ ] **Homepage Load** - Verify landing page renders without errors
- [ ] **Hero Section** - Verify hero content displays correctly
- [ ] **Philosophy Section** - Verify philosophy section content loads
- [ ] **Partners Section** - Verify partner logos/content displays
- [ ] **Curriculum Section** - Verify curriculum roadmap displays
- [ ] **Manifesto Section** - Verify manifesto content loads
- [ ] **Alumni Grid** - Verify alumni cards render and link correctly
- [ ] **CTA Buttons** - Verify call-to-action buttons are clickable
- [ ] **Navigation Links** - Verify all navigation links from landing are functional

**Test Files**:
- `__tests__/landing.spec.ts`
- `e2e/landing.spec.ts`

---

## 2. AUTHENTICATION FLOWS (4 flows + 1 callback)

### Login Flow Tests
- [ ] **Login Form Render** - Form fields (email, password) render correctly
- [ ] **Form Validation** - Required fields validation
- [ ] **Invalid Credentials** - Error message on failed login
- [ ] **Successful Login** - Redirect to dashboard on success
- [ ] **Redirect Parameter** - Redirects to specified URL (e.g., /apply)
- [ ] **Already Logged In** - Redirect to dashboard if already authenticated

### Signup Flow Tests
- [ ] **Signup Form Render** - All form fields display
- [ ] **Email Validation** - Invalid email rejected
- [ ] **Password Requirements** - Password validation rules enforced
- [ ] **Email Duplication** - Prevent duplicate email signup
- [ ] **Successful Signup** - Create account and redirect
- [ ] **Terms & Conditions** - Agreement required before signup

### Forgot Password Flow Tests
- [ ] **Request Form** - Email input displays
- [ ] **Valid Email** - Success message on valid email
- [ ] **Invalid Email** - Error on non-existent email
- [ ] **Email Sent** - Verify password reset email triggered
- [ ] **Reset Link** - Reset link works and allows password change

### Email Verification Flow Tests
- [ ] **Verify Page Renders** - Verification page displays
- [ ] **Valid Token** - Email verified with valid token
- [ ] **Expired Token** - Error on expired token
- [ ] **Resend Email** - Option to resend verification email
- [ ] **Auto-Verify** - Auto-verify from email link

### Auth Callback Route Tests
- [ ] **OAuth Callback** - Handle Supabase auth callback
- [ ] **Session Creation** - User session created after callback
- [ ] **Redirect Logic** - Redirect to correct authenticated page
- [ ] **Error Handling** - Handle callback errors gracefully

**Test Files**:
- `__tests__/auth/login.spec.ts`
- `__tests__/auth/signup.spec.ts`
- `__tests__/auth/password.spec.ts`
- `e2e/auth.spec.ts`

---

## 3. APPLICATION FLOWS (5 flows)

### Apply Landing Flow Tests
- [ ] **Unauthenticated Access** - Redirect to /login?redirect=/apply
- [ ] **First-Time User** - Show "Apply" button and "Check Status" link
- [ ] **Existing Applicant** - Show application status and action buttons
- [ ] **Status Display** - Application status (submitted/under review/accepted/rejected) shows correctly
- [ ] **Navigation Links** - Links to /apply/form, /apply/status, /apply/submitted work

### Application Form Multi-Step Tests

#### Step 0: Basic Info
- [ ] **Form Renders** - All form fields display (name, student ID, email, phone, major, grade, enrollment)
- [ ] **Required Fields** - All required fields marked as required
- [ ] **Student ID Format** - Validates 8+ character student ID
- [ ] **Phone Format** - Auto-formats phone number (###-####-####)
- [ ] **Email Validation** - Invalid email rejected
- [ ] **Next Button** - Step 0 validation before proceeding
- [ ] **Back Button** - Navigate back preserves form data

#### Step 1: Application Questions 1
- [ ] **Q1 Textarea** - "Why startup?" question displays with character counter
- [ ] **Q1 Validation** - Minimum 50 characters enforced
- [ ] **Q2 Textarea** - "What have you built?" question displays
- [ ] **Q2 Validation** - Minimum 50 characters enforced
- [ ] **Q3 Textarea** - "30 weeks after?" question displays
- [ ] **Q3 Validation** - Minimum 50 characters enforced
- [ ] **All Fields Required** - Cannot proceed without all three answers
- [ ] **Character Counter** - Real-time character count updates

#### Step 2: Application Questions 2
- [ ] **Q4 Textarea** - "Friday participation" question displays
- [ ] **Q4 Validation** - Minimum 10 characters enforced
- [ ] **Q5 Textarea** - "Team role" question displays
- [ ] **Q5 Validation** - Minimum 50 characters enforced
- [ ] **Q6 Textarea** - "Additional comments" optional field displays
- [ ] **Optional Field** - Q6 can be empty and proceed
- [ ] **Required Validation** - Cannot proceed without Q4 and Q5

#### Step 3: Consent & Terms
- [ ] **Consent Checkbox** - Checkbox displays and required
- [ ] **Terms Link** - Link to terms of service functional
- [ ] **Submit Button** - Only enabled when consent checked
- [ ] **Submit Action** - Submits application on final step

### Application Submission Tests
- [ ] **Success Redirect** - Redirect to /apply/submitted on success
- [ ] **Success Message** - Display submission confirmation
- [ ] **Server Action** - submitApplication() executes successfully
- [ ] **Database Write** - Application saved to database
- [ ] **User Association** - Application linked to authenticated user
- [ ] **Duplicate Prevention** - Prevent re-submission if already applied

### Application Status View Tests
- [ ] **Status Page Loads** - /apply/status renders
- [ ] **Application Status Display** - Shows current application status
- [ ] **Timeline Display** - Shows application timeline/schedule
- [ ] **Status Updates** - Reflects actual application status
- [ ] **Next Steps** - Shows next steps based on current status

### Application Submitted Confirmation Tests
- [ ] **Confirmation Message** - Success message displays
- [ ] **Next Steps** - Shows what happens next
- [ ] **Navigation Links** - Links to check status work
- [ ] **Back Home** - Link back to home works

**Test Files**:
- `__tests__/apply/apply-landing.spec.ts`
- `__tests__/apply/apply-form.spec.ts`
- `__tests__/apply/apply-validation.spec.ts`
- `__tests__/apply/apply-status.spec.ts`
- `e2e/apply.spec.ts`

---

## 4. BLOG FLOWS (5 flows)

### Blog List Tests
- [ ] **Posts Display** - All blog posts render with title and excerpt
- [ ] **Post Cards** - Each post shows thumbnail, title, date, author
- [ ] **Tag Display** - Tags show on each post card
- [ ] **Pagination** - Paginate if many posts (if implemented)
- [ ] **Tag Filtering** - Click tag filters posts
- [ ] **Search Function** - Search field filters posts (if implemented)
- [ ] **Links Functional** - Click post links to detail view
- [ ] **Admin Edit Button** - Edit button shows only for admins
- [ ] **Write Button** - New post button shows only for admins

### Blog Post Detail Tests
- [ ] **Post Loads** - Blog post renders by slug
- [ ] **Content Display** - Full post content displays correctly
- [ ] **Metadata** - Title, author, date, tags display
- [ ] **Image Rendering** - Blog images render correctly
- [ ] **Links** - Internal and external links work
- [ ] **Related Posts** - Related posts display (if feature exists)
- [ ] **Comment Section** - Comment section displays (if enabled)
- [ ] **Dynamic Metadata** - Page meta tags (OG, title) correct
- [ ] **Share Buttons** - Social share buttons functional (if exist)
- [ ] **Back Link** - Link back to blog list works

### Blog Tag Filter Tests
- [ ] **Tag Page Loads** - /blog/tag/[tag] renders
- [ ] **Correct Posts** - Shows only posts with selected tag
- [ ] **Tag Name Display** - Current tag name displays
- [ ] **Post Count** - Shows number of posts with tag
- [ ] **Filter Works** - Multiple tags filter correctly
- [ ] **Back to All** - Link back to all posts works
- [ ] **No Posts** - Handle empty tag (no posts)

### Blog Write/Create Tests
- [ ] **Auth Guard** - Only admins can access /blog/write
- [ ] **Form Renders** - Post editor form displays
- [ ] **Title Field** - Title input accepts text
- [ ] **Content Editor** - Rich text editor works
- [ ] **Tag Input** - Tag selection/input works
- [ ] **Image Upload** - Image upload to API works
- [ ] **Image Display** - Uploaded images display in editor
- [ ] **Save Draft** - Save draft functionality (if exists)
- [ ] **Publish Button** - Publish creates post
- [ ] **Success Redirect** - Redirect to /blog/[slug] after publish
- [ ] **Meta Fields** - Slug, excerpt, author auto-fill

### Blog Edit Tests
- [ ] **Auth Guard** - Only admins can edit
- [ ] **Post Loads** - Existing post data pre-fills form
- [ ] **Content Editable** - Can edit all fields
- [ ] **Image Management** - Can replace/delete images
- [ ] **Update Submit** - Update saves changes
- [ ] **Success Message** - Confirmation on update
- [ ] **Redirect** - Redirect to updated post

**Test Files**:
- `__tests__/blog/blog-list.spec.ts`
- `__tests__/blog/blog-detail.spec.ts`
- `__tests__/blog/blog-tag.spec.ts`
- `__tests__/blog/blog-admin.spec.ts`
- `e2e/blog.spec.ts`

---

## 5. JOBS FLOWS (3 flows)

### Jobs List Tests
- [ ] **Jobs Load** - All active jobs display
- [ ] **Job Cards** - Each job shows title, company, location, role
- [ ] **Job Details** - Job description snippet displays
- [ ] **Sorting** - Jobs sorted by posted date (newest first)
- [ ] **Location Filter** - Click location filters jobs
- [ ] **Role Filter** - Click role filters jobs
- [ ] **No Active Jobs** - Handle when no active jobs exist
- [ ] **Links Functional** - Click job links to detail (if detail page exists)

### Jobs by Location Tests
- [ ] **Location Filter Works** - Shows only jobs in selected city
- [ ] **Location Name Display** - Current location displays
- [ ] **Job Count** - Shows number of jobs in location
- [ ] **Back to All** - Link to all jobs works
- [ ] **No Jobs** - Handle empty location gracefully

### Jobs by Role Tests
- [ ] **Role Filter Works** - Shows only jobs for selected role
- [ ] **Role Name Display** - Current role displays
- [ ] **Job Count** - Shows number of jobs for role
- [ ] **Back to All** - Link to all jobs works
- [ ] **No Jobs** - Handle empty role gracefully

**Test Files**:
- `__tests__/jobs/jobs-list.spec.ts`
- `__tests__/jobs/jobs-filters.spec.ts`
- `e2e/jobs.spec.ts`

---

## 6. PEOPLE/TEAM FLOWS (2 flows)

### People Directory Tests
- [ ] **Directory Loads** - All team members display
- [ ] **Team Organization** - Members grouped by role (Lead, Engineering, Design, Partnerships, Contents)
- [ ] **Member Cards** - Each member shows photo, name, title, role
- [ ] **Search Function** - Search filters members (if implemented)
- [ ] **Member Links** - Click member links to profile
- [ ] **Bio Preview** - Bio snippet displays on card
- [ ] **Social Icons** - Social media icons display where applicable

### Member Profile Tests
- [ ] **Profile Loads** - Member profile page renders by slug
- [ ] **Profile Content** - Full bio/description displays
- [ ] **Photo** - Member photo displays
- [ ] **Title & Role** - Title and team role display
- [ ] **Social Links** - Social media links functional
- [ ] **Contact Info** - Email/contact info displays (if public)
- [ ] **Related Members** - Suggested members from same team (if exists)
- [ ] **Back Link** - Link back to people directory works
- [ ] **Dynamic Metadata** - Page meta tags correct

**Test Files**:
- `__tests__/people/people-directory.spec.ts`
- `__tests__/people/people-profile.spec.ts`
- `e2e/people.spec.ts`

---

## 7. LIBRARY/RESOURCES FLOWS (3 flows)

### Library Main Tests
- [ ] **Library Loads** - All resources display
- [ ] **Resource Cards** - Each resource shows title, category, date, preview
- [ ] **Category Filters** - Filter by category works
- [ ] **Search Function** - Search resources works
- [ ] **Time Display** - "time ago" helper displays correctly
- [ ] **Resource Links** - Click resource links to detail
- [ ] **No Resources** - Handle empty state

### Library Resource Detail Tests
- [ ] **Resource Loads** - Resource page renders by slug
- [ ] **Content Display** - Full resource content displays
- [ ] **Resource Type** - Display appropriate content type (article, video, etc.)
- [ ] **Download Links** - Download/external links functional
- [ ] **Related Resources** - Suggested related resources display
- [ ] **Back Link** - Link back to library works
- [ ] **Dynamic Metadata** - Page meta tags correct
- [ ] **External Links** - Links open in new tab

### Library Search Tests
- [ ] **Search Page Loads** - /library/search renders
- [ ] **Search Query** - Query parameter works (q=xxx)
- [ ] **Results Display** - Matching resources show
- [ ] **No Results** - Handle empty search results
- [ ] **Clear Search** - Clear search returns to library
- [ ] **Filter Results** - Can filter search results by category
- [ ] **Pagination** - Paginate results if many

**Test Files**:
- `__tests__/library/library-list.spec.ts`
- `__tests__/library/library-detail.spec.ts`
- `__tests__/library/library-search.spec.ts`
- `e2e/library.spec.ts`

---

## 8. ADMIN FLOWS (7 flows)

### Admin Dashboard Tests
- [ ] **Auth Guard** - Only admins can access /admin
- [ ] **Dashboard Loads** - Admin dashboard renders
- [ ] **Sidebar Navigation** - All admin nav items display
- [ ] **Nav Links** - Links to all admin sections work
- [ ] **Stats Display** - Dashboard stats/metrics display (if exists)
- [ ] **Quick Actions** - Quick action buttons work

### Users Management Tests
- [ ] **Users List** - All users display in table
- [ ] **User Info** - Email, role, status displays
- [ ] **Edit User** - Can click to edit user
- [ ] **Change Role** - Can change user role
- [ ] **Activate/Deactivate** - Can toggle user active status
- [ ] **Delete User** - Delete option available (if permitted)
- [ ] **Search Users** - Search/filter users
- [ ] **Pagination** - Paginate if many users

### Applications Management Tests
- [ ] **Applications List** - All applications display
- [ ] **App Info** - Applicant name, status, date displays
- [ ] **View Details** - Can view full application
- [ ] **Change Status** - Can update application status
- [ ] **Accept/Reject** - Can accept or reject application
- [ ] **Feedback** - Can add feedback to application
- [ ] **Search Apps** - Search/filter applications
- [ ] **Export** - Export applications (if feature exists)
- [ ] **Batch Actions** - Bulk status change (if exists)

### Blog Posts Management Tests
- [ ] **Posts List** - All blog posts display
- [ ] **Post Info** - Title, author, date displays
- [ ] **Edit Post** - Can click to edit post
- [ ] **Delete Post** - Can delete post
- [ ] **Publish/Unpublish** - Can toggle post visibility
- [ ] **Preview** - Can preview post
- [ ] **Search Posts** - Search/filter posts
- [ ] **Create New** - New post button works

### Create New Post Tests
- [ ] **Form Renders** - Post creation form displays
- [ ] **Redirects** - Redirects to blog write or displays form
- [ ] **Required Fields** - All required fields enforced
- [ ] **Submit** - Create post successfully

### Jobs Management Tests
- [ ] **Jobs List** - All jobs display (active and inactive)
- [ ] **Job Info** - Title, company, location displays
- [ ] **Edit Job** - Can click to edit job
- [ ] **Delete Job** - Can delete job
- [ ] **Activate/Deactivate** - Can toggle job visibility
- [ ] **Create New** - New job button works
- [ ] **Job Form** - All job fields editable
- [ ] **Publish** - Job published successfully

### Library Management Tests
- [ ] **Resources List** - All library resources display
- [ ] **Resource Info** - Title, category, date displays
- [ ] **Edit Resource** - Can click to edit
- [ ] **Delete Resource** - Can delete resource
- [ ] **Create New** - New resource button works
- [ ] **Category Management** - Can manage categories

### Launches Management Tests
- [ ] **Launches List** - All launches/batches display
- [ ] **Launch Info** - Batch name, date, stats displays
- [ ] **View Details** - Can view launch details
- [ ] **Create New** - New launch button works
- [ ] **Edit Launch** - Can edit launch info
- [ ] **Delete Launch** - Can delete launch
- [ ] **Archive** - Can archive old launches

**Test Files**:
- `__tests__/admin/admin-dashboard.spec.ts`
- `__tests__/admin/admin-users.spec.ts`
- `__tests__/admin/admin-applications.spec.ts`
- `__tests__/admin/admin-posts.spec.ts`
- `__tests__/admin/admin-jobs.spec.ts`
- `__tests__/admin/admin-library.spec.ts`
- `__tests__/admin/admin-launches.spec.ts`
- `e2e/admin.spec.ts`

---

## 9. DASHBOARD FLOWS (2 flows)

### Dashboard Redirect Tests
- [ ] **Redirect Works** - /dashboard redirects to /dashboard/applications
- [ ] **Auth Guard** - Non-authenticated users redirected to login

### User Applications Dashboard Tests
- [ ] **Dashboard Loads** - /dashboard/applications renders
- [ ] **Auth Guard** - Authenticated members only
- [ ] **User's Apps Display** - Shows user's own applications
- [ ] **Sidebar Navigation** - Mobile and desktop sidebars show
- [ ] **App Cards** - Each application shows status, submission date
- [ ] **Click to Detail** - Click app links to detail
- [ ] **No Apps** - Handle when no applications exist
- [ ] **Responsive** - Dashboard responsive on mobile/tablet
- [ ] **Back to Home** - Navigation back to home works

### Application Detail Tests
- [ ] **Detail Page Loads** - /dashboard/applications/[id] renders
- [ ] **Auth Guard** - User can only see their own app
- [ ] **Application Data** - All submitted data displays
- [ ] **Feedback Display** - Admin feedback displays (if exists)
- [ ] **Status Display** - Current status clearly shown
- [ ] **Timeline** - Shows application timeline
- [ ] **Action Buttons** - Edit/update buttons work (if permitted)
- [ ] **Back to Dashboard** - Link back to dashboard works
- [ ] **Print** - Can print application (if feature exists)

**Test Files**:
- `__tests__/dashboard/dashboard.spec.ts`
- `__tests__/dashboard/applications.spec.ts`
- `e2e/dashboard.spec.ts`

---

## 10. PROFILE FLOWS (1 flow)

### User Profile Tests
- [ ] **Profile Loads** - /profile renders
- [ ] **Auth Guard** - Authenticated users only
- [ ] **Profile Data Display** - User info displays (name, email, etc.)
- [ ] **Edit Fields** - Can edit profile fields
- [ ] **Avatar Upload** - Avatar upload works
- [ ] **Avatar Display** - Uploaded avatar displays
- [ ] **Save Changes** - Save successfully updates profile
- [ ] **Validation** - Field validation works
- [ ] **Password Change** - Change password option (if exists)
- [ ] **Account Settings** - Other account settings accessible

**Test Files**:
- `__tests__/profile/profile.spec.ts`
- `__tests__/profile/avatar.spec.ts`
- `e2e/profile.spec.ts`

---

## 11. INFORMATIONAL FLOWS (10+ flows)

### About Page Tests
- [ ] **Page Loads** - /about renders
- [ ] **Content Display** - About content displays
- [ ] **Team Section** - Team/people section displays
- [ ] **Mission** - Mission statement displays

### Curriculum Tests
- [ ] **Page Loads** - /curriculum renders
- [ ] **30-Week Roadmap** - Curriculum roadmap displays
- [ ] **Week Breakdown** - Shows what happens each week
- [ ] **Track Info** - Different tracks/paths display
- [ ] **Links** - Links to related content work

### FAQ Tests
- [ ] **Page Loads** - /faq renders
- [ ] **Accordion** - FAQ items expand/collapse
- [ ] **Content** - FAQ content displays correctly
- [ ] **Search** - Search FAQ (if feature exists)
- [ ] **Print** - Can print FAQs (if feature exists)

### DemoDay Tests
- [ ] **Page Loads** - /demoday renders
- [ ] **Event Info** - Date, time, location displays
- [ ] **Schedule** - Event schedule displays
- [ ] **FAQ Link** - Link to /demoday/faq works
- [ ] **Tips Link** - Link to /demoday/tips works
- [ ] **Registration** - Registration link/button works (if enabled)

### DemoDay FAQ Tests
- [ ] **FAQ Loads** - /demoday/faq renders
- [ ] **DemoDay-Specific FAQs** - FAQs specific to demoday show
- [ ] **Back Link** - Link back to demoday works

### DemoDay Tips Tests
- [ ] **Tips Loads** - /demoday/tips renders
- [ ] **Pitch Tips** - Tips and advice displays
- [ ] **Examples** - Example pitches show (if exists)
- [ ] **Resources** - Related resources link

### Launches Tests
- [ ] **Page Loads** - /launches renders
- [ ] **Launches List** - Past/current launches display
- [ ] **Launch Cards** - Each shows batch name, year, stats
- [ ] **Click Details** - Can view launch details
- [ ] **Timeline** - Launch timeline displays

### Companies Directory Tests
- [ ] **Page Loads** - /companies renders
- [ ] **Companies List** - All companies display
- [ ] **Company Cards** - Shows logo, name, description
- [ ] **Links Work** - Click company links to detail
- [ ] **Filter** - Filter by batch/type (if exists)
- [ ] **Search** - Search companies (if exists)

### Company Detail Tests
- [ ] **Company Loads** - /companies/[slug] renders
- [ ] **Company Info** - Full company info displays
- [ ] **Founder Info** - Founder/team info displays
- [ ] **Links** - Company website link works
- [ ] **Social Links** - Social media links work
- [ ] **Dynamic Meta** - Page meta tags correct

### Founders Directory Tests
- [ ] **Page Loads** - /founders renders
- [ ] **Founders List** - All founders display
- [ ] **Founder Cards** - Shows photo, name, company
- [ ] **Links** - Click founder links to profile (if exists)
- [ ] **Stories** - Founder stories display (if exists)

### Partners Tests
- [ ] **Page Loads** - /partners renders
- [ ] **Partners List** - Partner companies/organizations display
- [ ] **Partner Info** - Name, description displays
- [ ] **Partner Logos** - Logos display correctly
- [ ] **Links** - Partner website links work

### Press/Media Tests
- [ ] **Page Loads** - /press renders
- [ ] **Press Items** - Press mentions/coverage displays
- [ ] **Links** - Links to external articles work
- [ ] **Dates** - Publication dates display

### Legal/Terms Tests
- [ ] **Page Loads** - /legal renders
- [ ] **Terms** - Terms of service displays
- [ ] **Privacy Policy** - Privacy policy displays
- [ ] **Cookies** - Cookie notice (if required)
- [ ] **Print** - Can print legal docs

### Contact Tests
- [ ] **Contact Form** - Contact form renders
- [ ] **Form Fields** - Name, email, message fields work
- [ ] **Submission** - Submit sends message
- [ ] **Validation** - Required fields validated
- [ ] **Confirmation** - Success message displays

### Subscribe Tests
- [ ] **Page Loads** - /subscribe renders
- [ ] **Email Input** - Email field works
- [ ] **Submit** - Subscribe successfully
- [ ] **Confirmation** - Confirmation message or email
- [ ] **Duplicate** - Handle already subscribed

### CoFounder Matching Tests
- [ ] **Page Loads** - /cofounder-matching renders
- [ ] **Profile Matching** - Shows potential cofounders
- [ ] **Filter Options** - Can filter by skills, interests
- [ ] **Contact** - Can message/request cofounder
- [ ] **Auth Required** - Requires login to access advanced features

### VCC Tests
- [ ] **Page Loads** - /vcc renders
- [ ] **Program Info** - VCC program info displays
- [ ] **Schedule** - Class schedule displays
- [ ] **Registration** - Registration link works
- [ ] **Resource Links** - Links to resources work

**Test Files**:
- `__tests__/informational/about.spec.ts`
- `__tests__/informational/curriculum.spec.ts`
- `__tests__/informational/faq.spec.ts`
- `__tests__/informational/demoday.spec.ts`
- `__tests__/informational/launches.spec.ts`
- `__tests__/informational/companies.spec.ts`
- `__tests__/informational/founders.spec.ts`
- `__tests__/informational/partners.spec.ts`
- `__tests__/informational/press.spec.ts`
- `__tests__/informational/legal.spec.ts`
- `__tests__/informational/contact.spec.ts`
- `__tests__/informational/subscribe.spec.ts`
- `__tests__/informational/cofounder.spec.ts`
- `__tests__/informational/vcc.spec.ts`
- `e2e/informational.spec.ts`

---

## 12. API ROUTE TESTS (3 routes)

### Auth Callback Route Tests
- [ ] **Route Accessible** - /api/auth/callback responds
- [ ] **OAuth Handling** - Handle Supabase auth code
- [ ] **Session Creation** - User session created
- [ ] **Redirect** - Redirects to authenticated page
- [ ] **Error Handling** - Handle invalid/expired code
- [ ] **State Validation** - CSRF state parameter validated

### Avatar Upload Route Tests
- [ ] **Route Accessible** - POST /api/profile/avatar responds
- [ ] **Auth Guard** - Requires authenticated user
- [ ] **File Upload** - Accept image file upload
- [ ] **Size Validation** - Validate file size limits
- [ ] **Format Validation** - Accept only image formats
- [ ] **Upload Storage** - File uploads to Supabase Storage
- [ ] **URL Return** - Returns uploaded file URL
- [ ] **Database Update** - User profile updated with avatar URL
- [ ] **Error Handling** - Handle upload errors

### Blog Image Upload Route Tests
- [ ] **Route Accessible** - POST /api/upload/blog-image responds
- [ ] **Auth Guard** - Requires authenticated admin
- [ ] **File Upload** - Accept image file upload
- [ ] **Size Validation** - Validate file size limits
- [ ] **Format Validation** - Accept only image formats
- [ ] **Upload Storage** - File uploads to Supabase Storage
- [ ] **URL Return** - Returns uploaded file URL
- [ ] **Error Handling** - Handle upload errors
- [ ] **Permission Check** - Admin role verification

**Test Files**:
- `__tests__/api/auth.spec.ts`
- `__tests__/api/uploads.spec.ts`
- `e2e/api.spec.ts`

---

## CROSS-CUTTING CONCERNS TESTS

### Navigation Tests
- [ ] **Navbar Renders** - Navbar displays on all pages
- [ ] **Nav Links Work** - All navbar links functional
- [ ] **Mobile Menu** - Mobile menu opens/closes
- [ ] **Auth Dropdown** - User auth dropdown shows/hides
- [ ] **Active States** - Current page highlighted in nav

### Footer Tests
- [ ] **Footer Renders** - Footer displays on all pages
- [ ] **Footer Links** - All footer links work
- [ ] **Social Links** - Social media links work
- [ ] **Contact Info** - Contact information displays

### Responsive Design Tests
- [ ] **Mobile Layout** - Renders on mobile (320px+)
- [ ] **Tablet Layout** - Renders on tablet (768px+)
- [ ] **Desktop Layout** - Renders on desktop (1024px+)
- [ ] **Images Responsive** - Images scale properly
- [ ] **Typography Responsive** - Font sizes scale
- [ ] **Navigation Responsive** - Nav responsive across breakpoints

### Accessibility Tests
- [ ] **Semantic HTML** - Uses semantic elements
- [ ] **ARIA Labels** - Proper aria labels on inputs
- [ ] **Color Contrast** - Text has sufficient contrast
- [ ] **Keyboard Navigation** - Full keyboard navigation works
- [ ] **Screen Reader** - Works with screen readers
- [ ] **Focus Indicators** - Clear focus indicators

### Error Handling Tests
- [ ] **404 Page** - 404 page displays for invalid routes
- [ ] **500 Page** - 500 page displays on server error
- [ ] **Form Errors** - Form errors display clearly
- [ ] **Network Errors** - Handle network failures
- [ ] **Timeout Handling** - Handle request timeouts
- [ ] **Graceful Degradation** - Features degrade gracefully

### Performance Tests
- [ ] **Page Load Time** - Pages load in reasonable time
- [ ] **Image Optimization** - Images optimized
- [ ] **Code Splitting** - Route code splitting works
- [ ] **Lazy Loading** - Images lazy load
- [ ] **Bundle Size** - Bundle size acceptable
- [ ] **Cache Headers** - Proper cache headers set

**Test Files**:
- `__tests__/cross-cutting/navigation.spec.ts`
- `__tests__/cross-cutting/footer.spec.ts`
- `__tests__/cross-cutting/responsive.spec.ts`
- `__tests__/cross-cutting/accessibility.spec.ts`
- `__tests__/cross-cutting/error-handling.spec.ts`
- `__tests__/cross-cutting/performance.spec.ts`

---

## TEST EXECUTION STRATEGY

### Unit Tests
**Path**: `__tests__/**/*.spec.ts`  
**Framework**: Vitest  
**Coverage**: Individual components, utilities, functions  
**Execution**: `npm run test`

### E2E Tests
**Path**: `e2e/**/*.spec.ts`  
**Framework**: Playwright  
**Coverage**: Complete user flows from start to finish  
**Execution**: `npm run test:e2e`

### Coverage Goals
- **Unit Tests**: 80%+ coverage of business logic
- **E2E Tests**: All primary user flows covered
- **Critical Paths**: 100% coverage for critical flows (auth, apply, payments if any)

---

## ESTIMATED TEST COUNT

| Category | Count | Unit | E2E |
|----------|-------|------|-----|
| Landing | 1 | - | 1 |
| Auth | 5 | 3 | 1 |
| Apply | 5 | 3 | 1 |
| Blog | 5 | 3 | 1 |
| Jobs | 3 | 2 | 1 |
| People | 2 | 1 | 1 |
| Library | 3 | 2 | 1 |
| Admin | 7 | 5 | 1 |
| Dashboard | 2 | 2 | 1 |
| Profile | 1 | 1 | 1 |
| Informational | 14 | 7 | 1 |
| API | 3 | 2 | 1 |
| Cross-cutting | 6 | 3 | 1 |
| **TOTAL** | **57** | **34** | **13** |

---

## IMPLEMENTATION PRIORITY

### Phase 1 (Critical - Must Have)
1. Auth flows (login, signup, password reset)
2. Apply flow (form, validation, submission)
3. Basic navigation & responsive design

### Phase 2 (Important - Should Have)
4. Blog flows
5. Dashboard flows
6. Admin dashboard & management flows
7. API route tests

### Phase 3 (Nice to Have)
8. Informational pages
9. Advanced features (filters, search)
10. Performance & optimization tests

---

**Last Updated**: March 2, 2026
