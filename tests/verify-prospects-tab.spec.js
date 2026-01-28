import { test, expect } from '@playwright/test';

test('verify prospects tab exists on production', async ({ page }) => {
  // Navigate to production site
  await page.goto('https://content-requests-k52b4rf66-ntruslow-1248s-projects.vercel.app');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Take a screenshot of the initial state
  await page.screenshot({ path: 'test-results/01-initial-page.png', fullPage: true });

  console.log('Page title:', await page.title());

  // Check for navigation elements
  const mobileNav = await page.locator('.lg\\:hidden nav').count();
  const desktopNav = await page.locator('.hidden.lg\\:block nav').count();

  console.log('Mobile nav found:', mobileNav);
  console.log('Desktop nav found:', desktopNav);

  // Look for any button containing "Prospect"
  const prospectButtons = await page.getByText('Prospect', { exact: false }).count();
  console.log('Buttons containing "Prospect":', prospectButtons);

  // List all navigation buttons
  const allButtons = await page.locator('button').allTextContents();
  console.log('All buttons on page:', allButtons);

  // Check if prospects tab exists in mobile nav
  const mobileProspectsButton = page.locator('button:has-text("Prospects")').first();
  const mobileButtonExists = await mobileProspectsButton.count();
  console.log('Mobile prospects button exists:', mobileButtonExists > 0);

  // Check if prospects tab exists in desktop nav
  const desktopProspectsButton = page.locator('button:has-text("Creator Prospects")');
  const desktopButtonExists = await desktopProspectsButton.count();
  console.log('Desktop prospects button exists:', desktopButtonExists > 0);

  // Take screenshot after checking
  await page.screenshot({ path: 'test-results/02-after-check.png', fullPage: true });

  // Try to click on prospects if it exists (mobile)
  if (mobileButtonExists > 0) {
    await mobileProspectsButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/03-prospects-clicked.png', fullPage: true });

    // Check if prospects content loaded
    const prospectsHeader = await page.getByText('Creator Prospects').count();
    console.log('Prospects header found after click:', prospectsHeader);
  }

  // Get the HTML of the navigation area
  const navHTML = await page.locator('nav').first().innerHTML();
  console.log('Navigation HTML:', navHTML.substring(0, 500));

  // Check console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Reload to catch console messages
  await page.reload();
  await page.waitForLoadState('networkidle');

  console.log('Console errors:', errors);

  // Final assertion
  expect(mobileButtonExists + desktopButtonExists).toBeGreaterThan(0);
});
