import { test, expect } from '@playwright/test';

test('verify prospects tab on production domain', async ({ page }) => {
  // Navigate to actual production site
  await page.goto('https://content-requests-app.vercel.app/');

  // Wait for page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take a screenshot of the initial state
  await page.screenshot({ path: 'test-results/prod-01-initial.png', fullPage: true });

  console.log('Page title:', await page.title());
  console.log('URL:', page.url());

  // Check if we're on a login page
  const isLoginPage = await page.getByText('Login').count();
  console.log('Is login page:', isLoginPage > 0);

  // List all navigation buttons
  const allButtons = await page.locator('button').allTextContents();
  console.log('All buttons on page:', allButtons.slice(0, 20));

  // Check for Polygon Analytics header (main app indicator)
  const appHeader = await page.getByText('Polygon Analytics').count();
  console.log('App header found:', appHeader > 0);

  // Check if prospects tab exists in mobile nav (visible on small screens)
  const mobileProspectsButton = page.locator('button:has-text("Prospects")').first();
  const mobileButtonExists = await mobileProspectsButton.count();
  console.log('Mobile prospects button count:', mobileButtonExists);

  // Check if prospects tab exists in desktop nav (hidden on small screens)
  const desktopProspectsButton = page.locator('button:has-text("Creator Prospects")');
  const desktopButtonExists = await desktopProspectsButton.count();
  console.log('Desktop prospects button count:', desktopButtonExists);

  // Check for any text containing "Prospect"
  const prospectText = await page.getByText('Prospect', { exact: false }).allTextContents();
  console.log('Text containing "Prospect":', prospectText);

  // Get all tab buttons
  const tabButtons = await page.locator('nav button').allTextContents();
  console.log('All nav buttons:', tabButtons);

  // Take screenshot after checking
  await page.screenshot({ path: 'test-results/prod-02-after-check.png', fullPage: true });

  // Try clicking prospects button if it exists
  if (mobileButtonExists > 0) {
    console.log('Clicking mobile prospects button...');
    await mobileProspectsButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/prod-03-prospects-clicked.png', fullPage: true });

    // Check if prospects header loaded
    const prospectsHeader = await page.getByText('Creator Prospects').count();
    console.log('Prospects header found after click:', prospectsHeader);
  }

  // Final results
  console.log('=== SUMMARY ===');
  console.log('App loaded:', appHeader > 0);
  console.log('Prospects tab found:', (mobileButtonExists + desktopButtonExists) > 0);
});
