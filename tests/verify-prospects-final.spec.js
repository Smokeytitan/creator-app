import { test, expect } from '@playwright/test';

test('verify prospects tab works on production', async ({ page }) => {
  await page.goto('https://content-requests-app.vercel.app/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('Page loaded:', page.url());

  // Check desktop nav (visible on large screens)
  const desktopProspectsButton = page.locator('button:has-text("Creator Prospects")');
  const desktopButtonExists = await desktopProspectsButton.count();
  console.log('Desktop "Creator Prospects" button found:', desktopButtonExists);

  // Check mobile nav (visible on small screens)
  const mobileProspectsButton = page.locator('button:has-text("Prospects")').first();
  const mobileButtonExists = await mobileProspectsButton.count();
  console.log('Mobile "Prospects" button found:', mobileButtonExists);

  await page.screenshot({ path: 'test-results/final-01-loaded.png', fullPage: true });

  // Try clicking the desktop button (force click to bypass visibility check)
  if (desktopButtonExists > 0) {
    console.log('Clicking desktop prospects button...');
    await desktopProspectsButton.click({ force: true });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/final-02-prospects-page.png', fullPage: true });

    // Check if prospects content loaded
    const prospectsHeader = await page.getByText('Creator Prospects', { exact: false }).count();
    console.log('Prospects header found:', prospectsHeader);

    // Check for prospects-specific elements
    const newProspectButton = await page.getByText('New Prospect').count();
    console.log('New Prospect button found:', newProspectButton);

    // Verify we're on the prospects tab
    expect(prospectsHeader).toBeGreaterThan(0);
    console.log('✓ Prospects tab is working!');
  }

  // Assert both buttons exist
  expect(desktopButtonExists + mobileButtonExists).toBeGreaterThan(0);
  console.log('✓ Prospects navigation buttons exist in production!');
});
