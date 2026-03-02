# Playwright Test Guide - Quick Reference

**Document:** Quick reference for writing Playwright tests against SPEC Web  
**Full Reference:** See `USER_FLOWS_AND_UI_ASSERTIONS.md` for complete enumeration  
**Created:** 2026-03-02

---

## Essential Routes & Files

### Authentication
| Flow | Route | File | Key Assertions |
|------|-------|------|---|
| Login | `/login` | `app/login/LoginForm.tsx` | Username/email, password fields, error alerts |
| Signup | `/signup` | `app/signup/SignUpForm.tsx` | 6 input fields, validation messages |
| Password Reset | `/forgot-password` | - | Email input, recovery flow |

### Applications
| Flow | Route | File | Key Assertions |
|------|-------|------|---|
| Apply Landing | `/apply` | `app/apply/page.tsx` | Hero, CTA buttons, timeline section |
| Apply Form | `/apply/form` | `app/apply/form/page.tsx` | 4-step wizard, 14 fields, step progress |
| Status Check | `/apply/status` | `app/apply/status/*.tsx` | Status card, lookup form, badges |

### Dashboard & Admin
| Flow | Route | File | Key Assertions |
|------|-------|------|---|
| User Dashboard | `/dashboard/applications` | `app/dashboard/applications/*.tsx` | Application table, action links |
| Admin Dashboard | `/admin` | `app/admin/page.tsx` | 6 stat cards, user/post/job counts |
| Admin Applications | `/admin/applications` | `app/admin/applications/*.tsx` | Status dropdown, delete button |

---

## Test Selectors (Playwright)

### Login Form
```typescript
// Fields
page.getByLabel('Username or email')
page.getByLabel('Password')

// Buttons
page.getByRole('button', { name: 'Log In' })
page.getByRole('button', { name: 'Logging in...' }) // pending

// Links
page.getByRole('link', { name: 'Create an account' })
page.getByRole('link', { name: 'forgot your username' })

// Alerts
page.getByText('Account created! Please log in.') // success
page.getByText(/Error message/) // error
```

### Application Form (4 Steps)

#### Step 0: Basic Info
```typescript
// Progress indicator
page.getByText('Step 1 of 4')
page.getByText('기본 정보')

// Fields
page.getByLabel('이름 *')
page.getByLabel('학번 *')
page.getByLabel('이메일 *')
page.getByLabel('연락처 *')
page.getByLabel('전공 *')
page.getByLabel('학년 *')
page.getByLabel('현재 상태 *')

// Buttons
page.getByRole('button', { name: '다음 단계로 →' })
```

#### Step 1 & 2: Essay Questions
```typescript
page.getByText('Step 2 of 4')
page.getByText('지원 질문 (1/2)')

// Character counters
page.getByText(/현재 \d+자/)

// Fields
page.getByLabel(/Q1\. 왜 창업인가요/)
page.getByLabel(/Q2\. 지금까지 직접 해본/)
page.getByLabel(/Q3\. SPEC에서의 30주/)
```

#### Step 3: Consent
```typescript
page.getByText('Step 4 of 4')
page.getByText('개인정보 수집 및 동의')

// Consent checkbox
page.getByRole('checkbox', { name: /개인정보 수집/ })

// Submit button
page.getByRole('button', { name: '최종 제출하기 →' })
```

### Application Status Card
```typescript
page.getByText('지원 현황')
page.getByText('지원자')
page.getByText('현재 상태')

// Status badges
page.getByText('접수완료')    // pending
page.getByText('심사중')     // under_review
page.getByText('합격')       // accepted
page.getByText('불합격')     // rejected

// Conditional messages
page.getByText('축하합니다! 합격하셨습니다')  // if accepted
page.getByText('아쉽게도 이번에는')        // if rejected
```

### Dashboard Applications
```typescript
page.getByText('지원서 목록')
page.getByText(/총 \d+개/)

// Table headers (desktop)
page.getByRole('columnheader', { name: '지원자' })
page.getByRole('columnheader', { name: '상태' })

// Action links
page.getByRole('link', { name: '열람하기' })
page.getByRole('button', { name: /delete|삭제/ })
```

