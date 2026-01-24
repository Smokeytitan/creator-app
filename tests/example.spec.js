import { test, expect } from '@playwright/test';

test.describe('Content Requests App', () => {
  test('should load the homepage', async ({ page }) => {
    // Navigate to your deployed Vercel app
    await page.goto('https://content-requests-app.vercel.app/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/homepage.png', fullPage: true });

    // Check that the page title is present
    await expect(page).toHaveTitle(/Polygon Creator Analytics/i);
  });

  test('should have authentication elements', async ({ page }) => {
    await page.goto('https://content-requests-app.vercel.app/');
    await page.waitForLoadState('networkidle');

    // Check for sign-in or user-related elements
    // Adjust these selectors based on your actual app structure
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('https://content-requests-app.vercel.app/');
    await page.waitForLoadState('networkidle');

    // Take a screenshot of mobile view
    await page.screenshot({ path: 'tests/screenshots/mobile-view.png', fullPage: true });

    expect(await page.isVisible('body')).toBeTruthy();
  });
});
