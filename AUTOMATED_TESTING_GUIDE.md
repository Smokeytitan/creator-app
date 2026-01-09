# Automated Testing Guide for Employee X Growth Program

**Date:** January 8, 2026
**Purpose:** Comprehensive guide for automated testing of new features
**Tools:** Playwright, Node.js, Next.js Dev Server

---

## Overview

This guide addresses the critical question:

> "Why should I be testing everything fully when an AI should be able to do everything?"

**Answer:** You're absolutely right. This guide establishes automated testing tools that can verify all features work correctly before presenting them to you.

---

## Philosophy: Test Before Presenting

### The Problem

Previously, features were developed and presented as "working" based on:
1. Code compilation succeeding
2. No obvious syntax errors
3. Logical correctness of the code

**But this missed:**
- Runtime errors
- Caching issues
- API route 404s
- State management bugs
- Browser-specific issues

### The Solution

**Test every feature in a real browser before claiming it works.**

This means:
1. Start the dev server
2. Open a real Chromium browser
3. Simulate user interactions (click, type, submit)
4. Capture API calls and responses
5. Verify UI updates correctly
6. Take screenshots on failure

---

## Testing Tools Included

### 1. Browser Console Scanner

**File:** `.devtools/browser-console-scanner.js`

**Purpose:** Scans all routes for JavaScript errors

**Usage:**
```bash
node .devtools/browser-console-scanner.js
```

**What it does:**
- Opens Playwright browser
- Visits each admin route
- Captures console errors, page errors, failed requests
- Takes screenshots of each page
- Generates summary report

**When to use:**
- After adding new routes
- After modifying shared components
- Before presenting "route scanning" as complete

**Example output:**
```
╔════════════════════════════════════════════════════╗
║     Browser Console Scanner (Playwright)          ║
╚════════════════════════════════════════════════════╝

Testing: Content Requests
URL: http://localhost:3002/admin/requests
✓ No errors detected
Screenshot saved: /tmp/playwright-content-requests.png

FINAL SCAN SUMMARY
Total routes scanned: 6
Routes with errors: 0
Total console errors: 0
```

### 2. CRUD Operations Tester

**File:** `.devtools/test-crud-operations.js`

**Purpose:** Tests Create, Read, Update, Delete functionality

**Usage:**
```bash
node .devtools/test-crud-operations.js
```

**What it does:**
- Opens non-headless browser (you can watch it run)
- Navigates to Content Requests
- Clicks Edit button
- Modifies form data
- Submits update
- Verifies changes persist
- Tests Delete with confirmation

**Test coverage:**
- ✅ Navigate to page
- ✅ Edit button exists
- ✅ Modal opens on click
- ✅ Form is pre-filled
- ✅ Form modification works
- ✅ PATCH request succeeds
- ✅ Modal closes after save
- ✅ Changes visible on page
- ✅ Delete button exists
- ✅ Confirmation dialog appears

**When to use:**
- After implementing edit/delete features
- Before claiming CRUD operations work
- When user reports "changes not saving"

**Current issue:** Requires authentication. Update needed to handle login flow.

### 3. API Call Monitor

**File:** `.devtools/watch-api-calls.js`

**Purpose:** Real-time monitoring of API requests/responses

**Usage:**
```bash
node .devtools/watch-api-calls.js
```

**What it does:**
- Opens browser to Content Requests page
- Intercepts all network requests
- Logs API calls to terminal with full request/response bodies
- Captures errors in real-time
- Keeps browser open for manual testing

**Output example:**
```
→ PATCH http://localhost:3002/api/admin/content-requests/cmk...
  Request Body:
  {
    "title": "Polygon zkEVM Launch Week (Modified)",
    "description": "...",
    "rewardAmount": 15,
    ...
  }

← PATCH http://localhost:3002/api/admin/content-requests/cmk...
  Status: 200 OK
  Response Body:
  {
    "success": true,
    "contentRequest": { ... }
  }
```