### Admin Dashboard
```typescript
page.getByText('Admin Dashboard')

// Stat cards
page.getByText('Total Users')
page.getByText('Total Posts')
page.getByText('Published Posts')
page.getByText('Comments')
page.getByText('Jobs')
page.getByText('Library Items')

// Sidebar
page.getByRole('link', { name: 'Dashboard' })
page.getByRole('link', { name: 'Applications' })
page.getByRole('link', { name: 'Users' })
page.getByRole('link', { name: 'Posts' })
```

### Admin Applications
```typescript
page.getByText('Applications')
page.getByText(/총 \d+건/)

// Status dropdown (CustomSelect)
page.getByRole('button', { name: /접수완료|심사중|합격|불합격/ })

// Options in dropdown
page.getByText('접수완료')
page.getByText('심사중')
page.getByText('합격')
page.getByText('불합격')
```

---

## Color & Styling Constants

### Status Badge Colors
```
pending:     #FFF0E5 (bg) + #FF6C0F (text)  → "접수완료"
under_review: #E8F0FE (bg) + #2563EB (text) → "심사중"
accepted:    #E6F9E6 (bg) + #2f9e44 (text)  → "합격"
rejected:    #FEE2E2 (bg) + #b42318 (text)  → "불합격"
```

### Alert Colors
```
Error:       #fdecec (bg) + #b42318 (text)
Success:     #fff4e9 (bg) + #b64a00 (text)
```

### Brand Colors
```
Primary Dark:  #16140f
Primary Orange: #FF6C0F
Border:        #ddd9cc
Background:    #f5f5ee / #fcfcf8
Text:          #4a4a40 / #6b6b5e / #9a9a8c
```

---

## Form Field Names & Validation Rules

### Application Form Field Names (for FormData)
```typescript
// Step 0
name, student_id, email, phone, major, grade, enrollment_status, batch

// Step 1
introduction, vision, startup_idea

// Step 2
portfolio_url, experience_extra, additional_comments

// Step 3
consent (checkbox)
```

### Validation Rules
```
name:                 2-50 chars
student_id:           8-10 digits
email:                valid email format
phone:                KR format (01X-XXXX-XXXX)
major:                1-100 chars
introduction (Q1):    50-5000 chars
vision (Q2):          50-5000 chars
startup_idea (Q3):    50-5000 chars
portfolio_url (Q4):   10-5000 chars
experience_extra (Q5): 50-5000 chars
additional_comments:  0-5000 chars (optional)
```

---

## Middleware & Protection

### Routes Requiring Authentication
- `/profile` and sub-routes
- `/blog/write` and `/blog/edit`
- `/admin` and sub-routes

### Behavior
- Unauthenticated users redirected to `/login`
- Non-admin users accessing `/admin` redirected to `/`
- Writer routes check for "member" or "admin" role

---

## Common Test Patterns

### Pattern 1: Login & Verify
```typescript
test('user can login and access dashboard', async ({ page }) => {
  await page.goto('/login');
  
  await page.getByLabel('Username or email').fill('user@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Log In' }).click();
  
  await expect(page).toHaveURL('/');
  // or verify session, etc.
});
```

### Pattern 2: Form Multi-Step
```typescript
test('user can complete application form', async ({ page }) => {
  // Step 0: Basic Info
  await page.getByLabel('이름 *').fill('홍길동');
  await page.getByLabel('학번 *').fill('20240000');
  // ... fill other fields
  await page.getByRole('button', { name: '다음 단계로 →' }).click();
  
  // Step 1: Q1-Q3
  await page.getByLabel(/Q1\. 왜 창업/).fill('A'.repeat(50));
  // ... fill Q2, Q3
  await page.getByRole('button', { name: '다음 단계로 →' }).click();
  
  // Step 2: Q4-Q6
  await page.getByLabel(/Q4\. SPEC/).fill('A'.repeat(10));
  // ... fill Q5
  await page.getByRole('button', { name: '다음 단계로 →' }).click();
  
  // Step 3: Consent
  await page.getByRole('checkbox', { name: /개인정보/ }).check();
  await page.getByRole('button', { name: '최종 제출하기 →' }).click();
  
  // Verify success
  await expect(page.getByText('지원이 완료되었습니다!')).toBeVisible();
});
```

### Pattern 3: Error Validation
```typescript
test('form shows validation error', async ({ page }) => {
  await page.getByLabel('이름 *').fill('X'); // < 2 chars
  await page.getByRole('button', { name: '다음 단계로 →' }).click();
  
  await expect(page.getByText(/기본 정보의 모든 필수 항목/)).toBeVisible();
});
```

### Pattern 4: Admin Status Update
```typescript
test('admin can update application status', async ({ page }) => {
  await page.goto('/admin/applications');
  
  // Click status dropdown
  const statusButton = page.locator('button').filter({ has: page.getByText('접수완료') }).first();
  await statusButton.click();
  
  // Select new status
  await page.getByText('합격').click();
  
  // Verify update
  await expect(page.getByText('합격')).toBeVisible();
});
```

---

## Key File Locations (Summary)

```
# Pages
app/login/page.tsx                    ← Login page
app/signup/page.tsx                   ← Signup page
app/apply/page.tsx                    ← Apply landing
app/apply/form/page.tsx               ← Apply form (4-step wizard)
app/apply/status/page.tsx             ← Status check page
app/dashboard/applications/page.tsx   ← User dashboard
app/admin/page.tsx                    ← Admin dashboard
app/admin/applications/page.tsx       ← Admin applications

# Components
app/login/LoginForm.tsx               ← Login form logic
app/signup/SignUpForm.tsx             ← Signup form logic
app/apply/status/ApplicationStatusCard.tsx  ← Status card component
app/apply/status/StatusCheckForm.tsx  ← Unauthenticated status check
components/ui/ApplyButton.tsx         ← CTA button component
components/ui/CustomSelect.tsx        ← Dropdown select component
components/dashboard/DeleteApplicationButton.tsx  ← Delete action

# Admin
app/admin/AdminSidebar.tsx            ← Sidebar navigation
app/admin/applications/ApplicationsClient.tsx  ← Admin applications table

# Middleware & Auth
middleware.ts                         ← Route protection logic
lib/auth.ts                           ← Auth utilities
lib/actions/applications.ts           ← Application actions
```

---

## Status Badge Reference

When testing status displays, look for these exact text+color combinations:

| Status | Display Text | Badge Color | File Location |
|--------|--------------|-------------|---|
| pending | 접수완료 | bg-[#FFF0E5] text-[#FF6C0F] | ApplicationStatusCard.tsx line 9 |
| under_review | 심사중 | bg-[#E8F0FE] text-[#2563EB] | ApplicationStatusCard.tsx line 10 |
| accepted | 합격 | bg-[#E6F9E6] text-[#2f9e44] | ApplicationStatusCard.tsx line 11 |
| rejected | 불합격 | bg-[#FEE2E2] text-[#b42318] | ApplicationStatusCard.tsx line 12 |

---

## Important Notes for Test Writers

1. **Korean Text Labels:** Many labels are in Korean. Use `page.getByText()` or `page.getByLabel()` to find them.

2. **Step Progress:** Application form uses client-side step state (0-3). Step header text is "Step {N} of 4" where N = step + 1.

3. **Character Counters:** Real-time character count shown for essay questions. Test both minimum length (50 chars) and max length (5000 chars).

4. **Date Formatting:** Application dates are formatted using `Intl.DateTimeFormat('ko-KR')`.

5. **Status Updates:** Admin status changes trigger `router.refresh()`, so page content should update after status select.

6. **Redirect Behavior:**
   - Unauthenticated `/apply` → redirects to `/login?redirect=/apply`
   - Non-admin `/admin` → redirects to `/`
   - After signup → redirects to `/login?registered=true`

7. **Phone Number Format:** Phone input auto-formats to XXX-XXXX-XXXX pattern.

8. **Consent Checkbox Required:** Submit button disabled until checkbox is checked.

9. **Error Alerts:** Use red styling with `.bg-[#fdecec]` and `.text-[#b42318]`.

10. **Rate Limiting:** Application submissions have rate limit (3 per 15 minutes per IP).

---

**For comprehensive flow details, see: `USER_FLOWS_AND_UI_ASSERTIONS.md`**