**When to use:**
- When user reports "save not working"
- To debug API issues
- To verify request/response format
- To capture 404 or 500 errors

**Advantage:** Real-time monitoring while you manually test in the browser.

---

## Testing Workflow for New Features

### Step 1: Plan the Feature

Before writing code, identify:
1. What routes will be affected?
2. What API endpoints are needed?
3. What user interactions are involved?
4. What data must persist?

### Step 2: Implement the Feature

Write the code:
- API routes
- Components
- State management
- Form validation

### Step 3: Start Dev Server

```bash
npm run dev
```

Verify it starts without errors and note the port (usually 3002).

### Step 4: Run Automated Tests

#### 4a. Test Routes (if new routes added)

```bash
node .devtools/browser-console-scanner.js
```

**Success criteria:**
- All routes load without errors
- No console errors
- Screenshots show correct UI

#### 4b. Test CRUD Operations (if edit/delete added)

```bash
node .devtools/test-crud-operations.js
```

**Success criteria:**
- All tests pass (green checkmarks)
- Edit modal opens
- Changes persist after save
- Delete with confirmation works

#### 4c. Monitor API Calls (for debugging)

```bash
node .devtools/watch-api-calls.js
```

Then manually:
1. Log in
2. Navigate to the feature
3. Perform actions (edit, delete, etc.)
4. Watch terminal for API logs

**Success criteria:**
- PATCH/DELETE requests return 200
- Response body shows `success: true`
- Request body contains expected data

### Step 5: Manual Verification

Even with automated tests, manually verify:
1. Open browser to `http://localhost:3002`
2. Log in
3. Test the feature end-to-end
4. Refresh the page (F5) to ensure persistence
5. Check browser DevTools Console for errors

### Step 6: Document Results

Update the feature documentation with:
- Test results
- Screenshots
- Known issues
- Manual testing checklist

### Step 7: Present to User

Only now, after all tests pass, say:

✅ "Feature implemented and tested. All automated tests pass."

Instead of:

❌ "Feature implemented. Try it and let me know if it works."

---

## Handling Authentication in Tests

### Current Limitation

Most tests fail at login because they don't have a session cookie.

**Error:**
```
GET /admin/requests → 302 redirect to /login
```

### Solution 1: Mock Authentication

Create `.devtools/test-config.json`:

```json
{
  "testUser": {
    "email": "admin@polygon.technology",
    "password": "test-password"
  }
}
```

Update test scripts to:
1. Navigate to `/login`
2. Fill in email/password
3. Click submit
4. Wait for redirect to `/admin`
5. Proceed with tests

### Solution 2: Use Session Cookies

Manually log in once, then export cookies:

```javascript
// In browser console:
document.cookie
// Copy the session token

// In test script:
await context.addCookies([
  {
    name: 'next-auth.session-token',
    value: '<your-session-token>',
    domain: 'localhost',
    path: '/'
  }
])
```

### Solution 3: Test Against Production (with test user)

Deploy to Vercel preview URL and test against real auth.

---

## Writing New Test Scripts

### Template for Feature Tests

```javascript
const { chromium } = require('playwright')

async function testNewFeature() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page = await context.newPage()

  const results = { passed: [], failed: [] }

  try {
    // TEST 1: Navigate to page
    await page.goto('http://localhost:3002/admin/feature')
    results.passed.push('Navigation')

    // TEST 2: Verify element exists
    const element = await page.locator('.feature-button').count()
    if (element > 0) {
      results.passed.push('Element exists')
    } else {
      results.failed.push('Element not found')
    }

    // TEST 3: Interact with element
    await page.locator('.feature-button').click()
    await page.waitForTimeout(500)

    const modalVisible = await page.locator('.modal').isVisible()
    if (modalVisible) {
      results.passed.push('Modal opens')
    } else {
      results.failed.push('Modal did not open')
    }

    // TEST 4: Verify API call
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/feature'),
      { timeout: 5000 }
    )

    await page.locator('button:has-text("Submit")').click()

    const response = await responsePromise
    const data = await response.json()

    if (response.status() === 200 && data.success) {
      results.passed.push('API call succeeded')
    } else {
      results.failed.push(`API call failed: ${data.error}`)
    }

  } catch (error) {
    results.failed.push(`Test error: ${error.message}`)
    await page.screenshot({ path: '/tmp/test-error.png' })
  }

  await browser.close()

  // Print results
  console.log(`\n✅ Passed: ${results.passed.length}`)
  results.passed.forEach(test => console.log(`  • ${test}`))

  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`)
    results.failed.forEach(test => console.log(`  • ${test}`))
    process.exit(1)
  }

  console.log('\n🎉 All tests passed!')
  process.exit(0)
}

testNewFeature().catch(console.error)
```

### Checklist for Test Scripts

✅ Test runs in non-headless mode (so you can watch it)
✅ Captures screenshots on errors
✅ Logs request/response bodies
✅ Verifies data persistence (page refresh test)
✅ Has clear pass/fail output
✅ Exits with proper code (0 for success, 1 for failure)

---

## Pre-commit Testing Checklist

Before presenting any new feature:

- [ ] Dev server starts without errors
- [ ] Route loads without 404
- [ ] No console errors in browser DevTools
- [ ] API endpoints return 200 (not 404 or 500)
- [ ] UI elements render correctly
- [ ] User interactions work (click, type, submit)
- [ ] Data persists after save
- [ ] Page refresh shows updated data
- [ ] Delete with confirmation works
- [ ] Automated test script passes
- [ ] Screenshots captured for documentation
- [ ] Error handling tested (try invalid input)

---

## Debugging Failed Tests

### Test fails at navigation

**Error:** `net::ERR_CONNECTION_REFUSED`

**Solution:**
```bash
# Check if dev server is running
lsof -i:3002

# Start dev server if not running
npm run dev
```

### Test fails at authentication

**Error:** `GET /admin/feature → 302 redirect to /login`

**Solution:**
- Add login flow to test script
- Or manually log in and export session cookies

### Test fails at element not found

**Error:** `page.waitForSelector: Timeout 5000ms exceeded`

**Solution:**
```bash
# Take screenshot to see what's actually on the page
await page.screenshot({ path: '/tmp/debug.png', fullPage: true })

# Check if element selector is correct
await page.locator('button').count() // Count all buttons
await page.textContent('body') // Get all text on page
```

### Test fails at API call

**Error:** `PATCH /api/endpoint 404`

**Solution:**
```bash
# Restart dev server to rebuild routes
npm run dev

# Verify API route file exists
ls -la app/api/endpoint/
```

---

## Integration with Development Workflow

### Option 1: Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
echo "Running automated tests..."

# Start dev server in background
npm run dev > /tmp/dev-test.log 2>&1 &
DEV_PID=$!

# Wait for server to start
sleep 5

# Run tests
node .devtools/browser-console-scanner.js

TEST_RESULT=$?

# Kill dev server
kill $DEV_PID

if [ $TEST_RESULT -ne 0 ]; then
  echo "❌ Tests failed. Commit aborted."
  exit 1
fi

echo "✅ Tests passed. Proceeding with commit."
exit 0
```

### Option 2: GitHub Actions (Future)

When deploying to production, run tests automatically on every PR:

```yaml
# .github/workflows/test.yml
name: Automated Tests

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npx playwright install chromium
      - run: npm run dev & sleep 10
      - run: node .devtools/test-crud-operations.js
```

### Option 3: Manual Testing Script

Create `test-all.sh`:

```bash
#!/bin/bash

echo "╔════════════════════════════════════════════════════╗"
echo "║         Running All Automated Tests                ║"
echo "╚════════════════════════════════════════════════════╝"

# Start dev server
echo "\n📦 Starting dev server..."
npm run dev > /tmp/test-dev.log 2>&1 &
DEV_PID=$!
sleep 5

# Test 1: Route scanning
echo "\n🔍 Test 1: Scanning routes for errors..."
node .devtools/browser-console-scanner.js
RESULT1=$?

# Test 2: CRUD operations
echo "\n📝 Test 2: Testing CRUD operations..."
node .devtools/test-crud-operations.js
RESULT2=$?

# Kill dev server
kill $DEV_PID

# Summary
echo "\n════════════════════════════════════════════════════"
echo "TEST SUMMARY"
echo "════════════════════════════════════════════════════"

if [ $RESULT1 -eq 0 ]; then
  echo "✅ Route scanning: PASSED"
else
  echo "❌ Route scanning: FAILED"
fi

if [ $RESULT2 -eq 0 ]; then
  echo "✅ CRUD operations: PASSED"
else
  echo "❌ CRUD operations: FAILED"
fi

if [ $RESULT1 -eq 0 ] && [ $RESULT2 -eq 0 ]; then
  echo "\n🎉 All tests passed!"
  exit 0
else
  echo "\n⚠️  Some tests failed. Check output above."
  exit 1
fi
```

Usage:
```bash
chmod +x test-all.sh
./test-all.sh
```

---

## Best Practices

### 1. Always Test in a Real Browser

**Don't rely on:**
- Code review alone
- "It compiles, so it works"
- Checking the database directly

**Do:**
- Run Playwright tests
- Open the browser and test manually
- Verify API responses in browser DevTools

### 2. Test Data Persistence

**Always verify:**
- Data saves to database
- Page refresh shows updated data
- Browser hard refresh (Cmd+Shift+R) still shows changes

**Test:**
```javascript
// After updating data:
await page.click('button:has-text("Save")')
await page.waitForTimeout(1000)

// Reload the page
await page.reload()

// Verify data is still there
const updatedText = await page.textContent('.title')
expect(updatedText).toBe('Updated Title')
```

### 3. Capture All Errors

**In test scripts:**
```javascript
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.error(`[BROWSER] ${msg.text()}`)
  }
})

page.on('pageerror', error => {
  console.error(`[PAGE ERROR] ${error.message}`)
})

page.on('requestfailed', request => {
  console.error(`[NETWORK] ${request.url()} failed`)
})
```

### 4. Take Screenshots on Failure

**Always include:**
```javascript
} catch (error) {
  await page.screenshot({
    path: '/tmp/test-failure.png',
    fullPage: true
  })
  console.error(`Screenshot saved: /tmp/test-failure.png`)
  throw error
}
```

### 5. Test Edge Cases

**Don't just test the happy path:**
- Invalid form input
- Missing required fields
- Date validation (end before start)
- Deleting items with dependencies
- Network failures (disconnect and retry)

---

## Conclusion

**Key Principle:**

> "Don't claim a feature works until automated tests pass in a real browser."

**Tools provided:**
1. ✅ Browser console scanner
2. ✅ CRUD operations tester
3. ✅ API call monitor

**Workflow:**
1. Write code
2. Run automated tests
3. Fix any failures
4. Run tests again
5. Only then present as "working"

**Why this matters:**
- Saves user time (no manual testing of broken features)
- Builds trust (features actually work when presented)
- Catches issues early (before user reports them)
- Documents expected behavior (tests serve as specs)

---

**Next Steps:**

1. Update test scripts to handle authentication
2. Add more feature-specific test scripts
3. Create GitHub Actions workflow for CI/CD
4. Set up test database for isolated testing
5. Add performance benchmarks (load time, API response time)

**Testing Status:** ✅ Framework established
**Documentation:** ✅ Complete
**User Benefit:** No more "try it and see if it works" - features are tested before presentation
